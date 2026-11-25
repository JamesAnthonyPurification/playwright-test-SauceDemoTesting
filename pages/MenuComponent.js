class MenuComponent {
  constructor(page) {
    this.page = page;
    this.openButton = page.locator('#react-burger-menu-btn');
    this.closeButton = page.locator('#react-burger-cross-btn');
    this.menuWrap = page.locator('.bm-menu-wrap');
    this.allItemsLink = page.locator('#inventory_sidebar_link');
    this.aboutLink = page.locator('#about_sidebar_link');
    this.logoutLink = page.locator('#logout_sidebar_link');
    this.resetAppStateLink = page.locator('#reset_sidebar_link');
  }

  async open() {
    await this.openButton.click();
    await this.closeButton.waitFor({ state: 'visible' });
  }

  async close() {
    await this.closeButton.click();
    await this.closeButton.waitFor({ state: 'hidden' });
  }

  async goToAllItems() {
    await this.open();
    await this.allItemsLink.click();
  }

  async resetAppState() {
    await this.open();
    await this.resetAppStateLink.click();
    await this.close();
  }

  async logout() {
    await this.open();
    await this.logoutLink.click();
  }
}

module.exports = { MenuComponent };

