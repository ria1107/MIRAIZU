import { LineWebhookBody } from '@/types/line'

export const mockImageMessageEvent: LineWebhookBody = {
  destination: 'mock-destination',
  events: [
    {
      type: 'message',
      timestamp: Date.now(),
      source: { type: 'user', userId: 'U1234567890abcdef1234567890abcdef' },
      replyToken: 'mock-reply-token-001',
      message: { id: 'mock-message-id-001', type: 'image', contentProvider: { type: 'line' } },
    },
  ],
}

export const mockFollowEvent: LineWebhookBody = {
  destination: 'mock-destination',
  events: [
    {
      type: 'follow',
      timestamp: Date.now(),
      source: { type: 'user', userId: 'U1234567890abcdef1234567890abcdef' },
      replyToken: 'mock-reply-token-002',
    },
  ],
}
