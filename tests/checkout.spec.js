const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { InventoryPage } = require('../pages/InventoryPage');
const { CartPage } = require('../pages/CartPage');
const { CheckoutPage } = require('../pages/CheckoutPage');
const testData = require('../fixtures/testData.json');

let checkoutPage;

test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  const inventoryPage = new InventoryPage(page);
  const cartPage = new CartPage(page);
  checkoutPage = new CheckoutPage(page);

  await loginPage.visit();
  await loginPage.login(testData.users.standard.username, testData.users.standard.password);
  await inventoryPage.addProductToCart(testData.products.backpack.name);
  await inventoryPage.addProductToCart(testData.products.bikeLight.name);
  await inventoryPage.openCart();
  await cartPage.proceedToCheckout();
  await expect(page).toHaveURL(/checkout-step-one\.html/);
});

test.describe('Checkout Flow (POM)', () => {
  test('Complete full checkout flow with accurate subtotal, tax, and total', async ({ page }) => {
    const customer = testData.checkout.valid;
    await checkoutPage.submitInformation(customer.firstName, customer.lastName, customer.postalCode);

    await expect(page).toHaveURL(/checkout-step-two\.html/);

    const expectedSubtotal = Number(
      (testData.products.backpack.price + testData.products.bikeLight.price).toFixed(2)
    );
    const expectedTax = Number((expectedSubtotal * 0.08).toFixed(2));
    const expectedTotal = Number((expectedSubtotal + expectedTax).toFixed(2));

    const totals = await checkoutPage.getSummaryTotals();
    expect(totals.subtotal).toBe(expectedSubtotal);
    expect(totals.tax).toBe(expectedTax);
    expect(totals.total).toBe(expectedTotal);

    await checkoutPage.finishOrder();
    await expect(page).toHaveURL(/checkout-complete\.html/);
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');

    await checkoutPage.goBackHome();
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('Validation error when checkout form is empty', async () => {
    await checkoutPage.continueToOverview();

    await expect(checkoutPage.errorMessage).toHaveText(testData.errors.firstNameRequired);
  });

  test('Validation error when last name is missing', async () => {
    const data = testData.checkout.missingLastName;
    await checkoutPage.submitInformation(data.firstName, data.lastName, data.postalCode);

    await expect(checkoutPage.errorMessage).toHaveText(testData.errors.lastNameRequired);
  });

  test('Validation error when postal code is missing', async () => {
    const data = testData.checkout.missingPostalCode;
    await checkoutPage.submitInformation(data.firstName, data.lastName, data.postalCode);

    await expect(checkoutPage.errorMessage).toHaveText(testData.errors.postalCodeRequired);
  });

  test('Cancel on step one returns to cart page', async ({ page }) => {
    await checkoutPage.cancel();

    await expect(page).toHaveURL(/cart\.html/);
  });

  test('Cancel on step two returns to inventory page', async ({ page }) => {
    const customer = testData.checkout.valid;
    await checkoutPage.submitInformation(customer.firstName, customer.lastName, customer.postalCode);
    await expect(page).toHaveURL(/checkout-step-two\.html/);

    await checkoutPage.cancel();
    await expect(page).toHaveURL(/inventory\.html/);
  });
});

