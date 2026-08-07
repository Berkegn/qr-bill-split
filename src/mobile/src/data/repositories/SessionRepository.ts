import { apiAgent } from '../agent/apiAgent';
import { JoinResponse } from '../../domain/models/Session';

export const SessionRepository = {
  joinTable: async (tableId: string | number, userName: string): Promise<JoinResponse> => {
    return await apiAgent.post<JoinResponse>(`/tables/${tableId}/join`, { userName });
  },
};
