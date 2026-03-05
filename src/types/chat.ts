export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface MessageHistory {
  role: MessageRole;
  content: string;
}

export interface ChatApiResponse {
  reply: string;
  success: boolean;
  error?: string;
}