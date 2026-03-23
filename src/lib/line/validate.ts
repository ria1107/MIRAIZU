import crypto from 'crypto'

export function validateLineSignature(body: string, signature: string): boolean {
  const channelSecret = process.env.LINE_CHANNEL_SECRET
  if (!channelSecret) {
    console.error('LINE_CHANNEL_SECRET is not set')
    return false
  }

  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64')

  // 長さが異なる場合は不一致
  if (hash.length !== signature.length) {
    console.error('LINE signature length mismatch', {
      hashLen: hash.length,
      sigLen: signature.length,
      secretLen: channelSecret.length,
    })
    return false
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(signature)
    )
  } catch (e) {
    console.error('LINE signature comparison error:', e)
    return false
  }
}
