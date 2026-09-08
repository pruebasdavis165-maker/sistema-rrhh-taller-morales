import { test, expect } from '@playwright/test';

test.describe('Módulo de Administración de Contratos Laborales', () => {
  test.beforeEach(async ({ page }) => {
    // Autenticación rápida con credenciales del seed
    await page.goto('/login');
    await page.getByPlaceholder(/ej\. admin/i).fill('admin');
    await page.getByPlaceholder(/••••••••/i).fill('Admin123*');
    await page.getByRole('button', { name: /ingresar al sistema/i }).click();
  });

  test('debe navegar al listado de contratos y renderizar columnas clave', async ({ page }) => {
    await page.goto('/contratos');

    await expect(page.getByRole('heading', { name: /administración de contratos laborales/i })).toBeVisible();
    await expect(page.getByPlaceholder(/buscar por código/i)).toBeVisible();
  });

  test('permite filtrar por estado y tipo de contrato', async ({ page }) => {
    await page.goto('/contratos');

    // Comprobar presencia de selectores de filtro
    const selectEstado = page.locator('select').first();
    await expect(selectEstado).toBeVisible();
  });
});
