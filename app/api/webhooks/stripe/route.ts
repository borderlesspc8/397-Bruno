import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import Stripe from "stripe";
import { dynamic, fetchCache, revalidate } from '../../_utils/dynamic-config';

// Verificar ambiente de execução
const isDevelopment = process.env.NODE_ENV !== 'production';

// Usar valores simulados durante o desenvolvimento se as variáveis de ambiente não estiverem definidas
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || (isDevelopment ? 'sk_test_mock_key_for_development' : '');
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || (isDevelopment ? 'whsec_mock_webhook_secret_for_development' : '');

// Adicionar logs para depuração
console.log(`[STRIPE_WEBHOOK] Ambiente: ${isDevelopment ? 'desenvolvimento' : 'produção'}`);
console.log(`[STRIPE_WEBHOOK] Usando chave secreta simulada: ${STRIPE_SECRET_KEY.startsWith('sk_test_mock')}`);
console.log(`[STRIPE_WEBHOOK] Usando webhook secret simulado: ${STRIPE_WEBHOOK_SECRET.startsWith('whsec_mock')}`);

// Configurar o Stripe com a chave secreta
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as any, // Utilizando uma versão estável atual
});

// Usar o webhook secret configurado
const webhookSecret = STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    // Em ambiente de desenvolvimento, sempre retornar uma resposta simulada
    if (isDevelopment) {
      console.log('[STRIPE_WEBHOOK] Ambiente de desenvolvimento detectado. Simulando resposta de webhook do Stripe.');
      return NextResponse.json({ 
        received: true, 
        environment: 'development', 
        simulated: true 
      });
    }

    // Código para ambiente de produção
    const body = await req.text();
    const signature = req.headers.get("stripe-signature") || '';

    console.log(`[STRIPE_WEBHOOK] Recebido webhook, tamanho do corpo: ${body.length}`);
    console.log(`[STRIPE_WEBHOOK] Assinatura presente: ${!!signature}`);
    
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log(`[STRIPE_WEBHOOK] Evento construído com sucesso: ${event.type}`);
    } catch (error: any) {
      console.error(`[STRIPE_WEBHOOK] Falha na verificação da assinatura: ${error.message}`);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${error.message}` },
        { status: 400 }
      );
    }

    // Tratar eventos do Stripe
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (!session.customer || !session.metadata?.userId) {
          console.error("Faltando customer ID ou user ID no evento");
          return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
        }

        // Atualizar assinatura na base de dados
        await handleSubscriptionCreation(
          session.metadata.userId,
          session.customer.toString(),
          session.metadata.plan || "FREE",
        );

        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription && invoice.customer) {
          await updateSubscriptionStatus(
            invoice.customer.toString(),
            "ACTIVE"
          );
        }
        
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription && invoice.customer) {
          await updateSubscriptionStatus(
            invoice.customer.toString(),
            "PAST_DUE"
          );
        }
        
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        await updateSubscriptionStatus(
          subscription.customer.toString(),
          "CANCELED"
        );
        
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`[STRIPE_WEBHOOK] Erro no webhook: ${error.message}`, error);
    return NextResponse.json(
      { error: "Erro interno no webhook", message: error.message },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreation(
  userId: string,
  stripeCustomerId: string,
  planType: string
) {
  try {
    // Buscar informações da assinatura no Stripe
    const customerSubscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      limit: 1,
    });

    if (customerSubscriptions.data.length === 0) {
      console.error("Nenhuma assinatura encontrada para este cliente");
      return;
    }

    const subscription = customerSubscriptions.data[0];
    const endDate = new Date(subscription.current_period_end * 1000);
    const status = subscription.status === "active" ? "ACTIVE" : "PAST_DUE";

    // Atualizar no banco de dados
    await db.subscription.upsert({
      where: { userId },
      update: {
        plan: planType,
        status: status as any,
        endDate,
        updatedAt: new Date(),
      },
      create: {
        userId,
        plan: planType,
        status: status as any,
        startDate: new Date(),
        endDate,
        renewalDate: endDate,
      },
    });

    console.log(`Assinatura ${subscription.id} do usuário ${userId} atualizada com sucesso`);
  } catch (error) {
    console.error("Erro ao atualizar assinatura:", error);
  }
}

async function updateSubscriptionStatus(
  stripeCustomerId: string,
  status: string
) {
  try {
    const subscriptions = await db.subscription.findMany({
      where: { 
        user: { 
          email: stripeCustomerId  // Usando email como identificador alternativo
        } 
      }
    });
    
    for (const subscription of subscriptions) {
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: status as any,
          updatedAt: new Date(),
        },
      });
    }

    console.log(`Status da assinatura do cliente ${stripeCustomerId} atualizado para ${status}`);
  } catch (error) {
    console.error("Erro ao atualizar status da assinatura:", error);
  }
}

// Exportar as configurações para esta rota
export { dynamic, fetchCache, revalidate };
