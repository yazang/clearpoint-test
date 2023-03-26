import { Locator, Page, expect } from "@playwright/test";

export default class AddItemForm {
  readonly page: Page;
  addItemInput: Locator;
  addItemButton: Locator;
  clearButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addItemInput = this.page.locator('#formAddTodoItem');
    this.addItemButton = this.page.locator('button:text("Add Item")');
    this.clearButton = this.page.locator('button:text("Clear")');
  }

  async isLoaded() {
    await expect(this.addItemInput).toBeVisible();
    await expect(this.addItemButton).toBeVisible();
    await expect(this.clearButton).toBeVisible();
  }

  async addItem(description: string) {
    await this.addItemInput.type(description);
    await this.addItemButton.click();
  }

  async clear() {
    await this.clearButton.click();
  }
}