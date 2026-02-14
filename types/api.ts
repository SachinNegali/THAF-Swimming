/**
 * API Request and Response Types
 */

// Pagination
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

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    phoneNumber?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Trips
export interface Location {
  type: 'point' | 'area' | 'city';
  name: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  city?: string;
  state?: string;
  country?: string;
}

export interface Trip {
  id: string;
  userId: string;
  from: Location;
  to: Location;
  stops?: Location[];
  startDate: string;
  endDate: string;
  description?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripRequest {
  from: Location;
  to: Location;
  stops?: Location[];
  startDate: string;
  endDate: string;
  description?: string;
  maxParticipants?: number;
}

export interface UpdateTripRequest extends Partial<CreateTripRequest> {
  status?: Trip['status'];
}

export interface TripFilters extends PaginationParams {
  status?: Trip['status'];
  startDateFrom?: string;
  startDateTo?: string;
  userId?: string;
}

// Events
export interface Event {
  id: string;
  title: string;
  description?: string;
  startLocation: Location;
  endLocation: Location;
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
  startLocation: Location;
  endLocation: Location;
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

// Chats & Messages
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  isDeleted: boolean;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: string[];
  admins: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatRequest {
  name?: string;
  type: 'direct' | 'group';
  participants: string[];
}

export interface SendMessageRequest {
  content: string;
  type: 'text' | 'image' | 'file';
}

export interface MessageFilters extends PaginationParams {
  before?: string;
  after?: string;
}

// Users
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
