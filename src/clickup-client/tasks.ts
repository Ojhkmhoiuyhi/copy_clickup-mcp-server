import { ClickUpClient } from './index.js';

export interface Task {
  id: string;
  name: string;
  description?: string;
  status?: {
    status: string;
    color: string;
  };
  date_created?: string;
  date_updated?: string;
  date_closed?: string;
  creator?: {
    id: number;
    username: string;
    email: string;
  };
  assignees?: Array<{
    id: number;
    username: string;
    email: string;
  }>;
  priority?: {
    id: string;
    priority: string;
    color: string;
  };
  due_date?: string | null;
  start_date?: string | null;
  time_estimate?: number | null;
  time_spent?: number | null;
  custom_fields?: Array<any>;
  list?: {
    id: string;
    name: string;
  };
  folder?: {
    id: string;
    name: string;
  };
  space?: {
    id: string;
    name: string;
  };
  url: string;
}

export interface CreateTaskParams {
  name: string;
  description?: string;
  assignees?: number[];
  tags?: string[];
  status?: string;
  priority?: number;
  due_date?: number;
  due_date_time?: boolean;
  time_estimate?: number;
  start_date?: number;
  start_date_time?: boolean;
  notify_all?: boolean;
  parent?: string;
  links_to?: string;
  check_required_custom_fields?: boolean;
  custom_fields?: Array<{
    id: string;
    value: any;
  }>;
}

export interface UpdateTaskParams {
  name?: string;
  description?: string;
  assignees?: number[];
  status?: string;
  priority?: number;
  due_date?: number;
  due_date_time?: boolean;
  time_estimate?: number;
  start_date?: number;
  start_date_time?: boolean;
  notify_all?: boolean;
  parent?: string;
  custom_fields?: Array<{
    id: string;
    value: any;
  }>;
}

export interface GetTasksParams {
  page?: number;
  order_by?: string;
  reverse?: boolean;
  subtasks?: boolean;
  statuses?: string[];
  include_closed?: boolean;
  assignees?: number[];
  due_date_gt?: number;
  due_date_lt?: number;
  date_created_gt?: number;
  date_created_lt?: number;
  date_updated_gt?: number;
  date_updated_lt?: number;
  custom_fields?: Array<{
    field_id: string;
    operator: string;
    value: any;
  }>;
}

export class TasksClient {
  private client: ClickUpClient;

  constructor(client: ClickUpClient) {
    this.client = client;
  }

  /**
   * Get tasks from a specific list
   * @param listId The ID of the list to get tasks from
   * @param params Optional parameters for filtering tasks
   * @returns A list of tasks
   */
  async getTasksFromList(listId: string, params?: GetTasksParams): Promise<{ tasks: Task[] }> {
    return this.client.get(`/list/${listId}/task`, params);
  }

  /**
   * Get tasks from a specific folder
   * @param folderId The ID of the folder to get tasks from
   * @param params Optional parameters for filtering tasks
   * @returns A list of tasks
   */
  async getTasksFromFolder(folderId: string, params?: GetTasksParams): Promise<{ tasks: Task[] }> {
    return this.client.get(`/folder/${folderId}/task`, params);
  }

  /**
   * Get tasks from a specific space
   * @param spaceId The ID of the space to get tasks from
   * @param params Optional parameters for filtering tasks
   * @returns A list of tasks
   */
  async getTasksFromSpace(spaceId: string, params?: GetTasksParams): Promise<{ tasks: Task[] }> {
    return this.client.get(`/space/${spaceId}/task`, params);
  }

  /**
   * Get a specific task by ID
   * @param taskId The ID of the task to get
   * @returns The task details
   */
  async getTask(taskId: string): Promise<Task> {
    return this.client.get(`/task/${taskId}`);
  }

  /**
   * Create a new task in a list
   * @param listId The ID of the list to create the task in
   * @param params The task parameters
   * @returns The created task
   */
  async createTask(listId: string, params: CreateTaskParams): Promise<Task> {
    return this.client.post(`/list/${listId}/task`, params);
  }

  /**
   * Update an existing task
   * @param taskId The ID of the task to update
   * @param params The task parameters to update
   * @returns The updated task
   */
  async updateTask(taskId: string, params: UpdateTaskParams): Promise<Task> {
    return this.client.put(`/task/${taskId}`, params);
  }

  /**
   * Delete a task
   * @param taskId The ID of the task to delete
   * @returns Success message
   */
  async deleteTask(taskId: string): Promise<{ success: boolean }> {
    return this.client.delete(`/task/${taskId}`);
  }
}

export const createTasksClient = (client: ClickUpClient): TasksClient => {
  return new TasksClient(client);
};
