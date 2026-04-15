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
  actionText: string;
}

export type MessageItem = TripMessage | DMMessage;

// ─── Conversation Types ─────────────────────────────────

export type ChatMessageType = 'text' | 'image' | 'expense' | 'spend';

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

/**
 * UI-facing image attachment — merges server state (metadata.images)
 * with the sender's local upload state (when present).
 */
export interface ImageAttachment {
  imageId: string;
  /** Server-reported status from `message.metadata.images[]`. */
  serverStatus: 'pending' | 'uploaded' | 'processing' | 'completed' | 'failed';
  thumbnailUrl: string | null;
  optimizedUrl: string | null;
  width: number | null;
  height: number | null;
  /** Present only for the sender while an upload is in-flight. */
  localUri?: string | null;
  localStatus?: import('@/types/upload').UploadStatus;
  localError?: string | null;
}

export interface ImageMessage extends BaseChatMessage {
  type: 'image';
  caption?: string;
  images: ImageAttachment[];
}

export interface ExpenseMessage extends BaseChatMessage {
  type: 'expense';
  amount: number;
  category: string;
  description: string;
}

export interface SpendMessage extends BaseChatMessage {
  type: 'spend';
  expenseId: string;
  amount: number;
  currency: string;
  category: string;
  note?: string;
  imageUrl?: string | null;
  splitCount: number;
  paidBy: { _id: string; name: string };
  createdBy: string;
  /** Raw ISO of message creation — used for the 10-min edit window check. */
  createdAtIso: string;
  content: string;
}

export type ChatItem = TextMessage | ImageMessage | ExpenseMessage | SpendMessage;

export interface ChatSection {
  title: string;
  data: ChatItem[];
}

export type ListItem =
  | { type: 'header'; title: string; id: string }
  | (ChatItem & { type: ChatMessageType });
