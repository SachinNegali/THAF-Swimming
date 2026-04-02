// ─── Chat List Types ────────────────────────────────────

export type MessageType = 'trip' | 'dm';

export interface BaseListMessage {
  id: string;
  type: MessageType;
  timestamp: string;
  avatarUrl?: string;
  title: string;
  name?: string;
}

export interface TripMessage extends BaseListMessage {
  type: 'trip';
  status: 'expense' | 'settled' | 'new';
  actorName?: string;
  actionText: string;
  iconName: string;
  gradientColors: [string, string];
}

export interface DMMessage extends BaseListMessage {
  type: 'dm';
  preview: string;
  isRead: boolean;
}

export type MessageItem = TripMessage | DMMessage;

// ─── Conversation Types ─────────────────────────────────

export type ChatMessageType = 'text' | 'image' | 'expense';

export interface BaseChatMessage {
  id: string;
  type: ChatMessageType;
  timestamp: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  isMe: boolean;
}

export interface TextMessage extends BaseChatMessage {
  type: 'text';
  content: string;
  status?: 'sent' | 'read';
}

export interface ImageMessage extends BaseChatMessage {
  type: 'image';
  imageUrl: string;
  caption?: string;
}

export interface ExpenseMessage extends BaseChatMessage {
  type: 'expense';
  amount: number;
  category: string;
  description: string;
}

export type ChatItem = TextMessage | ImageMessage | ExpenseMessage;

export interface ChatSection {
  title: string;
  data: ChatItem[];
}

export type ListItem =
  | { type: 'header'; title: string; id: string }
  | (ChatItem & { type: ChatMessageType });
