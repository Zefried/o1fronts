import { useCallback } from 'react';
import { taskQueueManager, type BackgroundTaskType } from './TaskQueueManager';

export function useBackgroundTasks() {
  const pushTask = useCallback((type: BackgroundTaskType, payload: any) => {
    taskQueueManager.pushTask(type, payload);
  }, []);

  return { pushTask };
}
