// Type definitions matching the frontend

/**
 * Photo record
 */
export interface Photo {
  id: string;
  filename: string;
  originalUrl: string;
  status: "pending" | "variations_ready" | "approved" | "captioned" | "published";
  createdAt: string;
}

/**
 * Image variation (different editing intensity)
 */
export interface Variation {
  id: string;
  photoId: string;
  intensity: number; // 1-5
  label: string; // "Subtle", "Light", "Medium", "Strong", "Intense"
  url: string;
}

/**
 * Photo with its variations, ready for approval
 */
export interface PendingApproval {
  photo: Photo;
  variations: Variation[];
}

/**
 * Approval record
 */
export interface Approval {
  id: string;
  photoId: string;
  variationId: string;
  feedback?: string;
  approvedAt: string;
}

/**
 * Publication record (when posted to Instagram)
 */
export interface Publication {
  id: string;
  photoId: string;
  caption: string;
  instagramPostId: string;
  publishedAt: string;
  status: "published" | "failed";
}

// API Response Types

export interface UploadResponse {
  success: boolean;
  photo: Photo;
  message: string;
}

export interface PendingApprovalsResponse {
  success: boolean;
  data: PendingApproval[];
  total: number;
}

export interface RegenerateResponse {
  success: boolean;
  variations: Variation[];
  message: string;
}

export interface ApproveResponse {
  success: boolean;
  approval: Approval;
  photo: Photo;
}

export interface PreviewResponse {
  success: boolean;
  photo: Photo;
  selectedVariation: Variation;
  caption: string;
}

export interface PublishResponse {
  success: boolean;
  message: string;
  publication: Publication;
  note?: string;
}

export interface HealthResponse {
  status: string;
  server: string;
  port: number;
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
}
