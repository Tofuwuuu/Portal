export type SignalingMessage =
  | { type: 'ready'; initiator: boolean; self: PeerInfo; peer: PeerInfo | null }
  | { type: 'peer-joined'; peer: PeerInfo }
  | { type: 'peer-left' }
  | { type: 'room-full'; message: string }
  | { type: 'offer'; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; candidate: RTCIceCandidateInit }
  | { type: 'leave' }

export interface PeerInfo {
  id: number
  full_name: string
  role: string
}

export type CallStatus =
  | 'connecting'
  | 'waiting'
  | 'connected'
  | 'peer-left'
  | 'error'

const DEFAULT_STUN: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
]

/** Public TURN fallback for mobile/carrier NATs when no custom TURN is configured. */
const FALLBACK_TURN: RTCIceServer = {
  urls: [
    'turn:openrelay.metered.ca:80',
    'turn:openrelay.metered.ca:443',
    'turn:openrelay.metered.ca:443?transport=tcp',
  ],
  username: 'openrelayproject',
  credential: 'openrelayproject',
}

/** ICE servers: STUN + optional custom TURN, with a public TURN fallback for mobile networks. */
export function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [...DEFAULT_STUN]

  const turnUrl = import.meta.env.VITE_TURN_URL as string | undefined
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: (import.meta.env.VITE_TURN_USERNAME as string | undefined) || undefined,
      credential: (import.meta.env.VITE_TURN_CREDENTIAL as string | undefined) || undefined,
    })
  } else {
    servers.push(FALLBACK_TURN)
  }

  return servers
}

export function getPeerConnectionConfig(): RTCConfiguration {
  return {
    iceServers: getIceServers(),
    iceCandidatePoolSize: 10,
  }
}

export async function getLocalMediaStream(): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
    },
    video: {
      facingMode: 'user',
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
    },
  }

  try {
    return await navigator.mediaDevices.getUserMedia(constraints)
  } catch {
    // Fallback for browsers that reject ideal/max constraints (some mobile WebViews)
    return navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  }
}

function deriveWsBase(): string {
  const explicit = import.meta.env.VITE_WS_URL as string | undefined
  if (explicit) {
    return explicit.replace(/\/$/, '')
  }

  const apiUrl = import.meta.env.VITE_API_URL as string | undefined
  if (apiUrl) {
    const trimmed = apiUrl.replace(/\/$/, '')
    if (trimmed.startsWith('https://')) {
      return trimmed.replace(/^https:\/\//, 'wss://')
    }
    if (trimmed.startsWith('http://')) {
      return trimmed.replace(/^http:\/\//, 'ws://')
    }
    return trimmed
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}`
}

/** WebSocket URL for meeting signaling; JWT passed as query param. */
export function buildWsUrl(meetingId: number, token: string): string {
  const base = deriveWsBase()
  const path = base.includes('/api') ? `${base}/ws/meetings/${meetingId}` : `${base}/api/ws/meetings/${meetingId}`
  return `${path}?token=${encodeURIComponent(token)}`
}

export function parseSignalingMessage(raw: string): SignalingMessage | null {
  try {
    return JSON.parse(raw) as SignalingMessage
  } catch {
    return null
  }
}

export function sendSignaling(ws: WebSocket, message: SignalingMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
  }
}
