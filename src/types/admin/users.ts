export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    transactions: number;
    listings: number;
    reports: number;
}

export interface SuspendedUser {
    userId: string;
    name: string;
    email: string;
    role: string;
    status: string;
    expiresAt: Date | null;
    suspendedAt: Date;
    userCreatedAt: Date;
}
