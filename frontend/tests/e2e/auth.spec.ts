import { test, expect } from '@playwright/test';

test.describe('Flujo de Autenticación y Control de Acceso', () => {
  test('debe mostrar la pantalla de login con branding corporativo', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h1')).toContainText('Taller de Torno');
    await expect(page.getByRole('heading', { name: 'Iniciar Sesión' })).toBeVisible();
    await expect(page.getByPlaceholder(/ej\. admin/i)).toBeVisible();
    await expect(page.getByPlaceholder(/••••••••/i)).toBeVisible();
  });

  test('debe rechazar credenciales vacías o inválidas con mensaje de error', async ({ page }) => {
    await page.goto('/login');

    // Intentar submit vacío
    await page.getByRole('button', { name: /ingresar al sistema/i }).click();
    await expect(page.getByText(/por favor ingrese su usuario y contraseña/i)).toBeVisible();

    // Intentar con usuario inexistente
    await page.getByPlaceholder(/ej\. admin/i).fill('usuario.inexistente');
    await page.getByPlaceholder(/••••••••/i).fill('Password123*');
    await page.getByRole('button', { name: /ingresar al sistema/i }).click();

    await expect(page.locator('.animate-shake')).toBeVisible();
  });

  test('redirecciona automáticamente al login si no hay sesión activa', async ({ page }) => {
    await page.goto('/contratos');
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });
});
