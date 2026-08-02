import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { TableSession, PayPartialRequest, SplitRemainingRequest, RouletteRequest, ApiResponse } from '../types';

const BASE_URL = 'http://192.168.111.2:5079/api';

/**
 * ApiService encapsulates all HTTP requests to the backend, ensuring strictly typed data models and centralized error handling.
 */
class ApiService {
  /**
   * Universal fetch wrapper for JSON requests.
   */
  private static async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = await SecureStore.getItemAsync('jwt_token');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'Network response was not ok';
      try {
        const text = await response.text();
        try {
          const errData = JSON.parse(text);
          if (errData.message) errorMessage = errData.message;
          else if (typeof errData === 'string') errorMessage = errData;
        } catch {
          if (text) errorMessage = text;
        }
      } catch (e) {
        // Ignore
      }
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  }

  /**
   * Fetches all active table sessions (Admin).
   */
  static async getAllTables(): Promise<{ success: boolean; tables: TableSession[] }> {
    return this.fetchJson<{ success: boolean; tables: TableSession[] }>('/tables');
  }

  /**
   * Register a new user
   */
  static async register(payload: any): Promise<{ success: boolean; token?: string; user?: any; message?: string }> {
    return this.fetchJson<{ success: boolean; token?: string; user?: any; message?: string }>(`/auth/register`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Login user
   */
  static async login(email: string, password: string): Promise<{ success: boolean; token?: string; user?: any; requiresOtp?: boolean; email?: string; message?: string }> {
    return this.fetchJson<{ success: boolean; token?: string; user?: any; requiresOtp?: boolean; email?: string; message?: string }>(`/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  /**
   * Verify OTP
   */
  static async verifyOtp(email: string, code: string): Promise<{ success: boolean; token?: string; user?: any; message?: string }> {
    return this.fetchJson<{ success: boolean; token?: string; user?: any; message?: string }>(`/auth/verify-otp`, {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  /**
   * Get User Payment Methods
   */
  static async getPaymentMethods(): Promise<{ success: boolean; methods: any[] }> {
    return this.fetchJson<{ success: boolean; methods: any[] }>(`/payments/methods`);
  }

  /**
   * Get User History
   */
  static async getHistory(): Promise<{ success: boolean; history: any[] }> {
    return this.fetchJson<{ success: boolean; history: any[] }>(`/users/me/history`);
  }

  /**
   * Get User Friends
   */
  static async getFriends(): Promise<{ success: boolean; friends: any[] }> {
    return this.fetchJson<{ success: boolean; friends: any[] }>(`/users/me/friends`);
  }

  /**
   * Fetches the complete table session data.
   * @param tableId The UUID of the table session.
   * @returns A strictly typed TableSession promise.
   */
  static async getTableSession(tableId: string): Promise<TableSession> {
    return this.fetchJson<TableSession>(`/tables/${tableId}`);
  }

  /**
   * Processes a partial payment for a specific item.
   */
  static async payPartial(tableId: string, payload: PayPartialRequest): Promise<ApiResponse> {
    return this.fetchJson<ApiResponse>(`/bills/${tableId}/pay-partial`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Splits the remaining unpaid bill evenly.
   */
  static async splitRemaining(tableId: string, payload: SplitRemainingRequest): Promise<ApiResponse> {
    return this.fetchJson<ApiResponse>(`/bills/${tableId}/split-remaining`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Splits a specific shared item proportionally.
   */
  static async splitSharedItem(tableId: string, payload: { itemId: number, userIds: string[] }): Promise<ApiResponse> {
    return this.fetchJson<ApiResponse>(`/bills/${tableId}/split-shared`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Applies tax and tip proportionally to user base shares.
   */
  static async applyTax(tableId: string, payload: { userBaseShares: Record<string, number>, taxPercent: number, tipPercent: number }): Promise<ApiResponse> {
    return this.fetchJson<ApiResponse>(`/bills/${tableId}/apply-tax`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Plays the bill roulette to randomly assign an unpaid item.
   */
  static async playRoulette(tableId: string, payload: { participantIds: string[] }): Promise<{ success: boolean; rouletteResult: any }> {
    return this.fetchJson<{ success: boolean; rouletteResult: any }>(`/bills/${tableId}/roulette`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Processes a real payment and returns a digital receipt.
   */
  static async processCheckout(payload: { tableId: string; userId: string; taxAndTipAmount: number; cardToken: string }): Promise<{ success: boolean; receipt: any }> {
    return this.fetchJson<{ success: boolean; receipt: any }>(`/payments/checkout`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export default ApiService;
