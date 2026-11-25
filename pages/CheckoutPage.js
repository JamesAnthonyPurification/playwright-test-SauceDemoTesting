const { BasePage } = require('./BasePage');

class CheckoutPage extends BasePage {
  constructor(page) {
    super(page, '/checkout-step-one.html');
    this.pageTitle = page.locator('.title');

    // Step One - Customer information
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.cancelButton = page.locator('[data-test="cancel"]');
    this.errorMessage = page.locator('[data-test="error"]');

    // Step Two - Overview
    this.subtotalLabel = page.locator('.summary_subtotal_label');
    this.taxLabel = page.locator('.summary_tax_label');
    this.totalLabel = page.locator('.summary_total_label');
    this.finishButton = page.locator('[data-test="finish"]');

    // Step Complete
    this.completeHeader = page.locator('.complete-header');
    this.completeText = page.locator('.complete-text');
    this.backHomeButton = page.locator('[data-test="back-to-products"]');
  }

  async fillInformation(firstName, lastName, postalCode) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.postalCodeInput.fill(postalCode);
  }

  async continueToOverview() {
    await this.continueButton.click();
  }

  async submitInformation(firstName, lastName, postalCode) {
    await this.fillInformation(firstName, lastName, postalCode);
    await this.continueToOverview();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async finishOrder() {
    await this.finishButton.click();
  }

  async goBackHome() {
    await this.backHomeButton.click();
  }

  async getSummaryTotals() {
    const parseAmount = (text) => parseFloat(text.replace(/[^0-9.]/g, ''));
    const subtotal = parseAmount(await this.subtotalLabel.textContent());
    const tax = parseAmount(await this.taxLabel.textContent());
    const total = parseAmount(await this.totalLabel.textContent());
    return { subtotal, tax, total };
  }
}

module.exports = { CheckoutPage };

