import { expect, test } from '@playwright/test';
import {
  carlos,
  injectSession,
  joao,
  mockApi,
  openPublicPage,
} from './helpers';

test.describe('login e páginas públicas', () => {
  test('renderiza o formulário e os atalhos de conta', async ({ page }) => {
    await openPublicPage(page, '/login');
    await expect(
      page.getByRole('heading', { name: 'Bem-vindo ao Studio EMar' }),
    ).toBeVisible();
    await expect(page.getByLabel('E-mail ou CPF')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Recuperar senha' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Primeiro acesso' })).toBeVisible();
    await expect(page.getByText('Sua conta é criada pelo Studio.')).toBeVisible();
  });

  test('valida identificador inválido no cliente', async ({ page }) => {
    await openPublicPage(page, '/login');
    await page.locator('form').evaluate((form) => {
      form.setAttribute('novalidate', '');
    });
    await page.getByLabel('E-mail ou CPF').fill('joao');
    await page.getByLabel('Senha').fill('studioemar');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Informe um CPF válido')).toBeVisible();
  });

  test('aluno entra e vai para /aluno', async ({ page }) => {
    await mockApi(page, { loginUser: joao });
    await openPublicPage(page, '/login');
    await page.getByLabel('E-mail ou CPF').fill('joao@studioemar.local');
    await page.getByLabel('Senha').fill('studioemar');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/aluno$/);
    await expect(page.getByRole('heading', { name: /Olá, João/ })).toBeVisible();
  });

  test('aluno entra com CPF mascarado', async ({ page }) => {
    await mockApi(page, { loginUser: joao });
    await openPublicPage(page, '/login');
    await page.getByLabel('E-mail ou CPF').fill('52998224725');
    await expect(page.getByLabel('E-mail ou CPF')).toHaveValue('529.982.247-25');
    await page.getByLabel('Senha').fill('studioemar');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/aluno$/);
  });

  test('treinador entra e vai para /treinador', async ({ page }) => {
    await mockApi(page, { loginUser: carlos, user: carlos });
    await openPublicPage(page, '/login');
    await page.getByLabel('E-mail ou CPF').fill('carlos@studioemar.local');
    await page.getByLabel('Senha').fill('studioemar');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/treinador$/);
    await expect(page.getByRole('heading', { name: /Carlos/ })).toBeVisible();
  });

  test('primeiro acesso pede senha pessoal', async ({ page }) => {
    await openPublicPage(page, '/primeiro-acesso');
    await expect(
      page.getByRole('heading', { name: 'Primeiro acesso' }),
    ).toBeVisible();
    await expect(
      page.getByText('Defina uma senha pessoal para a conta criada pelo Studio.'),
    ).toBeVisible();
  });

  test('recuperar senha confirma o pedido sem revelar o e-mail', async ({
    page,
  }) => {
    await mockApi(page);
    await openPublicPage(page, '/recuperar-senha');
    await page.getByLabel('E-mail').fill('joao@studioemar.local');
    await page.getByRole('button', { name: 'Enviar instruções' }).click();
    await expect(
      page.getByText(/Se o e-mail estiver cadastrado/i),
    ).toBeVisible();
  });
});

test.describe('permissões de rota', () => {
  test('aluno não permanece em /treinador', async ({ page }) => {
    await mockApi(page, { user: joao });
    await injectSession(page, joao);
    await page.goto('/treinador');
    await expect(page).toHaveURL(/\/aluno/);
  });

  test('treinador não permanece em /aluno', async ({ page }) => {
    await mockApi(page, { user: carlos });
    await injectSession(page, carlos);
    await page.goto('/aluno');
    await expect(page).toHaveURL(/\/treinador/);
  });
});
