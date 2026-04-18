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
    /** @deprecated Use auth.google instead */
    socialLogin: '/auth/social-login',
    /** idToken-based Google auth — backend verifies the token server-side */
    google: '/auth/google',
    // refreshTokens: '/auth/refresh-tokens',
    refreshTokens: '/auth/refresh',
    /** Backend invalidates the refresh token */
    logout: '/auth/logout',
  },

  // ─── Trips ─────────────────────────────────────────────
  trips: {
    base: '/trip',
    filter: '/trip/filter',
    byId: (id: string) => `/trip/${id}`,
    create: '/trip',
    update: (id: string) => `/trip/${id}`,
    delete: (id: string) => `/trip/${id}`,
    addParticipants: (id: string) => `/trip/${id}/participants`,
    removeParticipant: (id: string, userId: string) =>
      `/trip/${id}/participants/${userId}`,
    join: (id: string) => `/trip/${id}/join`,
    joinRequests: (id: string) => `/trip/${id}/requests`,
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
    createDM: '/group/dm',
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
    dmMessages: (recipientId: string) => `/group/dm/${recipientId}/messages`,
    sendDMMessage: (recipientId: string) => `/group/dm/${recipientId}/messages`,
    sendMessage: (id: string) => `/group/${id}/messages`,
  },

  // ─── Messages (standalone) ────────────────────────────
  messages: {
    delete: (id: string) => `/message/${id}`,
    markAsRead: (id: string) => `/message/${id}/read`,
  },

  // ─── Users ─────────────────────────────────────────────
  users: {
    base: '/user',
    me: '/user/me',
    byId: (id: string) => `/user/${id}`,
    update: (id: string) => `/user/${id}`,
    search: '/user/search',
  },

  // ─── Profile (blood group, address, emergency contacts) ─
  profile: {
    base: '/profile',
    emergencyContacts: '/profile/emergency-contacts',
    emergencyContact: (contactId: string) =>
      `/profile/emergency-contacts/${contactId}`,
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
    // ─── Presigned-URL upload flow ─────────────────────
    uploadInit: '/media/upload/init',
    uploadComplete: '/media/upload/complete',
    uploadStatus: (imageId: string) => `/media/upload/status/${imageId}`,
    uploadStatusBatch: '/media/upload/status/batch',
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

  // ─── Expenses / Cycles / Settlements ─────────────────
  expenses: {
    // Cycles
    cycles: (groupId: string) => `/expense/${groupId}/cycles`,
    activeCycle: (groupId: string) => `/expense/${groupId}/cycles/active`,
    createCycle: (groupId: string) => `/expense/${groupId}/cycles`,
    // Expenses
    list: (groupId: string) => `/expense/${groupId}/expenses`,
    create: (groupId: string) => `/expense/${groupId}/expenses`,
    byId: (groupId: string, expenseId: string) =>
      `/expense/${groupId}/expenses/${expenseId}`,
    update: (groupId: string, expenseId: string) =>
      `/expense/${groupId}/expenses/${expenseId}`,
    delete: (groupId: string, expenseId: string) =>
      `/expense/${groupId}/expenses/${expenseId}`,
    // Balances/summary
    balances: (groupId: string) => `/expense/${groupId}/balances`,
    summary: (groupId: string) => `/expense/${groupId}/summary`,
    // Settlements
    settlements: (groupId: string) => `/expense/${groupId}/settlements`,
    createSettlement: (groupId: string) => `/expense/${groupId}/settlements`,
    confirmSettlement: (groupId: string, settlementId: string) =>
      `/expense/${groupId}/settlements/${settlementId}/confirm`,
    cancelSettlement: (groupId: string, settlementId: string) =>
      `/expense/${groupId}/settlements/${settlementId}/cancel`,
    // Nudge
    nudge: (groupId: string) => `/expense/${groupId}/nudge`,
    // Comments
    comments: (groupId: string, expenseId: string) =>
      `/expense/${groupId}/expenses/${expenseId}/comments`,
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
