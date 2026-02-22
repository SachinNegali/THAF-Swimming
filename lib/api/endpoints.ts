/**
 * API Endpoint Constants
 * Centralized endpoint definitions for type-safe API calls
 * Aligned with Postman collection (Circles API)
 */

// Base URL — loaded from environment, defaults to local dev server
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://abd1-152-57-37-183.ngrok-free.app/v1';

export const endpoints = {
  // ─── Auth ──────────────────────────────────────────────
  auth: {
    socialLogin: '/auth/social-login',
    refreshTokens: '/auth/refresh-tokens',
  },

  // ─── Trips ─────────────────────────────────────────────
  trips: {
    base: '/trip',
    byId: (id: string) => `/trip/${id}`,
    create: '/trip',
    update: (id: string) => `/trip/${id}`,
    delete: (id: string) => `/trip/${id}`,
    addParticipants: (id: string) => `/trip/${id}/participants`,
    removeParticipant: (id: string, userId: string) =>
      `/trip/${id}/participants/${userId}`,
  },

  // ─── Events ────────────────────────────────────────────
  events: {
    base: '/event',
    byId: (id: string) => `/event/${id}`,
    create: '/event',
    update: (id: string) => `/event/${id}`,
    delete: (id: string) => `/event/${id}`,
    join: (id: string) => `/event/${id}/join`,
    leave: (id: string) => `/event/${id}/leave`,
    participants: (id: string) => `/event/${id}/participants`,
  },

  // ─── Groups (Chat) ────────────────────────────────────
  groups: {
    base: '/group',
    byId: (id: string) => `/group/${id}`,
    create: '/group',
    update: (id: string) => `/group/${id}`,
    delete: (id: string) => `/group/${id}`,
    addMembers: (id: string) => `/group/${id}/members`,
    removeMember: (id: string, userId: string) =>
      `/group/${id}/members/${userId}`,
    updateMemberRole: (id: string, userId: string) =>
      `/group/${id}/members/${userId}/role`,
    leave: (id: string) => `/group/${id}/leave`,
    // Messages within a group
    messages: (id: string) => `/group/${id}/messages`,
    sendMessage: (id: string) => `/group/${id}/messages`,
  },

  // ─── Messages (standalone) ────────────────────────────
  messages: {
    delete: (id: string) => `/message/${id}`,
    markAsRead: (id: string) => `/message/${id}/read`,
  },

  // ─── Users ─────────────────────────────────────────────
  users: {
    base: '/users',
    byId: (id: string) => `/users/${id}`,
    update: (id: string) => `/users/${id}`,
    search: '/users/search',
  },

  // ─── Device registration ──────────────────────────────
  devices: {
    register: '/devices/register',
  },

  // ─── E2EE Key management ──────────────────────────────
  keys: {
    uploadBundle: '/keys/bundle',
    fetchBundle: (userId: string) => `/keys/bundle/${userId}`,
    replenishPreKeys: '/keys/prekeys',
    preKeyCount: '/keys/prekeys/count',
  },

  // ─── Encrypted messages ───────────────────────────────
  encryptedMessages: {
    send: (chatId: string) => `/chats/${chatId}/messages/encrypted`,
    list: (chatId: string) => `/chats/${chatId}/messages/encrypted`,
  },

  // ─── Encrypted media ─────────────────────────────────
  media: {
    upload: '/media/upload',
    download: (mediaId: string) => `/media/${mediaId}`,
  },

  // ─── Group sender key distribution ────────────────────
  groupKeys: {
    distribute: (groupId: string) => `/groups/${groupId}/sender-keys`,
    fetch: (groupId: string) => `/groups/${groupId}/sender-keys`,
  },

  // ─── Server-Sent Events ──────────────────────────────
  sse: {
    stream: '/sse/stream',
    poll: '/sse/poll',
  },

  // ─── Notifications ───────────────────────────────────
  notifications: {
    base: '/notification',
    unreadCount: '/notification/unread-count',
    markAsRead: (id: string) => `/notification/${id}/read`,
    markAllAsRead: '/notification/read-all',
    delete: (id: string) => `/notification/${id}`,
  },
};
