import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should redirect to sign-in page when not authenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/.*\/auth\/signin/)
  })

  test('should sign in with valid credentials', async ({ page }) => {
    await page.goto('/auth/signin')
    
    await page.fill('input[name="email"]', 'owner@demo.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/.*\/dashboard/)
    await expect(page.locator('h1')).toContainText('Welcome back')
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin')
    
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('[role="alert"]')).toContainText('Invalid email or password')
  })

  test('should navigate to sign-up page', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.click('text=Sign up')
    
    await expect(page).toHaveURL(/.*\/auth\/signup/)
    await expect(page.locator('h1')).toContainText('Create Account')
  })

  test('should sign out successfully', async ({ page }) => {
    // First sign in
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'owner@demo.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Then sign out
    await page.click('[data-testid="user-menu"]')
    await page.click('text=Log out')
    
    await expect(page).toHaveURL(/.*\/auth\/signin/)
  })
})