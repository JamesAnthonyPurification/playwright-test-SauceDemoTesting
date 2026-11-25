const { BasePage } = require('./BasePage');

class InventoryItemPage extends BasePage {
  constructor(page) {
    super(page, '/inventory-item.html');
    this.productName = page.locator('.inventory_details_name');
    this.productDescription = page.locator('.inventory_details_desc');
    this.productPrice = page.locator('.inventory_details_price');
    this.addToCartButton = page.getByRole('button', { name: 'Add to cart' });
    this.removeButton = page.getByRole('button', { name: 'Remove' });
    this.backToProductsButton = page.locator('[data-test="back-to-products"]');
    this.cartBadge = page.locator('.shopping_cart_badge');
  }

  async addToCart() {
    await this.addToCartButton.click();
  }

  async removeFromCart() {
    await this.removeButton.click();
  }

  async goBackToProducts() {
    await this.backToProductsButton.click();
  }

  async getCartCount() {
    const count = await this.cartBadge.count();
    if (count === 0) {
      return 0;
    }
    return parseInt(await this.cartBadge.textContent(), 10);
  }
}

module.exports = { InventoryItemPage };

