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

test.describe('Inventory Feature (POM)', () => {
  test('Sort products by Name (A to Z)', async () => {
    await inventoryPage.sortBy('az');
    const names = await inventoryPage.getAllProductNames();
    const expectedOrder = [...names].sort((a, b) => a.localeCompare(b));

    expect(names).toEqual(expectedOrder);
  });

  test('Sort products by Name (Z to A)', async () => {
    await inventoryPage.sortBy('za');
    const names = await inventoryPage.getAllProductNames();
    const expectedOrder = [...names].sort((a, b) => b.localeCompare(a));

    expect(names).toEqual(expectedOrder);
  });

  test('Sort products by Price (Low to High)', async () => {
    await inventoryPage.sortBy('lohi');
    const prices = await inventoryPage.getAllProductPrices();
    const expectedOrder = [...prices].sort((a, b) => a - b);

    expect(prices).toEqual(expectedOrder);
  });

  test('Sort products by Price (High to Low)', async () => {
    await inventoryPage.sortBy('hilo');
    const prices = await inventoryPage.getAllProductPrices();
    const expectedOrder = [...prices].sort((a, b) => b - a);

    expect(prices).toEqual(expectedOrder);
  });

  test('Add a product to cart and remove it from inventory', async () => {
    const productName = testData.products.backpack.name;

    await inventoryPage.addProductToCart(productName);
    expect(await inventoryPage.getCartCount()).toBe(1);

    await inventoryPage.removeProductFromCart(productName);
    expect(await inventoryPage.getCartCount()).toBe(0);
  });

  test('Cart badge updates accurately when adding and removing multiple products', async () => {
    const itemsToAdd = [
      testData.products.backpack.name,
      testData.products.bikeLight.name,
      testData.products.onesie.name,
    ];

    for (let i = 0; i < itemsToAdd.length; i++) {
      await inventoryPage.addProductToCart(itemsToAdd[i]);
      expect(await inventoryPage.getCartCount()).toBe(i + 1);
    }

    for (let i = itemsToAdd.length - 1; i >= 0; i--) {
      await inventoryPage.removeProductFromCart(itemsToAdd[i]);
      expect(await inventoryPage.getCartCount()).toBe(i);
    }
  });
});

