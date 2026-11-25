const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { InventoryPage } = require('../pages/InventoryPage');
const { CartPage } = require('../pages/CartPage');
const testData = require('../fixtures/testData.json');

const backpack = testData.products.backpack.name;
const bikeLight = testData.products.bikeLight.name;

let cartPage;

test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  const inventoryPage = new InventoryPage(page);
  cartPage = new CartPage(page);

  await loginPage.visit();
  await loginPage.login(testData.users.standard.username, testData.users.standard.password);
  await inventoryPage.addProductToCart(backpack);
  await inventoryPage.addProductToCart(bikeLight);
  await inventoryPage.openCart();
  await expect(page).toHaveURL(/cart\.html/);
});

test.describe('Shopping Cart Feature (POM)', () => {
  test('Added products appear in the cart', async () => {
    const names = await cartPage.getProductNames();

    expect(names).toEqual([backpack, bikeLight]);
    expect(await cartPage.getItemCount()).toBe(2);
  });

  test('Remove single item decreases cart item count', async () => {
    await cartPage.removeProduct(backpack);

    const remaining = await cartPage.getProductNames();
    expect(remaining).not.toContain(backpack);
    expect(remaining).toContain(bikeLight);
    expect(await cartPage.getItemCount()).toBe(1);
  });

  test('Remove all items empties the cart', async () => {
    await cartPage.removeAllProducts();

    expect(await cartPage.getItemCount()).toBe(0);
    await expect(cartPage.cartBadge).toBeHidden();
  });

  test('Continue shopping returns to inventory page', async ({ page }) => {
    await cartPage.continueShopping();

    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('Checkout button navigates to checkout step one', async ({ page }) => {
    await cartPage.proceedToCheckout();

    await expect(page).toHaveURL(/checkout-step-one\.html/);
  });
});

