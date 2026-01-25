// API Consistency: Match dashboard constants exactly
export type Program = 'REGISTERED-NURSING' | 'MIDWIFERY' | 'PUBLIC-HEALTH' | 'MENTAL-HEALTH' | 'ONCOLOGY' | 'PAEDIATRIC';
export type YearOfStudy = 'YEAR1' | 'YEAR2' | 'YEAR3';
export type Subject = string;
export type ContentType = 'PDF' | 'AUDIO' | 'MARKING_KEY' | 'PAST_PAPER';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED';

export interface UserProfile {
    $id: string;
    userId: string;
    fullName: string;
    email: string;
    whatsappNumber: string;
    yearOfStudy: YearOfStudy;
    program: Program;
    verified: boolean;
    adminApproved: boolean;
    deviceId?: string;
    avatarUrl?: string;
    avatarFileId?: string;
    lastNotificationCheck?: string;
}

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    date: string;
    type: 'CONTENT' | 'SUBSCRIPTION' | 'SYSTEM';
    isRead: boolean;
}

export interface Subscription {
    $id: string;
    userId: string;
    status: SubscriptionStatus;
    startDate: string;
    endDate: string;
}

export interface ContentItem {
    $id: string;
    title: string;
    description: string;
    type: ContentType;
    yearOfStudy: YearOfStudy;
    program: Program;
    subject?: Subject;
    storageFileId: string;
    durationSeconds?: number;
}

export interface AccessCode {
    $id: string;
    code: string;
    durationDays: number;
    isUsed: boolean;
    usedByUserId?: string;
    usedAt?: string;
}
