import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';

const QUEUE_KEY = '@offline_action_queue';

export interface OfflineAction {
  id: string;
  type: 'ADD_ITEM' | 'REMOVE_ITEM' | 'LOCK_ITEM' | 'UNLOCK_ITEM';
  endpoint: string;
  payload: any;
  timestamp: number;
}

class OfflineQueueService {
  private isProcessing = false;

  constructor() {
    // Listen for network changes to flush queue
    NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        this.flushQueue();
      }
    });
  }

  async enqueue(action: Omit<OfflineAction, 'id' | 'timestamp'>) {
    try {
      const state = await NetInfo.fetch();
      
      const newAction: OfflineAction = {
        ...action,
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
      };

      if (state.isConnected && state.isInternetReachable) {
        // Attempt immediate execution
        try {
          await this.executeAction(newAction);
          return; // Success
        } catch (e) {
          console.warn('Immediate execution failed, queueing action:', e);
        }
      }

      // Add to queue
      const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
      const queue: OfflineAction[] = queueStr ? JSON.parse(queueStr) : [];
      queue.push(newAction);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      
    } catch (e) {
      console.error('Failed to enqueue action:', e);
    }
  }

  async flushQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
      if (!queueStr) return;
      
      let queue: OfflineAction[] = JSON.parse(queueStr);
      if (queue.length === 0) return;

      const failedQueue: OfflineAction[] = [];

      for (const action of queue) {
        try {
          await this.executeAction(action);
        } catch (e) {
          console.warn(`Failed to process action ${action.id}, keeping in queue`, e);
          failedQueue.push(action);
        }
      }

      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failedQueue));
    } catch (e) {
      console.error('Failed to flush queue:', e);
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeAction(action: OfflineAction) {
    const method = action.type.includes('REMOVE') ? 'DELETE' : 'POST';
    
    await axios({
      method,
      url: action.endpoint,
      data: action.payload,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export default new OfflineQueueService();
