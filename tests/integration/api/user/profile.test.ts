/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, PATCH } from '@/app/api/user/profile/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/app/_lib/prisma';

// Mock do getServerSession
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

// Mock do prisma
jest.mock('@/app/_lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}));

// Mock do NextRequest
function createMockRequest(body?: any): NextRequest {
  const request = {
    json: jest.fn().mockResolvedValue(body),
    headers: {
      get: jest.fn(),
    }
  };
  return request as unknown as NextRequest;
}

describe('API de Perfil do Usuário', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/user/profile', () => {
    it('deve retornar erro 401 quando não há sessão de usuário', async () => {
      // Configurar o mock para retornar sessão nula
      (getServerSession as jest.Mock).mockResolvedValue(null);

      // Fazer a requisição
      const response = await GET(createMockRequest());
      const data = await response.json();

      // Verificar o resultado
      expect(response.status).toBe(401);
      expect(data.error).toBe('Não autorizado');
    });

    it('deve retornar erro 404 quando o usuário não é encontrado', async () => {
      // Configurar o mock para retornar uma sessão
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' }
      });

      // Configurar o mock do prisma para retornar nulo
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Fazer a requisição
      const response = await GET(createMockRequest());
      const data = await response.json();

      // Verificar o resultado
      expect(response.status).toBe(404);
      expect(data.error).toBe('Usuário não encontrado');
    });

    it('deve retornar os dados do usuário corretamente', async () => {
      // Configurar o mock para retornar uma sessão
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' }
      });

      // Dados de usuário de teste
      const mockUser = {
        id: 'user123',
        name: 'Test User',
        email: 'user@example.com',
        password: 'hashed_password', // Este campo deve ser removido da resposta
        createdAt: new Date(),
        updatedAt: new Date(),
        subscription: {
          plan: 'BASIC',
          status: 'ACTIVE'
        },
        wallets: [
          {
            id: 'wallet123',
            name: 'Main Wallet',
            balance: 1000,
            type: 'CHECKING',
            bankId: 'bank123'
          }
        ]
      };

      // Configurar o mock do prisma para retornar o usuário
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Fazer a requisição
      const response = await GET(createMockRequest());
      const data = await response.json();

      // Verificar o resultado
      expect(response.status).toBe(200);
      expect(data.id).toBe(mockUser.id);
      expect(data.name).toBe(mockUser.name);
      expect(data.email).toBe(mockUser.email);
      expect(data.subscription).toBeDefined();
      expect(data.wallets).toHaveLength(1);
      
      // Verificar que a senha foi removida
      expect(data.password).toBeUndefined();
    });

    it('deve lidar com erros na execução', async () => {
      // Configurar o mock para retornar uma sessão
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' }
      });

      // Forçar um erro no prisma
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Erro de banco de dados'));

      // Fazer a requisição
      const response = await GET(createMockRequest());
      const data = await response.json();

      // Verificar o resultado
      expect(response.status).toBe(500);
      expect(data.error).toBe('Erro ao buscar perfil do usuário');
    });
  });

  describe('PATCH /api/user/profile', () => {
    it('deve retornar erro 401 quando não há sessão de usuário', async () => {
      // Configurar o mock para retornar sessão nula
      (getServerSession as jest.Mock).mockResolvedValue(null);

      // Fazer a requisição
      const response = await PATCH(createMockRequest({ name: 'New Name' }));
      const data = await response.json();

      // Verificar o resultado
      expect(response.status).toBe(401);
      expect(data.error).toBe('Não autorizado');
    });

    it('deve atualizar os dados do usuário corretamente', async () => {
      // Configurar o mock para retornar uma sessão
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' }
      });

      // Dados atualizados do usuário
      const updateData = {
        name: 'Updated Name',
        image: 'new-profile-image.jpg',
        phoneNumber: '(11) 99999-9999',
        emailNotifications: true,
        extraField: 'Este campo não deve ser incluído' // Campo não permitido para atualização
      };

      // Dados retornados após atualização
      const updatedUser = {
        id: 'user123',
        name: 'Updated Name',
        email: 'user@example.com',
        image: 'new-profile-image.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Configurar o mock do prisma para retornar os dados atualizados
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      // Fazer a requisição
      const response = await PATCH(createMockRequest(updateData));
      const data = await response.json();

      // Verificar o resultado
      expect(response.status).toBe(200);
      expect(data.name).toBe(updateData.name);
      expect(data.image).toBe(updateData.image);

      // Verificar que a função update do prisma foi chamada corretamente
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
        data: expect.objectContaining({
          name: updateData.name,
          image: updateData.image,
          phoneNumber: '11999999999' // Deve remover formatação
        }),
        select: expect.any(Object)
      });

      // Verificar que o campo extraField não foi incluído na atualização
      const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.extraField).toBeUndefined();
    });

    it('deve lidar com erros na execução', async () => {
      // Configurar o mock para retornar uma sessão
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' }
      });

      // Forçar um erro no prisma
      (prisma.user.update as jest.Mock).mockRejectedValue(new Error('Erro de banco de dados'));

      // Fazer a requisição
      const response = await PATCH(createMockRequest({ name: 'New Name' }));
      const data = await response.json();

      // Verificar o resultado
      expect(response.status).toBe(500);
      expect(data.error).toBe('Erro ao atualizar perfil do usuário');
    });
  });
}); 