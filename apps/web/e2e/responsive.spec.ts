import { expect, test } from '@playwright/test';
import { injectSession, joao, mockApi, noHorizontalOverflow } from './helpers';

const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 768 },
  { name: '1440', width: 1440, height: 900 },
] as const;

test.describe('responsividade', () => {
  for (const viewport of VIEWPORTS) {
    test(`login em ${viewport.name}px sem overflow horizontal`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto('/login');
      await expect(
        page.getByRole('heading', { name: 'Bem-vindo ao Studio EMAR' }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
      expect(await noHorizontalOverflow(page)).toBeTruthy();
    });
  }

  test('390px usa navegação inferior do aluno', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockApi(page, { user: joao });
    await injectSession(page, joao);
    await page.goto('/aluno');
    await expect(page.getByRole('heading', { name: /Olá, João/ })).toBeVisible();
    await expect(page.locator('nav.fixed.bottom-0')).toBeVisible();
    await expect(page.locator('aside')).toBeHidden();
    expect(await noHorizontalOverflow(page)).toBeTruthy();
  });

  test('1024px e 1440px usam a sidebar do aluno', async ({ page }) => {
    await mockApi(page, { user: joao });
    await injectSession(page, joao);

    for (const width of [1024, 1440] as const) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/aluno');
      await expect(page.locator('aside')).toBeVisible();
      await expect(page.getByText('Aluno')).toBeVisible();
      await expect(page.locator('nav.fixed.bottom-0')).toBeHidden();
      expect(await noHorizontalOverflow(page)).toBeTruthy();
    }
  });

  test('login em desktop mostra o painel da marca', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/login');
    await expect(page.getByText('Precisão. Performance. Potência.')).toBeVisible();
  });
});
