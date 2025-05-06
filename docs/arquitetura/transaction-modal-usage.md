# Guia de Uso: Componente Modal de Transação Unificado

Este documento explica como usar o novo componente unificado de modal para adicionar e editar transações em todo o aplicativo.

## Visão Geral

O sistema agora oferece um componente reutilizável para adicionar/editar transações que:

1. Funciona como um modal, evitando navegações desnecessárias entre páginas
2. É totalmente customizável e pode ser usado em qualquer parte da aplicação
3. Gerencia automaticamente a carga de dados (carteiras, categorias, etc.)
4. Lida adequadamente com diferentes tipos de transações (despesas, receitas, transferências)

## Componentes Disponíveis

### 1. AddTransactionButton

Um botão pré-configurado que abre o modal de transação.

```tsx
import { AddTransactionButton } from "@/app/_components/AddTransactionButton";

// Uso básico
<AddTransactionButton />

// Personalizado
<AddTransactionButton 
  variant="outline"
  size="sm"
  text="Adicionar Despesa" 
  tooltip="Registrar nova despesa"
/>

// No cabeçalho/barra de navegação
<AddTransactionButton 
  variant="default"
  size="sm"
  showText={false}
  className="rounded-full" 
/>
```

### 2. TransactionModal

O componente modal em si, caso precise de controle mais granular.

```tsx
import { useState } from "react";
import { TransactionModal } from "@/app/_components/TransactionModal";
import { Button } from "@/app/_components/ui/button";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSuccess = () => {
    // Ação após salvar a transação com sucesso
    console.log("Transação salva!");
  };
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Abrir Modal
      </Button>
      
      <TransactionModal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onSuccess={handleSuccess}
        // Se estiver editando uma transação:
        // transactionId="id-da-transacao"
      />
    </>
  );
}
```

## Propriedades do `AddTransactionButton`

| Propriedade | Tipo | Padrão | Descrição |
|-------------|------|--------|-----------|
| `variant` | `"default" \| "outline" \| "ghost" \| "link" \| "destructive" \| "secondary"` | `"default"` | Variante visual do botão |
| `size` | `"default" \| "sm" \| "lg" \| "icon"` | `"default"` | Tamanho do botão |
| `className` | `string` | `""` | Classes CSS adicionais |
| `tooltip` | `string` | `"Adicionar nova transação"` | Texto da dica ao passar o mouse |
| `fullWidth` | `boolean` | `false` | Se o botão deve ocupar toda a largura disponível |
| `showIcon` | `boolean` | `true` | Se deve exibir o ícone |
| `showText` | `boolean` | `true` | Se deve exibir o texto |
| `text` | `string` | `"Nova Transação"` | Texto do botão |
| `icon` | `React.ReactNode` | `<PlusCircle />` | Ícone customizado |
| `onSuccess` | `() => void` | `undefined` | Callback após salvar com sucesso |

## Propriedades do `TransactionModal`

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `isOpen` | `boolean` | Se o modal está aberto |
| `onOpenChange` | `(open: boolean) => void` | Callback ao abrir/fechar o modal |
| `onSuccess` | `() => void` | Callback após salvar com sucesso |
| `initialData` | `Partial<TransactionFormValues>` | Dados iniciais para o formulário |
| `transactionId` | `string` | ID da transação (ao editar) |

## Exemplos de Uso

### Na barra de navegação principal

```tsx
import { AddTransactionButton } from "@/app/_components";

export function Navbar() {
  return (
    <nav className="flex justify-between items-center p-4">
      <div>Logo</div>
      <AddTransactionButton 
        size="sm"
        variant="default"
      />
    </nav>
  );
}
```

### Na página de dashboard

```tsx
import { AddTransactionButton } from "@/app/_components";

export function TransactionSection() {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Transações Recentes</h2>
        <AddTransactionButton 
          variant="outline"
          size="sm"
          text="Adicionar"
        />
      </div>
      {/* Lista de transações... */}
    </div>
  );
}
```

### Botão flutuante em dispositivos móveis

```tsx
import { AddTransactionButton } from "@/app/_components";

export function MobileFloatingButton() {
  return (
    <div className="fixed bottom-4 right-4 md:hidden">
      <AddTransactionButton 
        className="rounded-full w-12 h-12 shadow-lg"
        size="icon"
        showText={false}
      />
    </div>
  );
}
```

## Migração de Componentes Existentes

Para atualizar componentes existentes para usar o novo modal:

1. Importe o `AddTransactionButton` ou `TransactionModal`
2. Substitua os botões/links existentes que navegam para "/transactions/new"
3. Remova redirecionamentos desnecessários

### Exemplo de migração:

Antes:
```tsx
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export function OldButton() {
  const router = useRouter();
  
  return (
    <Button onClick={() => router.push("/transactions/new")}>
      Nova Transação
    </Button>
  );
}
```

Depois:
```tsx
import { AddTransactionButton } from "@/app/_components";

export function NewButton() {
  return <AddTransactionButton />;
}
``` 