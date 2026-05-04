import { test, expect } from '@playwright/test';

test.describe('Adaptive Chemistry Platform E2E', () => {
  test('should load the landing page successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if the main heading is visible
    await expect(page.locator('text=الطاقة في التفاعلات')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ابدأ التعلم الآن' })).toBeVisible();
  });

  test('should be able to navigate to login and fill demo credentials', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    
    // Check if the main heading is visible using a loose text match
    await expect(page.locator('text=تسجيل الدخول').first()).toBeVisible();

    // Click on the student demo account button
    await page.getByRole('button', { name: 'طالب' }).click();

    // Verify fields are filled
    await expect(page.locator('input[type="email"]')).toHaveValue('student@diana.edu');
    await expect(page.locator('input[type="password"]')).toHaveValue('student123');

    // Make sure login button is present
    await expect(page.locator('button', { hasText: 'تسجيل الدخول' }).last()).toBeVisible();
  });
});
