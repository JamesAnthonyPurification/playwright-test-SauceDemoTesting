class BasePage {
  constructor(page, path = '/') {
    this.page = page;
    this.path = path;
  }

  async visit() {
    await this.page.goto(this.path);
  }

  getCurrentUrl() {
    return this.page.url();
  }
}

module.exports = { BasePage };

