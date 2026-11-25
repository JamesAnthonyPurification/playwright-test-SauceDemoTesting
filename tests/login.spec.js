const { test, expect, request } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { InventoryPage } = require('../pages/InventoryPage');
const testData = require('../fixtures/testData.json');

let apiContext;
let loginPage;

// Runs once per worker before any test in this file starts.
test.beforeAll(async () => {
  apiContext = await request.newContext({
    baseURL: 'https://www.saucedemo.com',
  });
  const response = await apiContext.get('/');
  expect(response.ok()).toBeTruthy();
});

// Runs once per worker after all tests in this file finish.
test.afterAll(async () => {
  await apiContext.dispose();
});

// Runs before every single test to give each scenario a clean login page.
test.beforeEach(async ({ page }) => {
  loginPage = new LoginPage(page);
  await loginPage.visit();
});

// Runs after every test; attaches the final page URL for quick debugging if a test fails.
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await testInfo.attach('failed-page-url', {
      body: Buffer.from(page.url()),
      contentType: 'text/plain',
    });
  }
});

test.describe('Login Feature (POM)', () => {
  test('TC01 - Standard user can log in successfully', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);

    await loginPage.login(testData.users.standard.username, testData.users.standard.password);

    await expect(page).toHaveURL(/inventory\.html/);
    await expect(inventoryPage.pageTitle).toHaveText('Products');
  });

  test('TC02 - Locked-out user sees an error message', async () => {
    await loginPage.login(testData.users.locked.username, testData.users.locked.password);

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toHaveText(testData.errors.lockedUser);
  });

  test('TC03 - Invalid credentials show a mismatch error', async () => {
    await loginPage.login(testData.users.invalid.username, testData.users.invalid.password);

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toHaveText(testData.errors.invalidCredentials);
  });

  test('TC04 - Empty username shows username required error', async () => {
    await loginPage.login(
      testData.users.emptyUsername.username,
      testData.users.emptyUsername.password
    );

    await expect(loginPage.errorMessage).toHaveText(testData.errors.usernameRequired);
  });

  test('TC05 - Empty password shows password required error', async () => {
    await loginPage.login(
      testData.users.emptyPassword.username,
      testData.users.emptyPassword.password
    );

    await expect(loginPage.errorMessage).toHaveText(testData.errors.passwordRequired);
  });

  test('TC06 - Empty credentials show username required error', async () => {
    await loginPage.login(testData.users.emptyAll.username, testData.users.emptyAll.password);

    await expect(loginPage.errorMessage).toHaveText(testData.errors.usernameRequired);
  });

  test('TC07 - User can dismiss the login error alert', async () => {
    await loginPage.clickLogin();
    await expect(loginPage.errorMessage).toBeVisible();

    await loginPage.dismissError();
    await expect(loginPage.errorMessage).toBeHidden();
  });
});

