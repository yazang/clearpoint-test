import { Locator, Page, expect } from "@playwright/test";
import { TodoItemDto } from "../models/todoItemDto";

export default class TodoListTable {
  readonly page: Page;
  readonly refreshButton: Locator;
  readonly table: Locator;
  readonly tableRowLocator = 'table > tbody > tr';

  constructor(page: Page) {
    this.page = page;
    this.refreshButton = this.page.getByText('Refresh');
    this.table = this.page.locator('table > tbody');
  }

  async isLoaded() {
    await expect(this.refreshButton).toBeVisible();
    await expect(this.table).toBeVisible();
  }

  async refresh() {
    await this.refreshButton.click();
  }

  async getTodoList(): Promise<TodoItemDto[]> {
    const rows = await this.page.$$(this.tableRowLocator);
    const items = [] as TodoItemDto[];
    for (const row of rows) {
      const idColumn = await row.$('td:nth-child(1)');
      const id = await idColumn!.innerText();
      const descriptionColumn = await row.$('td:nth-child(2)');
      const description = await descriptionColumn!.innerText()
      items.push({
        id,
        description,
        isCompleted: false,
      })
    }

    return items;
  }

  async markItemComplete(description: string): Promise<boolean> {
    const rows = await this.page.$$(this.tableRowLocator);
    for (const row of rows) {
      const descriptionColumn = await row.$('td:nth-child(2)');
      const descriptionInTable = await descriptionColumn!.innerText()
      if (descriptionInTable === description) {
        const completeButton = await row.$('td:nth-child(3) > button');
        await completeButton!.click();
        return true;
      }
    }

    return false;
  }
}
