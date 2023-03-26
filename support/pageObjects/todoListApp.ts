import { Locator, Page, expect } from "@playwright/test";
import AddItemForm from "./addItemForm";
import TodoListTable from "./todoListTable";

export default class TodoListApp {
  readonly page: Page;

  bannerImg: Locator;
  welcomeMsg: Locator;
  alert: Locator;

  readonly addItemForm: AddItemForm;
  readonly todoListTable: TodoListTable;

  constructor(page: Page) {
    this.page = page;

    this.bannerImg = this.page.locator('img[src="clearPointLogo.png"]');
    this.welcomeMsg = this.page.locator('.alert-heading.h4');
    this.alert = this.page.locator('.alert-danger');

    this.addItemForm = new AddItemForm(page);
    this.todoListTable = new TodoListTable(page);
  }

  async isLoaded() {
    await expect(this.bannerImg).toBeVisible();
    await expect(this.welcomeMsg).toBeVisible();
    await this.addItemForm.isLoaded();
    await this.todoListTable.isLoaded();
  }

  async alertDisplayed() {
    await expect(this.alert).toBeVisible();
  }
}