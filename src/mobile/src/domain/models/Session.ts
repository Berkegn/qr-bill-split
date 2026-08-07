export interface JoinRequest {
    userName: string;
}

export interface JoinResponse {
    success: boolean;
    sessionId: string;
    userId: string;
    message?: string;
}
