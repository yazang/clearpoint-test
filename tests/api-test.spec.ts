import { test, expect } from '@playwright/test';
import TodoListApi from '../support/apiDefinitions/todoListApi';
import { TodoItemDto } from '../support/models/todoItemDto';
import { removeStringQuotes } from '../support/utils/stringUtils';

const todoListApi = new TodoListApi();

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

test('get /todoItems should be successful.', async ({ request }) => {
  // Arrange
  // Act
  const apiResponse = await request.get(todoListApi.todoItems);
  expect(apiResponse.ok()).toBeTruthy();

  // Assert get list return seeded data.
  const todoItems = await apiResponse.json() as TodoItemDto[];
  for (const item of seedTodoItems) {
    expect(todoItems.some(e => e.description === item.description)).toBeTruthy();
  }
  // Assert list only contains un-completed items.
  todoItems.every(e => expect(e.isCompleted).toBeFalsy());
})

// Data driven test cases, include positive and negative test cases.
const postTestCases = [
  {
    scenario: 'valid payload should return Success',
    payload: {
      description: 'New task ' + Date.now(),
    },
    code: 201,
  },
  {
    scenario: 'empty payload should return Bad Request',
    payload: {
      description: '',
    },
    code: 400,
  },
  {
    scenario: 'duplicate description should return Conflict',
    payload: {
      description: 'Duplicate Task',
    },
    code: 409,
  },
]
for (const testCase of postTestCases) {
  test(`post /todoItems ${testCase.scenario}`, async ({ request }) => {
    // Arrange
    // Act
    const apiResponse = await request.post(todoListApi.todoItems, {
      data: testCase.payload
    });
    // Assert
    expect(apiResponse.status()).toBe(testCase.code);
  })
}

//TODO: convert it into data driven test cases, include positive and negative test cases.
const getItemTestCases = [
  {
    scenario: 'valid id should return Success',
    payload: {
      description: 'Task 1',
    },
    code: 200,
  },
  {
    scenario: 'invalid id should return Not Found',
    payload: {
      description: 'No such task',
    },
    code: 404,
  },
]
for (const testCase of getItemTestCases) {
  test(`get /todoItems/{id} ${testCase.scenario}`, async ({ request }) => {
    // Arrange
    // Get id from get list api
    const getListResponse = await request.get(todoListApi.todoItems);
    expect(getListResponse.ok()).toBeTruthy();
    const todoItems = await getListResponse.json() as TodoItemDto[];
    const found = todoItems.find(e => e.description === testCase.payload.description);
    // Deal with not found test case
    const id = found ? found.id : 'this-id-does-not-exist';

    // Act
    const apiResponse = await request.get(todoListApi.todoItem(id));

    // Assert
    expect(apiResponse.status()).toBe(testCase.code);
  })
}

test('should be able to mark item as completed.', async ({ request }) => {
  // Arrange
  // Prepare test data
  const description = 'To be completed.';
  const getListResponse = await request.get(todoListApi.todoItems);
  expect(getListResponse.ok()).toBeTruthy();
  const todoItems = await getListResponse.json() as TodoItemDto[];
  const found = todoItems.find(e => e.description === description);
  let id = '';

  if (found) {
    id = found.id;
  }
  else {
    const newItemResponse = await request.post(todoListApi.todoItems, {
      data: {
        description,
      }
    });
    expect(newItemResponse.ok()).toBeTruthy();
    id = removeStringQuotes(await newItemResponse.text());
  }

  // Act
  const putItemResponse = await request.put(todoListApi.todoItem(id), {
    data: {
      description,
      id,
      isCompleted: true,
    }
  });

  // Assert
  expect(putItemResponse.ok()).toBeTruthy();
  // Check status of item
  const getItemResponse = await request.get(todoListApi.todoItem(id));
  expect(getItemResponse.ok()).toBeTruthy();
  const todoItem = await getItemResponse.json() as TodoItemDto;
  expect(todoItem.isCompleted).toBe(true);
  // List should not display completed items
  const newTodoItems = await getListResponse.json() as TodoItemDto[];
  const completed = newTodoItems.find(e => e.description === description);
  expect(completed).toBeUndefined();
})

test('put /todoItems/{id} item Not Found.', async ({ request }) => {
  // Arrange
  // Act
  const apiResponse = await request.put(todoListApi.todoItem('this-id-does-not-exist'), {
    data: {
      description: 'Not exist',
      id: 'this-id-does-not-exist',
      isCompleted: true,
    }
  })

  // Assert
  expect(apiResponse.status()).toBe(400);
})

test('should be able to rename item.', async ({ request }) => {
  // Arrange
  // Prepare test data
  const description = 'To be renamed.';
  const getListResponse = await request.get(todoListApi.todoItems);
  expect(getListResponse.ok()).toBeTruthy();
  const todoItems = await getListResponse.json() as TodoItemDto[];
  const found = todoItems.find(e => e.description === description);
  let id = '';

  if (found) {
    id = found.id;
  }
  else {
    const newItemResponse = await request.post(todoListApi.todoItems, {
      data: {
        description,
      }
    });
    expect(newItemResponse.ok()).toBeTruthy();
    id = removeStringQuotes(await newItemResponse.text());
  }

  // Act
  const rename = 'Renamed.';
  const apiResponse = await request.put(todoListApi.todoItem(id), {
    data: {
      description: rename,
      id,
      isCompleted: false,
    }
  });

  // Assert
  expect(apiResponse.ok()).toBeTruthy();
  // Check description after renamed
  const getItemResponse = await request.get(todoListApi.todoItem(id));
  expect(getItemResponse.ok()).toBeTruthy();
  const todoItem = await getItemResponse.json() as TodoItemDto;
  expect(todoItem.description).toBe(rename);
})

// Bug: renaming a task can create duplicate item description.
test('should NOT be able to create duplicate task by renaming.', async ({ request }) => {
  // Arrange
  // Prepare test data
  const description = 'To be renamed.';
  const getListResponse = await request.get(todoListApi.todoItems);
  expect(getListResponse.ok()).toBeTruthy();
  const todoItems = await getListResponse.json() as TodoItemDto[];
  const found = todoItems.find(e => e.description === description);
  let id = '';

  if (found) {
    id = found.id;
  }
  else {
    const newItemResponse = await request.post(todoListApi.todoItems, {
      data: {
        description,
      }
    });
    expect(newItemResponse.ok()).toBeTruthy();
    id = removeStringQuotes(await newItemResponse.text());
  }

  // Act
  const rename = 'Duplicate Task';
  const apiResponse = await request.put(todoListApi.todoItem(id), {
    data: {
      description: rename,
      id,
      isCompleted: false,
    }
  });

  // Assert
  expect(apiResponse.ok()).toBeFalsy();
})
