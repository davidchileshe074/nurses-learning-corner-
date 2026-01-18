// API Consistency: Match dashboard constants exactly
export type Program = 'G-NURSING' | 'MIDWIFERY' | 'PUBLIC-HEALTH' | 'MENTAL-HEALTH';
export type YearOfStudy = 'YEAR1' | 'YEAR2' | 'YEAR3';
export type ContentType = 'PDF' | 'AUDIO' | 'VIDEO' | 'PAST_PAPER';
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
