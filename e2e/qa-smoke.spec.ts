import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function parseCurrency(text: string): number {
  const normalized = text.replace(/[^0-9.-]/g, '');
  return Number(normalized || '0');
}

test.describe('QA smoke harness', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/qa/smoke');
    await expect(page.getByRole('heading', { name: 'QA Smoke Harness' })).toBeVisible();
    await page.waitForLoadState('networkidle');
  });

  test('adds a stock and records it as investment activity in the ledger', async ({ page }) => {
    const stockSection = page.locator('section[aria-labelledby="qa-stock-form"]');
    await stockSection.getByLabel('Stock symbol').fill('TCS');
    await stockSection.getByLabel('Company name').fill('Tata Consultancy Services');
    await stockSection.getByLabel('Stock quantity').fill('5');
    await stockSection.getByLabel('Stock buy price').fill('4000');
    await stockSection.getByRole('button', { name: 'Add Stock' }).click();

    await expect(page.getByRole('heading', { name: 'Stock Holdings', exact: true })).toBeVisible();
    await expect(
      page.locator('section[aria-labelledby="qa-stock-holdings"]').getByText('TCS', { exact: true })
    ).toBeVisible();
    await expect(page.getByText('BUY Stock: TCS')).toBeVisible();
    await expect(
      page
        .locator('section[aria-labelledby="qa-ledger"]')
        .getByText('Investment Buy', { exact: true })
    ).toBeVisible();
  });

  test('adds an expense and supports delete with undo', async ({ page }) => {
    const expenseSection = page.locator('section[aria-labelledby="qa-expense-form"]');
    await expenseSection.getByLabel('Expense description').fill('Coffee beans');
    await expenseSection.getByLabel('Expense category').fill('Food');
    await expenseSection.getByLabel('Expense amount').fill('650');
    await expenseSection.getByRole('button', { name: 'Add Expense' }).click();

    await expect(
      page
        .locator('section[aria-labelledby="qa-expenses"]')
        .getByText('Coffee beans', { exact: true })
    ).toBeVisible();
    await expect(
      page.locator('section[aria-labelledby="qa-ledger"]').getByText('Expense', { exact: true })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Delete expense Coffee beans' }).click();
    await expect(page.getByText(/Undo within 8 seconds/i)).toBeVisible();
    await page.getByRole('button', { name: 'Undo' }).click();

    await expect(
      page.locator('section[aria-labelledby="qa-expenses"]').getByText('Coffee beans', {
        exact: true,
      })
    ).toBeVisible();
  });

  test('transfers between accounts and updates balances plus the ledger', async ({ page }) => {
    const sourceBalanceBefore = parseCurrency(
      await page.getByTestId('account-balance-1').textContent()
    );
    const targetBalanceBefore = parseCurrency(
      await page.getByTestId('account-balance-2').textContent()
    );

    const transferSection = page.locator('section[aria-labelledby="qa-transfer-form"]');
    await transferSection.getByLabel('Transfer amount').fill('5000');
    await transferSection.getByRole('button', { name: 'Transfer' }).click();

    await expect
      .poll(async () => parseCurrency(await page.getByTestId('account-balance-1').textContent()))
      .toBe(sourceBalanceBefore - 5000);
    await expect
      .poll(async () => parseCurrency(await page.getByTestId('account-balance-2').textContent()))
      .toBe(targetBalanceBefore + 5000);

    await expect(page.getByText('Transfer to Broker Wallet')).toBeVisible();
    await expect(
      page.locator('section[aria-labelledby="qa-ledger"]').getByText('Transfer', { exact: true })
    ).toBeVisible();
  });

  test('supports keyboard-first navigation entry points', async ({ page, isMobile }) => {
    await page.keyboard.press('Tab');

    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const activeElement = document.activeElement as HTMLElement | null;
          return (
            activeElement?.textContent?.trim() ??
            activeElement?.getAttribute('aria-label') ??
            activeElement?.id ??
            ''
          );
        })
      )
      .toBe('Skip to main content');
    await expect(skipLink).toBeFocused();

    if (isMobile) {
      const menuButton = page.getByRole('button', { name: 'Open sidebar' });
      await expect(menuButton).toBeVisible();
      await page.keyboard.press('Tab');
      await menuButton.click();
      await expect(page.getByRole('button', { name: 'Close sidebar' })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Open sidebar' })).toBeVisible();
    } else {
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    }
  });
});

test.describe('accessibility scans', () => {
  test('login page has no serious or critical axe violations', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const seriousViolations = results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? '')
    );

    expect(seriousViolations).toEqual([]);
  });

  test('qa smoke page has no serious or critical axe violations', async ({ page }) => {
    await page.goto('/qa/smoke');
    await expect(page.getByRole('heading', { name: 'QA Smoke Harness' })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const seriousViolations = results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? '')
    );

    expect(seriousViolations).toEqual([]);
  });
});
