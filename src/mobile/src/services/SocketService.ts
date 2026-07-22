import * as signalR from '@microsoft/signalr';
import { Platform } from 'react-native';

// For local testing on iOS simulator, localhost is fine. 
// For Android emulator it would be 10.0.2.2.
const HUB_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5079/tablehub' : 'http://localhost:5079/tablehub';

class SocketService {
  private connection: signalR.HubConnection | null = null;

  public async connect() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .build();

    try {
      await this.connection.start();
      console.log('SignalR Connected!');
    } catch (err) {
      console.error('SignalR Connection Error: ', err);
    }
  }

  public async joinTable(tableId: string) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('JoinTableGroup', tableId);
    }
  }

  public async joinAdminGroup() {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('JoinAdminGroup');
    }
  }

  public async selectItemToPay(tableId: string, itemId: number, userId: string) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('SelectItemToPay', tableId, itemId, userId);
    }
  }

  public async joinStaffGroup() {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('JoinStaffGroup');
    }
  }

  public async callWaiter(tableId: string) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('CallWaiter', tableId);
    }
  }

  public async sendOrderToKitchen(tableId: string, name: string, price: number) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('SendOrderToKitchen', tableId, { name, price });
    }
  }

  public on(eventName: string, callback: (...args: any[]) => void) {
    this.connection?.on(eventName, callback);
  }

  public off(eventName: string) {
    this.connection?.off(eventName);
  }
}

export default new SocketService();
