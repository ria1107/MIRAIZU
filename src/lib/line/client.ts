import { messagingApi } from '@line/bot-sdk'

let clientInstance: messagingApi.MessagingApiClient | null = null

export function getLineClient(): messagingApi.MessagingApiClient {
  if (!clientInstance) {
    clientInstance = new messagingApi.MessagingApiClient({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    })
  }
  return clientInstance
}

let blobClientInstance: messagingApi.MessagingApiBlobClient | null = null

export function getLineBlobClient(): messagingApi.MessagingApiBlobClient {
  if (!blobClientInstance) {
    blobClientInstance = new messagingApi.MessagingApiBlobClient({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    })
  }
  return blobClientInstance
}
