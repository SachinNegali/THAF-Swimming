/**
 * API Endpoint Constants
 * Centralized endpoint definitions for type-safe API calls
 */

// Base URL - Update this with your actual API URL
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const endpoints = {
  // Auth endpoints
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    currentUser: '/auth/me',
    socialLogin: (provider: string) => `/auth/${provider}`,
  },
  
  // Trip endpoints
  trips: {
    base: '/trips',
    byId: (id: string) => `/trips/${id}`,
    create: '/trips',
    update: (id: string) => `/trips/${id}`,
    delete: (id: string) => `/trips/${id}`,
    search: '/trips/search',
  },
  
  // Event endpoints
  events: {
    base: '/events',
    byId: (id: string) => `/events/${id}`,
    create: '/events',
    update: (id: string) => `/events/${id}`,
    delete: (id: string) => `/events/${id}`,
    join: (id: string) => `/events/${id}/join`,
    leave: (id: string) => `/events/${id}/leave`,
    participants: (id: string) => `/events/${id}/participants`,
  },
  
  // Chat endpoints
  chats: {
    base: '/chats',
    byId: (id: string) => `/chats/${id}`,
    create: '/chats',
    messages: (chatId: string) => `/chats/${chatId}/messages`,
    sendMessage: (chatId: string) => `/chats/${chatId}/messages`,
    deleteMessage: (chatId: string, messageId: string) => 
      `/chats/${chatId}/messages/${messageId}`,
    markAsRead: (chatId: string) => `/chats/${chatId}/read`,
  },
  
  // User endpoints
  users: {
    base: '/users',
    byId: (id: string) => `/users/${id}`,
    update: (id: string) => `/users/${id}`,
    search: '/users/search',
  },
};
