const { BasePage } = require('./BasePage');

class CartPage extends BasePage {
  constructor(page) {
    super(page, '/cart.html');
    this.pageTitle = page.locator('.title');
    this.cartItems = page.locator('.cart_item');
    this.cartItemNames = page.locator('.cart_item .inventory_item_name');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.cartBadge = page.locator('.shopping_cart_badge');
  }

  async getProductNames() {
    return this.cartItemNames.allTextContents();
  }

  async getItemCount() {
    return this.cartItems.count();
  }

  async removeProduct(productName) {
    const item = this.cartItems.filter({ hasText: productName });
    await item.getByRole('button', { name: 'Remove' }).click();
  }

  async removeAllProducts() {
    while ((await this.cartItems.count()) > 0) {
      await this.cartItems.first().getByRole('button', { name: 'Remove' }).click();
    }
  }

  async continueShopping() {
    await this.continueShoppingButton.click();
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }
}

module.exports = { CartPage };

