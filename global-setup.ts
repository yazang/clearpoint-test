import { test, expect } from '@playwright/test';
import TodoListApi from './support/apiDefinitions/todoListApi';
import { TodoItemDto } from './support/models/todoItemDto';

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

// Background, seed database if empty
test.beforeAll(async ({ request }) => {
  const todoListApi = new TodoListApi();
  const apiResponse = await request.get(todoListApi.todoItems);
  const todoItems = await apiResponse.json() as TodoItemDto[];
  for (const item of seedTodoItems) {
    if (!todoItems.some(e => e.description === item.description)) {
      const newItem = await request.post(todoListApi.todoItems, {
        data: item
      });
      expect(newItem.ok()).toBeTruthy();
    }
  }
})