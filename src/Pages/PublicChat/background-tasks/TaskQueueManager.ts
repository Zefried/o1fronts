import api from "../../../api/axios";

export type BackgroundTaskType = 'EYE_ON_RESPONSES'; // Add more task types here in future

export interface BackgroundTask {
  id: string;
  type: BackgroundTaskType;
  payload: any;
}

class TaskQueueManager {
  private queue: BackgroundTask[] = [];
  private isProcessing: boolean = false;

  public pushTask(type: BackgroundTaskType, payload: any) {
    const task: BackgroundTask = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      type,
      payload
    };

    this.queue.push(task);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await this.executeTask(task);
      }
    }

    this.isProcessing = false;
  }

  private async executeTask(task: BackgroundTask) {
    try {
      if (task.type === 'EYE_ON_RESPONSES') {
        const response = await api.post('/public/eye-on-responses', task.payload);
        console.log('[Background Task: Eye On Responses]', response.data);
        // You can dispatch a global event here if you want other components to react to this
      }
    } catch (error) {
      console.error(`[Background Task Failed] ${task.type}`, error);
    }
  }
}

export const taskQueueManager = new TaskQueueManager();
