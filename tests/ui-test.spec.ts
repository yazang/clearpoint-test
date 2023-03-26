import { test, expect } from '@playwright/test';
import TodoListApp from '../support/pageObjects/todoListApp';
import TodoListApi from '../support/apiDefinitions/todoListApi';
import { TodoItemDto } from '../support/models/todoItemDto';

const url = 'http://localhost:3000';

const seedTodoItems = [
  {
    description: 'Task 1',
  },
  {
    description: 'Task 2',
  },
  {
    description: 'Task 3',
  },
  {
    description: 'Duplicate Task',
  },
]

const todoListApi = new TodoListApi();

// Background, seed database if empty
test.beforeAll(async ({ request }) => {
  const apiResponse = await request.get(todoListApi.todoItems);
  const todoItems = await apiResponse.json() as TodoItemDto[];
  for (const item of seedTodoItems) {
    if (!todoItems.some(e => e.description === item.description)) {
      const newItem = await request.post(todoListApi.todoItems, {
        data: item
      });
      // expect(newItem.ok()).toBeTruthy();
    }
  }
})

//TODO: Background, seed database if empty

//Test: check page load: url, title, welcome message, add item form, items list, footer
test('Todo list app should load', async ({ page }) => {
  // Arrange
  const todoListApp = new TodoListApp(page);

  // Act
  await page.goto(url);

  // Assert
  await expect(page).toHaveURL(url);
  await todoListApp.isLoaded();
});

test('I can add new items', async ({ page }) => {
  // Arrange
  const todoListApp = new TodoListApp(page);
  await page.goto(url);

  // Act
  const description = 'New task ' + Date.now();
  await todoListApp.addItemForm.addItem(description);
  await todoListApp.todoListTable.refresh();

  // Assert
  const items = await todoListApp.todoListTable.getTodoList();
  expect(items.some(e => e.description === description)).toBe(true);
})

test('I can mark task as completed', async ({ page }) => {
  // Arrange
  const todoListApp = new TodoListApp(page);
  await page.goto(url);
  const description = 'New item ' + Date.now();
  await todoListApp.addItemForm.addItem(description);
  await todoListApp.todoListTable.refresh();

  // Act
  const completed = await todoListApp.todoListTable.markItemComplete(description);
  await todoListApp.todoListTable.refresh();

  // Assert
  expect(completed).toBe(true);
  // Check completed items are hidden from list
  const items = await todoListApp.todoListTable.getTodoList();
  expect(items.some(e => e.description === description)).toBe(false);
})

test('Can not add duplicate items', async ({ page }) => {
  // Arrange
  const todoListApp = new TodoListApp(page);
  await page.goto(url);
  const description = 'Duplicate Task';

  // Act
  await todoListApp.addItemForm.addItem(description);

  // Assert
  await todoListApp.alertDisplayed();
})
