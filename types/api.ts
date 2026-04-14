/**
 * API Request and Response Types
 * Aligned with Postman collection (Circles API)
 */

// ─── Pagination ─────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─── Auth ────────────────────────────────────────────────

/**
 * @deprecated Use `GoogleAuthRequest` instead.
 * This type sent profile data from the frontend which is insecure —
 * profile data can be forged by a malicious client.
 */
export interface SocialLoginRequest {
  provider: 'google' | 'apple' | 'facebook';
  socialId: string;
  email: string;
  fName: string;
  lName: string;
  profilePicture?: string;
}

/**
 * SECURITY: Send ONLY the Google idToken to the backend.
 * The backend verifies this token with Google's servers and extracts
 * the user's profile info server-side. Never trust frontend profile data.
 */
export interface GoogleAuthRequest {
  idToken: string;
}

/**
 * Request to logout — send the refresh token so the backend can invalidate it.
 */
export interface LogoutRequest {
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    _id: string;
    userId?: string;
    fName: string;
    lName: string;
    email: string;
    socialAccounts?: Array<{
      provider: string;
      id: string;
      _id: string;
    }>;
    createdAt: string;
    updatedAt: string;
  };
  tokens: {
    access: {
      token: string;
      expires: string;
    };
    refresh: {
      token: string;
      expires: string;
    };
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ─── Shared Location (GeoJSON) ──────────────────────────

export interface GeoLocation {
  type: 'point' | 'area' | 'city';
  coordinates?: { lat: number; lng: number };
  name: string;
  city?: string;
  area?: string;
}

// ─── Trips ──────────────────────────────────────────────

export interface Trip {
  id: string;
  title: string;
  description?: string;
  creator: string;
  startLocation: GeoLocation;
  destination: GeoLocation;
  stops?: GeoLocation[];
  participants?: string[];
  startDate: string;
  endDate: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripRequest {
  title: string;
  description?: string;
  startLocation: GeoLocation;
  destination: GeoLocation;
  stops?: GeoLocation[];
  startDate: string;
  endDate: string;
}

export interface UpdateTripRequest {
  title?: string;
  description?: string;
  startLocation?: GeoLocation;
  destination?: GeoLocation;
  stops?: GeoLocation[];
  startDate?: string;
  endDate?: string;
  status?: Trip['status'];
}

export interface TripFilters extends PaginationParams {
  status?: Trip['status'];
  startDateFrom?: string;
  startDateTo?: string;
  userId?: string;
}

export interface AddParticipantsRequest {
  userIds: string[];
}

// ─── Events ─────────────────────────────────────────────

export interface Event {
  id: string;
  title: string;
  description?: string;
  startLocation: GeoLocation;
  destination: GeoLocation;
  startDate: string;
  endDate: string;
  maxParticipants?: number;
  currentParticipants: number;
  createdBy: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  startLocation: GeoLocation;
  destination: GeoLocation;
  startDate: string;
  endDate: string;
  maxParticipants?: number;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  status?: Event['status'];
}

export interface EventFilters extends PaginationParams {
  status?: Event['status'];
  startDateFrom?: string;
  startDateTo?: string;
}

// ─── Groups (Chat) ──────────────────────────────────────

export interface GroupMember {
  /** Populated user object — returned by the API */
  user?: {
    _id: string;
    fName: string;
    lName: string;
    email: string;
  };
  /** Normalized convenience field — use this in app code */
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
  _id?: string;
}

export interface Group {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  type: 'dm' | 'group';
  members: GroupMember[];
  creator?: string;
  createdBy?: string;
  lastMessage?: Message;
  lastActivity?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  memberIds?: string[];
  type?: 'group';
}

export interface CreateDMRequest {
  recipientId: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
}

export interface AddGroupMembersRequest {
  userIds: string[];
}

export interface UpdateMemberRoleRequest {
  role: 'admin' | 'member';
}

// ─── Messages ───────────────────────────────────────────

/** Per-image entry in `message.metadata.images` — server-driven. */
export interface MessageImageEntry {
  imageId: string;
  status: 'pending' | 'uploaded' | 'processing' | 'completed' | 'failed';
  thumbnailUrl: string | null;
  optimizedUrl: string | null;
  width: number | null;
  height: number | null;
}

export interface MessageMetadata {
  imageIds?: string[];
  images?: MessageImageEntry[];
}

export interface Message {
  _id: string;
  group: string;
  sender: string;
  content: string;
  type: 'text' | 'image' | 'file';
  isDeleted: boolean;
  readBy: string[];
  deliveredTo: string[];
  createdAt: string;
  updatedAt: string;
  metadata?: MessageMetadata;
}


export interface SendMessageRequest {
  content: string;
  type?: 'text' | 'image';
  metadata?: MessageMetadata;
}

export interface MessageFilters extends PaginationParams {
  before?: string;
  after?: string;
}

// ─── Users ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phoneNumber?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRequest {
  name?: string;
  avatar?: string;
  phoneNumber?: string;
  bio?: string;
}

export interface UserFilters extends PaginationParams {
  search?: string;
}

// ─── SSE Event Types ────────────────────────────────────

export type SSEEventType =
  | 'new_message'
  | 'message_deleted'
  | 'message_read'
  | 'group_updated'
  | 'member_added'
  | 'member_removed'
  | 'member_role_updated'
  | 'trip_updated'
  | 'notification'
  | 'upload_status'
  | 'message_image_updated'
  | 'message_media_ready';

export interface SSEEvent {
  type: SSEEventType;
  data: Record<string, unknown>;
  timestamp: string;
}

// ─── Notifications ──────────────────────────────────────

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}
