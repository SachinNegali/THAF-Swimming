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

export interface SocialLoginRequest {
  provider: 'google' | 'apple' | 'facebook';
  socialId: string;
  email: string;
  fName: string;
  lName: string;
  profilePicture?: string;
}

export interface AuthResponse {
  user: {
    _id: string;
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
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  name: string;
  locationType: 'point' | 'area' | 'city';
}

// ─── Trips ──────────────────────────────────────────────

export interface Trip {
  id: string;
  title: string;
  description?: string;
  creator: string;
  startLocation: GeoLocation;
  endLocation: GeoLocation;
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
  endLocation: GeoLocation;
  stops?: GeoLocation[];
  startDate: string;
  endDate: string;
}

export interface UpdateTripRequest {
  title?: string;
  description?: string;
  startLocation?: GeoLocation;
  endLocation?: GeoLocation;
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
  endLocation: GeoLocation;
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
  endLocation: GeoLocation;
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
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: GroupMember[];
  creator: string;
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  members?: string[];
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

export interface Message {
  id: string;
  groupId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  isDeleted: boolean;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageRequest {
  content: string;
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
  | 'notification';

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
