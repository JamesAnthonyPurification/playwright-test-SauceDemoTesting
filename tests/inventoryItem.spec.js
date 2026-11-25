const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { InventoryPage } = require('../pages/InventoryPage');
const { InventoryItemPage } = require('../pages/InventoryItemPage');
const testData = require('../fixtures/testData.json');

let inventoryPage;
let itemPage;

test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  inventoryPage = new InventoryPage(page);
  itemPage = new InventoryItemPage(page);

  await loginPage.visit();
  await loginPage.login(testData.users.standard.username, testData.users.standard.password);
  await inventoryPage.openProductDetails(testData.products.backpack.name);
});

test.describe('Inventory Item Details (POM)', () => {
  test('Product detail page displays name, price, and description', async () => {
    await expect(itemPage.productName).toHaveText(testData.products.backpack.name);
    await expect(itemPage.productPrice).toHaveText(`$${testData.products.backpack.price}`);
    await expect(itemPage.productDescription).toBeVisible();
  });

  test('Add product to cart from detail page updates cart badge', async () => {
    await itemPage.addToCart();

    await expect(itemPage.removeButton).toBeVisible();
    expect(await itemPage.getCartCount()).toBe(1);
  });

  test('Remove product from detail page clears cart badge', async () => {
    await itemPage.addToCart();
    expect(await itemPage.getCartCount()).toBe(1);

    await itemPage.removeFromCart();

    await expect(itemPage.addToCartButton).toBeVisible();
    expect(await itemPage.getCartCount()).toBe(0);
  });

  test('Back to products button returns to inventory page', async ({ page }) => {
    await itemPage.goBackToProducts();

    await expect(page).toHaveURL(/inventory\.html/);
    await expect(inventoryPage.pageTitle).toHaveText('Products');
  });
});

