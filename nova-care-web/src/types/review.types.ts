export type ReviewTargetType = 'DOCTOR' | 'HOSPITAL';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
export type ReportReason =
  | 'INAPPROPRIATE_LANGUAGE'
  | 'FALSE_INFORMATION'
  | 'SPAM_ADVERTISEMENT'
  | 'PRIVACY_VIOLATION'
  | 'OTHER';

export interface ReviewCriteriaScores {
  doctorAttitude?: number | null;
  doctorExplanation?: number | null;
  doctorDedication?: number | null;
  doctorCommunication?: number | null;
  hospitalFacility?: number | null;
  hospitalHygiene?: number | null;
  hospitalReception?: number | null;
  hospitalWaitingTime?: number | null;
  hospitalStaffAttitude?: number | null;
}

export interface ReviewResponseItem {
  id: string;
  responderName: string;
  responderRole: string;
  responseContent: string;
  createdAt: string;
}

export interface ReviewItem {
  id: string;
  appointmentId: string;
  userId: string;
  targetType: ReviewTargetType;
  doctorId?: string | null;
  hospitalId?: string | null;
  rating: number;
  comment: string;
  isAnonymous: boolean;
  status: ReviewStatus;
  moderationReason?: string | null;
  editWindowUntil: string;
  canEdit?: boolean;
  remainingEditSeconds?: number;
  isEdited: boolean;
  editedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  authorName?: string;
  isVerifiedVisit?: boolean;
  criteria?: {
    attitude?: number | null;
    explanation?: number | null;
    dedication?: number | null;
    communication?: number | null;
    facility?: number | null;
    hygiene?: number | null;
    reception?: number | null;
    waitingTime?: number | null;
    staffAttitude?: number | null;
  } | null;
  criteriaScore?: ReviewCriteriaScores | null;
  responses?: ReviewResponseItem[];
  appointment?: {
    bookingCode: string;
    completedAt?: string | null;
  };
  doctor?: {
    id: string;
    fullName: string;
    title?: string | null;
    avatarUrl?: string | null;
  };
  hospital?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    address?: string | null;
  };
  user?: {
    id: string;
    fullName: string;
    email?: string | null;
    phone?: string | null;
  };
}

export interface ReviewStats {
  targetType: ReviewTargetType;
  targetId: string;
  totalReviews: number;
  averageRating: number;
  starDistribution: Record<number, { count: number; percentage: number }>;
  criteriaAverages: Record<string, number>;
}

export interface ReviewEligibility {
  appointmentId: string;
  bookingCode: string;
  status: string;
  isCompleted: boolean;
  completedAt?: string | null;
  doctor?: {
    id: string;
    fullName: string;
    title?: string | null;
    avatarUrl?: string | null;
    specialty?: string;
  } | null;
  hospital?: {
    id: string;
    name: string;
    address?: string | null;
    logoUrl?: string | null;
  } | null;
  doctorReview?: {
    id: string;
    rating: number;
    comment: string;
    status: ReviewStatus;
    moderationReason?: string | null;
    canEdit: boolean;
    editWindowUntil: string;
    remainingEditSeconds: number;
    isEdited: boolean;
  } | null;
  hospitalReview?: {
    id: string;
    rating: number;
    comment: string;
    status: ReviewStatus;
    moderationReason?: string | null;
    canEdit: boolean;
    editWindowUntil: string;
    remainingEditSeconds: number;
    isEdited: boolean;
  } | null;
  canReviewDoctor: boolean;
  canReviewHospital: boolean;
}

export interface CreateReviewInput {
  appointmentId: string;
  targetType: ReviewTargetType;
  rating: number;
  comment: string;
  isAnonymous?: boolean;
  criteria?: ReviewCriteriaScores;
}

export interface UpdateReviewInput {
  rating: number;
  comment: string;
  isAnonymous?: boolean;
  criteria?: ReviewCriteriaScores;
}

export interface ModerateReviewInput {
  status: 'APPROVED' | 'REJECTED' | 'HIDDEN';
  moderationReason?: string;
}

export interface CreateReviewResponseInput {
  responseContent: string;
}

export interface CreateReviewReportInput {
  reason: ReportReason;
  description?: string;
}
