import { useState } from 'react';
import { SessionRepository } from '../../data/repositories/SessionRepository';
import { JoinResponse } from '../../domain/models/Session';

export const useJoinTable = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const joinSession = async (tableId: string | number, userName: string): Promise<JoinResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await SessionRepository.joinTable(tableId, userName);
      if (response && response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to join table.');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred.';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    joinSession,
  };
};
