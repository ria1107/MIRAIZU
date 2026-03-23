export interface LineWebhookEvent {
  type: string
  timestamp: number
  source: {
    type: 'user' | 'group' | 'room'
    userId?: string
    groupId?: string
    roomId?: string
  }
  replyToken?: string
  message?: LineMessage
}

export interface LineMessage {
  id: string
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'sticker'
  text?: string
  contentProvider?: {
    type: 'line' | 'external'
    originalContentUrl?: string
    previewImageUrl?: string
  }
}

export interface LineWebhookBody {
  destination: string
  events: LineWebhookEvent[]
}

export interface LineReplyMessage {
  type: 'text' | 'flex'
  text?: string
  altText?: string
  contents?: Record<string, unknown>
}
