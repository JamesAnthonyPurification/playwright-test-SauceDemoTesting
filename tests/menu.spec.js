const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { InventoryPage } = require('../pages/InventoryPage');
const testData = require('../fixtures/testData.json');

let inventoryPage;

test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  inventoryPage = new InventoryPage(page);

  await loginPage.visit();
  await loginPage.login(testData.users.standard.username, testData.users.standard.password);
  await expect(inventoryPage.pageTitle).toHaveText('Products');
});

test.describe('Sidebar Navigation Menu (POM)', () => {
  test('Open and close sidebar menu', async () => {
    await inventoryPage.menu.open();
    await expect(inventoryPage.menu.allItemsLink).toBeVisible();
    await expect(inventoryPage.menu.logoutLink).toBeVisible();

    await inventoryPage.menu.close();
    await expect(inventoryPage.menu.closeButton).toBeHidden();
  });

  test('Reset App State clears items from cart badge', async () => {
    await inventoryPage.addProductToCart(testData.products.backpack.name);
    expect(await inventoryPage.getCartCount()).toBe(1);

    await inventoryPage.menu.resetAppState();
    expect(await inventoryPage.getCartCount()).toBe(0);
  });

  test('All Items link navigates back to inventory from cart', async ({ page }) => {
    await inventoryPage.openCart();
    await expect(page).toHaveURL(/cart\.html/);

    await inventoryPage.menu.goToAllItems();
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('Logout returns user to the login page', async ({ page }) => {
    await inventoryPage.menu.logout();

    await expect(page).toHaveURL('https://www.saucedemo.com/');
    await expect(page.locator('[data-test="login-button"]')).toBeVisible();
  });
});

