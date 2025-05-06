import { test, expect } from '@playwright/test';

test.describe('Fluxo de Autenticação', () => {
  test('deve mostrar a página de login', async ({ page }) => {
    // Navega para a página de login
    await page.goto('/auth');
    
    // Verifica se os elementos esperados estão presentes
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/senha/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('deve mostrar erro para credenciais inválidas', async ({ page }) => {
    // Navega para a página de login
    await page.goto('/auth');
    
    // Preenche formulário com credenciais inválidas
    await page.getByLabel(/email/i).fill('usuario@invalido.com');
    await page.getByLabel(/senha/i).fill('senhaincorreta');
    
    // Clica no botão de login
    await page.getByRole('button', { name: /entrar/i }).click();
    
    // Espera pela mensagem de erro
    await expect(page.getByText(/credenciais inválidas/i)).toBeVisible({ timeout: 3000 });
  });

  test('deve permitir o registro de um novo usuário', async ({ page }) => {
    // Navega para a página de registro
    await page.goto('/auth/register');
    
    // Verifica se os elementos esperados estão presentes
    await expect(page.getByRole('heading', { name: /criar conta/i })).toBeVisible();
    
    // Gera um email único usando timestamp
    const uniqueEmail = `test-${Date.now()}@example.com`;
    
    // Preenche o formulário de registro
    await page.getByLabel(/nome/i).fill('Usuário de Teste');
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByLabel(/senha/i).fill('Senha@123');
    await page.getByLabel(/confirmar senha/i).fill('Senha@123');
    
    // Aceita os termos de uso
    await page.getByLabel(/concordo com os termos/i).check();
    
    // Clica no botão de registro
    await page.getByRole('button', { name: /criar conta/i }).click();
    
    // Espera pelo redirecionamento ou mensagem de sucesso
    // Isso vai depender do comportamento da aplicação
    await expect(page).toHaveURL(/\/dashboard|\/auth\/verify|\/welcome/);
  });

  test('deve permitir redefinição de senha', async ({ page }) => {
    // Navega para a página de login
    await page.goto('/auth');
    
    // Clica no link "Esqueceu sua senha?"
    await page.getByText(/esqueceu sua senha/i).click();
    
    // Verifica se está na página de redefinição de senha
    await expect(page.getByRole('heading', { name: /redefinir senha/i })).toBeVisible();
    
    // Preenche o formulário com email
    await page.getByLabel(/email/i).fill('usuario@exemplo.com');
    
    // Clica no botão para enviar email de redefinição
    await page.getByRole('button', { name: /enviar/i }).click();
    
    // Verifica se a mensagem de sucesso é exibida
    await expect(page.getByText(/email enviado/i)).toBeVisible();
  });

  test('deve fazer logout corretamente', async ({ page }) => {
    // Esta parte requer um usuário já autenticado
    // Normalmente, você usaria APIs do Playwright para configurar um estado logado
    
    // Aqui estamos simulando um login diretamente
    await page.goto('/auth');
    await page.getByLabel(/email/i).fill('usuario@exemplo.com');
    await page.getByLabel(/senha/i).fill('senha123');
    await page.getByRole('button', { name: /entrar/i }).click();
    
    // Espera pelo redirecionamento para dashboard
    await page.waitForURL(/\/dashboard/);
    
    // Clica no menu de usuário
    await page.getByRole('button', { name: /perfil/i }).click();
    
    // Clica na opção de logout
    await page.getByText(/sair/i).click();
    
    // Verifica se foi redirecionado para a página de login
    await expect(page).toHaveURL(/\/auth/);
  });
}); 