const { BasePage } = require('./BasePage');
const { MenuComponent } = require('./MenuComponent');

class InventoryPage extends BasePage {
  constructor(page) {
    super(page, '/inventory.html');
    this.menu = new MenuComponent(page);
    this.pageTitle = page.locator('.title');
    this.sortDropdown = page.locator('.product_sort_container');
    this.productCards = page.locator('.inventory_item');
    this.productNames = page.locator('.inventory_item_name');
    this.productPrices = page.locator('.inventory_item_price');
    this.cartLink = page.locator('.shopping_cart_link');
    this.cartBadge = page.locator('.shopping_cart_badge');
  }

  getProductCard(productName) {
    return this.productCards.filter({
      has: this.page.locator('.inventory_item_name', { hasText: productName }),
    });
  }

  async addProductToCart(productName) {
    const card = this.getProductCard(productName);
    await card.getByRole('button', { name: 'Add to cart' }).click();
  }

  async removeProductFromCart(productName) {
    const card = this.getProductCard(productName);
    await card.getByRole('button', { name: 'Remove' }).click();
  }

  async openProductDetails(productName) {
    await this.page.locator('.inventory_item_name', { hasText: productName }).click();
  }

  async sortBy(optionValue) {
    await this.sortDropdown.selectOption(optionValue);
  }

  async getAllProductNames() {
    return this.productNames.allTextContents();
  }

  async getAllProductPrices() {
    const priceTexts = await this.productPrices.allTextContents();
    return priceTexts.map((text) => parseFloat(text.replace('$', '')));
  }

  async getCartCount() {
    const count = await this.cartBadge.count();
    if (count === 0) {
      return 0;
    }
    return parseInt(await this.cartBadge.textContent(), 10);
  }

  async openCart() {
    await this.cartLink.click();
  }
}

module.exports = { InventoryPage };

