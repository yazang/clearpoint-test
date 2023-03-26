export default class TodoListApi {
    readonly baseApiUrl = 'http://localhost:3002';

    readonly todoItems = `${this.baseApiUrl}/api/todoItems`;
    todoItem = (id: string) => `${this.todoItems}/${id}`;
}