# SauceDemo Playwright Test Automation (JavaScript + POM)

End-to-end automated test suite for [SauceDemo](https://www.saucedemo.com/) built with **Playwright** and **JavaScript** following the **Page Object Model (POM)** design pattern. Includes both baseline Codegen-recorded tests and refactored POM test suites, lifecycle hooks (`beforeAll`, `afterAll`, `beforeEach`, `afterEach`), and a live test dashboard deployable on Render.

## Project Structure

```text
playwright-test-SauceDemoTesting/
├── fixtures/
│   └── testData.json              # Shared test users, products, checkout data & error messages
├── pages/
│   ├── BasePage.js                # Shared base class (visit, URL helpers)
│   ├── LoginPage.js               # Login locators & login/error methods
│   ├── InventoryPage.js           # Sorting, add/remove products, cart badge helpers
│   ├── InventoryItemPage.js       # Product detail page actions
│   ├── CartPage.js                # Cart item listing, removal, continue/checkout actions
│   ├── CheckoutPage.js            # Checkout step 1, step 2 totals & order completion
│   └── MenuComponent.js           # Sidebar menu (open, close, All Items, Reset, Logout)
├── tests/
│   ├── recorded.spec.js           # Preserved Codegen recorded tests (TC01 & TC02)
│   ├── login.spec.js              # Login scenarios + beforeAll/afterAll/beforeEach/afterEach
│   ├── inventory.spec.js          # Product sorting & cart counter tests
│   ├── inventoryItem.spec.js      # Product detail page tests
│   ├── cart.spec.js               # Shopping cart item management tests
│   ├── checkout.spec.js           # End-to-end checkout, total math & form validation
│   └── menu.spec.js               # Sidebar menu, reset app state & logout tests
├── public/
│   ├── index.html                 # Live Test Dashboard UI
│   ├── styles.css                 # Dashboard stylesheet
│   └── app.js                     # Interactive results viewer & live runner client
├── server.js                      # Node.js server hosting Dashboard + Playwright HTML Report
├── playwright.config.js           # Playwright test configuration
├── Dockerfile                     # Official Playwright container image for Render deployment
├── render.yaml                    # Render Blueprint configuration
└── package.json
```

## Getting Started

Install Node.js (v18 or newer), then install dependencies and Chromium:

```bash
npm install
npx playwright install chromium
```

## Running Tests

Run the full test suite in headless mode:

```bash
npm test
```

Run tests with a visible browser window:

```bash
npm run test:headed
```

Open Playwright interactive UI mode:

```bash
npm run test:ui
```

Run an individual test suite:

```bash
npm run test:recorded
npm run test:login
npm run test:cart
npm run test:checkout
```

View the Playwright HTML report:

```bash
npm run report
```

Launch the live dashboard locally (opens at `http://localhost:3000`):

```bash
npm start
```

## Page Object Model (POM)

Each class in `pages/` encapsulates the selectors and reusable user actions for a single page or component:

- **Constructor receives `page`**: Every class takes Playwright's `page` object so locators stay scoped to the active test context.
- **Separation of concerns**: Page classes perform UI actions (`login()`, `addProductToCart()`, `sortBy()`, `submitInformation()`), while spec files in `tests/` focus on test scenarios and `expect()` assertions.
- **Reusability**: If a SauceDemo selector changes, it only needs to be updated once in the corresponding page class instead of across multiple test files.

## Test Lifecycle Hooks

- `test.beforeAll()` — Runs **once per test file (per worker)** before any tests execute. Used in `tests/login.spec.js` to create an API request context and confirm `https://www.saucedemo.com` is reachable.
- `test.afterAll()` — Runs **once per test file (per worker)** after all tests finish. Used in `tests/login.spec.js` to dispose of the shared API request context.
- `test.beforeEach()` — Runs **before every test**. Used across all POM specs to instantiate page objects and navigate to the test's starting state.
- `test.afterEach()` — Runs **after every test**. Used in `tests/login.spec.js` to attach diagnostic page URL info if a test fails. Playwright already creates and closes an isolated browser context per test automatically.

## Deploying Live on Render

The project includes a `Dockerfile` built on Microsoft's official Playwright image (`mcr.microsoft.com/playwright:v1.65.1-noble`) and a `render.yaml` Blueprint.

During the Docker build, Playwright runs the full test suite and generates both `test-results/results.json` and `playwright-report/`. When deployed to Render as a Docker Web Service:

- `/` serves the live **SauceDemo Automation Test Dashboard** with test suite breakdowns and a live **Run All Tests** trigger.
- `/report/` serves the official interactive **Playwright HTML Report**.
- `/health` provides a health check endpoint for Render.

