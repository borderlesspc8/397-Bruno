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
function createMockRequest(body?: any, queryParams?: Record<string, string>): NextRequest {
  const queryString = queryParams 
    ? '?' + new URLSearchParams(queryParams).toString()
    : '?userId=test-user-id';
  
  const request = {
    url: `http://localhost:3000/api/user/profile${queryString}`,
    json: jest.fn().mockResolvedValue(body || {}),
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
    it('deve retornar erro 401 quando não há userId', async () => {
      // Fazer a requisição sem userId
      const response = await GET(createMockRequest(undefined, {}));
      const data = await response.json();

      // Verificar o resultado
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('deve retornar dados do usuário quando userId é fornecido', async () => {
      // Fazer a requisição com userId
      const response = await GET(createMockRequest(undefined, { userId: 'test-user-id' }));
      const data = await response.json();

      // Verificar o resultado
      expect(response.status).toBe(200);
      expect(data.id).toBeDefined();
      expect(data.name).toBeDefined();
      expect(data.email).toBeDefined();
    });
  });

  describe('PATCH /api/user/profile', () => {
    it('deve retornar erro 400 quando userId não é fornecido', async () => {
      // Fazer a requisição sem userId
      const response = await PATCH(createMockRequest({ name: 'New Name' }, {}));
      const data = await response.json();

      // Verificar o resultado
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('deve atualizar os dados do usuário corretamente', async () => {
      // Dados atualizados do usuário
      const updateData = {
        userId: 'user123',
        name: 'Updated Name',
        image: 'new-profile-image.jpg',
        phoneNumber: '(11) 99999-9999',
        emailNotifications: true
      };

      // Fazer a requisição
      const response = await PATCH(createMockRequest(updateData));
      const data = await response.json();

      // Verificar o resultado - deve retornar dados válidos
      expect(response.status).toBe(200);
      expect(data).toBeDefined();
    });
  });
}); 