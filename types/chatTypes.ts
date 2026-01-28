// Chat related types
export interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isGroup: boolean;
  avatar?: string;
  participants?: string[];
  isOnline?: boolean;
}

// Message related types
export type MessageType = "text" | "image" | "audio" | "file" | "link";

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: string;
  senderId: string;
  senderName: string;
  isCurrentUser: boolean;
  // Optional fields for different types
  imageUrl?: string;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  linkPreview?: {
    title: string;
    description: string;
    imageUrl?: string;
  };
}

// Community related types
export interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  category: string;
  imageUrl?: string;
  isJoined: boolean;
}