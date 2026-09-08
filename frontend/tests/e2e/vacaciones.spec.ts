import { test, expect } from '@playwright/test';

test.describe('Módulo de Control de Vacaciones y Descansos (RF-0004)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/ej\. admin/i).fill('dayerling.rrhh');
    await page.getByPlaceholder(/••••••••/i).fill('Rrhh123*');
    await page.getByRole('button', { name: /ingresar al sistema/i }).click();
  });

  test('debe mostrar el widget de cómputo en vivo y saldo vacacional', async ({ page }) => {
    await page.goto('/vacaciones');

    await expect(page.getByRole('heading', { name: /control de vacaciones y descansos/i })).toBeVisible();
    await expect(page.getByText(/disponibilidad y saldo vacacional/i)).toBeVisible();
    await expect(page.getByText(/saldo disponible real/i)).toBeVisible();
  });

  test('el botón Nueva Solicitud debe abrir el modal de registro', async ({ page }) => {
    await page.goto('/vacaciones');

    await page.getByRole('button', { name: /nueva solicitud/i }).click();
    await expect(page.getByRole('heading', { name: /registrar solicitud de vacaciones/i })).toBeVisible();
  });
});
