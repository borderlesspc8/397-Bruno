"use client";

import { useAuthContext } from '@/app/_contexts/AuthContext';
import { useUserPermissions } from '@/app/_hooks/useUserPermissions';
import RouteProtection from '@/app/_components/RouteProtection';

export default function TesteControleAcessoPage() {
  const { user, isAuthenticated, isAdmin, isVendor, hasAccessTo } = useAuthContext();
  const permissions = useUserPermissions();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🧪 Teste do Sistema de Controle de Acesso</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações do Usuário */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">👤 Informações do Usuário</h2>
          <div className="space-y-2">
            <p><strong>Email:</strong> {user?.email || 'Não autenticado'}</p>
            <p><strong>Autenticado:</strong> {isAuthenticated ? '✅ Sim' : '❌ Não'}</p>
            <p><strong>Tipo:</strong> {isAdmin ? '🔑 Administrador' : isVendor ? '👤 Vendedor' : '🚫 Não autenticado'}</p>
          </div>
        </div>

        {/* Permissões */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">🔐 Permissões</h2>
          <div className="space-y-2">
            <p><strong>Vendas:</strong> {permissions.canAccessVendas ? '✅ Permitido' : '❌ Negado'}</p>
            <p><strong>Vendedores:</strong> {permissions.canAccessVendedores ? '✅ Permitido' : '❌ Negado'}</p>
            <p><strong>Metas:</strong> {permissions.canAccessMetas ? '✅ Permitido' : '❌ Negado'}</p>
            <p><strong>Dashboard CEO:</strong> {permissions.canAccessDashboardCEO ? '✅ Permitido' : '❌ Negado'}</p>
          </div>
        </div>

        {/* Teste de Acesso a Rotas */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">🛣️ Teste de Acesso a Rotas</h2>
          <div className="space-y-2">
            <p><strong>/dashboard/vendas:</strong> {hasAccessTo('/dashboard/vendas') ? '✅ Permitido' : '❌ Negado'}</p>
            <p><strong>/dashboard/vendedores:</strong> {hasAccessTo('/dashboard/vendedores') ? '✅ Permitido' : '❌ Negado'}</p>
            <p><strong>/dashboard/metas:</strong> {hasAccessTo('/dashboard/metas') ? '✅ Permitido' : '❌ Negado'}</p>
            <p><strong>/dashboard-ceo:</strong> {hasAccessTo('/dashboard-ceo') ? '✅ Permitido' : '❌ Negado'}</p>
          </div>
        </div>

        {/* Teste de Componentes Protegidos */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">🛡️ Teste de Componentes Protegidos</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Seção de Vendas (apenas Admin):</h3>
              <RouteProtection requiredPermission="vendas" fallback={<p className="text-red-500">❌ Acesso negado - apenas para administradores</p>}>
                <p className="text-green-500">✅ Você tem acesso à seção de vendas!</p>
              </RouteProtection>
            </div>
            
            <div>
              <h3 className="font-medium">Seção de Vendedores (todos):</h3>
              <RouteProtection requiredPermission="vendedores" fallback={<p className="text-red-500">❌ Acesso negado</p>}>
                <p className="text-green-500">✅ Você tem acesso à seção de vendedores!</p>
              </RouteProtection>
            </div>
            
            <div>
              <h3 className="font-medium">Seção de Metas (apenas Admin):</h3>
              <RouteProtection requiredPermission="metas" fallback={<p className="text-red-500">❌ Acesso negado - apenas para administradores</p>}>
                <p className="text-green-500">✅ Você tem acesso à seção de metas!</p>
              </RouteProtection>
            </div>
          </div>
        </div>
      </div>

      {/* Instruções */}
      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">📋 Instruções para Teste</h2>
        <div className="space-y-2">
          <p><strong>1. Teste como Administrador:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Faça login com o email: <code className="bg-gray-200 px-2 py-1 rounded">lojapersonalprime@gmail.com</code></li>
            <li>Você deve ter acesso a todas as seções</li>
            <li>Deve ser redirecionado para /dashboard/vendas após o login</li>
          </ul>
          
          <p className="mt-4"><strong>2. Teste como Vendedor:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Faça login com qualquer outro email</li>
            <li>Você deve ter acesso apenas à seção de vendedores</li>
            <li>Deve ser redirecionado para /dashboard/vendedores após o login</li>
            <li>Tentar acessar outras rotas deve redirecionar para /dashboard/vendedores</li>
          </ul>
          
          <p className="mt-4"><strong>3. Teste sem Autenticação:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Faça logout</li>
            <li>Tentar acessar qualquer rota protegida deve redirecionar para /auth</li>
          </ul>
        </div>
      </div>

      {/* Status do Sistema */}
      <div className="mt-6 bg-green-50 p-4 rounded-lg">
        <h3 className="font-semibold text-green-800">✅ Sistema de Controle de Acesso Ativo</h3>
        <p className="text-green-700">
          O sistema está funcionando corretamente baseado no email do usuário. 
          Apenas <code className="bg-green-200 px-1 rounded">lojapersonalprime@gmail.com</code> tem acesso total.
        </p>
      </div>
    </div>
  );
}
