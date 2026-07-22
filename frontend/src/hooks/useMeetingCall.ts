import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buildWsUrl,
  getIceServers,
  parseSignalingMessage,
  sendSignaling,
  type CallStatus,
} from '../utils/webrtc'

interface UseMeetingCallOptions {
  meetingId: number
  enabled: boolean
}

interface UseMeetingCallResult {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  status: CallStatus
  errorMessage: string
  micOn: boolean
  camOn: boolean
  sharing: boolean
  remoteName: string | null
  toggleMic: () => void
  toggleCam: () => void
  startShare: () => Promise<void>
  stopShare: () => Promise<void>
  leave: () => void
}

export function useMeetingCall({
  meetingId,
  enabled,
}: UseMeetingCallOptions): UseMeetingCallResult {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<CallStatus>('connecting')
  const [errorMessage, setErrorMessage] = useState('')
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [remoteName, setRemoteName] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null)
  const screenTrackRef = useRef<MediaStreamTrack | null>(null)
  const makingOfferRef = useRef(false)
  const ignoreOfferRef = useRef(false)
  const isPoliteRef = useRef(false)
  const leftRef = useRef(false)

  const cleanup = useCallback(() => {
    leftRef.current = true

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      sendSignaling(wsRef.current, { type: 'leave' })
    }
    wsRef.current?.close()
    wsRef.current = null

    pcRef.current?.close()
    pcRef.current = null

    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    cameraTrackRef.current = null
    screenTrackRef.current = null

    setLocalStream(null)
    setRemoteStream(null)
    setSharing(false)
  }, [])

  const getPc = useCallback(() => {
    if (pcRef.current) return pcRef.current

    const pc = new RTCPeerConnection({ iceServers: getIceServers() })

    pc.ontrack = (event) => {
      const [stream] = event.streams
      if (stream) {
        setRemoteStream(stream)
        setStatus('connected')
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        sendSignaling(wsRef.current, {
          type: 'ice-candidate',
          candidate: event.candidate.toJSON(),
        })
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setStatus('connected')
      } else if (pc.connectionState === 'failed') {
        setStatus('error')
        setErrorMessage('Connection failed. Try leaving and rejoining.')
      } else if (pc.connectionState === 'disconnected') {
        setStatus('peer-left')
      }
    }

    pcRef.current = pc
    return pc
  }, [])

  const addLocalTracks = useCallback((pc: RTCPeerConnection, stream: MediaStream) => {
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream)
    })
  }, [])

  const sendOffer = useCallback(async () => {
    const pc = pcRef.current
    const ws = wsRef.current
    if (!pc || !ws || ws.readyState !== WebSocket.OPEN) return

    try {
      makingOfferRef.current = true
      await pc.setLocalDescription(await pc.createOffer())
      if (pc.localDescription) {
        sendSignaling(ws, { type: 'offer', sdp: pc.localDescription })
      }
    } catch {
      setStatus('error')
      setErrorMessage('Failed to start call negotiation.')
    } finally {
      makingOfferRef.current = false
    }
  }, [])

  const handleOffer = useCallback(
    async (sdp: RTCSessionDescriptionInit) => {
      const pc = getPc()
      const ws = wsRef.current
      if (!ws) return

      const offerCollision = makingOfferRef.current || pc.signalingState !== 'stable'
      ignoreOfferRef.current = !isPoliteRef.current && offerCollision

      if (ignoreOfferRef.current) return

      await pc.setRemoteDescription(sdp)
      await pc.setLocalDescription(await pc.createAnswer())
      if (pc.localDescription) {
        sendSignaling(ws, { type: 'answer', sdp: pc.localDescription })
      }
    },
    [getPc]
  )

  const handleAnswer = useCallback(async (sdp: RTCSessionDescriptionInit) => {
    const pc = pcRef.current
    if (!pc) return
    await pc.setRemoteDescription(sdp)
  }, [])

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const pc = pcRef.current
    if (!pc || !candidate) return
    try {
      await pc.addIceCandidate(candidate)
    } catch {
      // Ignore candidates that arrive after negotiation ends
    }
  }, [])

  const restoreCameraTrack = useCallback(async () => {
    const pc = pcRef.current
    const cameraTrack = cameraTrackRef.current
    if (!pc || !cameraTrack) return

    const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
    if (sender) {
      await sender.replaceTrack(cameraTrack)
    }
    screenTrackRef.current?.stop()
    screenTrackRef.current = null
    setSharing(false)
    setCamOn(cameraTrack.enabled)
  }, [])

  const renegotiateAfterTrackChange = useCallback(async () => {
    await sendOffer()
  }, [sendOffer])

  useEffect(() => {
    if (!enabled || !meetingId) return

    leftRef.current = false
    let cancelled = false

    async function start() {
      setStatus('connecting')
      setErrorMessage('')

      const token = localStorage.getItem('token')
      if (!token) {
        setStatus('error')
        setErrorMessage('Not authenticated.')
        return
      }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      } catch {
        setStatus('error')
        setErrorMessage('Camera or microphone access denied.')
        return
      }

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      localStreamRef.current = stream
      cameraTrackRef.current = stream.getVideoTracks()[0] ?? null
      setLocalStream(stream)
      setMicOn(true)
      setCamOn(true)

      const ws = new WebSocket(buildWsUrl(meetingId, token))
      wsRef.current = ws

      ws.onopen = () => {
        const pc = getPc()
        addLocalTracks(pc, stream)
      }

      ws.onmessage = async (event) => {
        const message = parseSignalingMessage(event.data)
        if (!message) return

        switch (message.type) {
          case 'ready':
            isPoliteRef.current = !message.initiator
            if (message.peer) {
              setRemoteName(message.peer.full_name)
            }
            setStatus(message.peer ? 'connecting' : 'waiting')
            if (message.initiator && message.peer) {
              await sendOffer()
            }
            break
          case 'peer-joined':
            setRemoteName(message.peer.full_name)
            setStatus('connecting')
            if (!isPoliteRef.current) {
              await sendOffer()
            }
            break
          case 'peer-left':
            setRemoteStream(null)
            setRemoteName(null)
            setStatus('peer-left')
            break
          case 'room-full':
            setStatus('error')
            setErrorMessage(message.message || 'Room is full.')
            cleanup()
            break
          case 'offer':
            await handleOffer(message.sdp)
            break
          case 'answer':
            await handleAnswer(message.sdp)
            break
          case 'ice-candidate':
            await handleIceCandidate(message.candidate)
            break
          default:
            break
        }
      }

      ws.onerror = () => {
        if (!leftRef.current) {
          setStatus('error')
          setErrorMessage('Signaling connection failed.')
        }
      }

      ws.onclose = () => {
        if (!leftRef.current) {
          setStatus('peer-left')
        }
      }
    }

    start()

    return () => {
      cancelled = true
      cleanup()
    }
  }, [
    enabled,
    meetingId,
    cleanup,
    getPc,
    addLocalTracks,
    sendOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
  ])

  const toggleMic = useCallback(() => {
    const audio = localStreamRef.current?.getAudioTracks()[0]
    if (!audio) return
    audio.enabled = !audio.enabled
    setMicOn(audio.enabled)
  }, [])

  const toggleCam = useCallback(() => {
    if (sharing) return
    const video = cameraTrackRef.current
    if (!video) return
    video.enabled = !video.enabled
    setCamOn(video.enabled)
  }, [sharing])

  const startShare = useCallback(async () => {
    const pc = pcRef.current
    if (!pc || sharing) return

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const screenTrack = screenStream.getVideoTracks()[0]
      if (!screenTrack) return

      screenTrackRef.current = screenTrack
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
      if (sender) {
        await sender.replaceTrack(screenTrack)
      }
      setSharing(true)
      setCamOn(true)

      screenTrack.onended = async () => {
        await restoreCameraTrack()
        await renegotiateAfterTrackChange()
      }

      await renegotiateAfterTrackChange()
    } catch {
      setErrorMessage('Screen share cancelled or denied.')
    }
  }, [sharing, restoreCameraTrack, renegotiateAfterTrackChange])

  const stopShare = useCallback(async () => {
    if (!sharing) return
    await restoreCameraTrack()
    await renegotiateAfterTrackChange()
  }, [sharing, restoreCameraTrack, renegotiateAfterTrackChange])

  const leave = useCallback(() => {
    cleanup()
    setStatus('peer-left')
  }, [cleanup])

  return {
    localStream,
    remoteStream,
    status,
    errorMessage,
    micOn,
    camOn,
    sharing,
    remoteName,
    toggleMic,
    toggleCam,
    startShare,
    stopShare,
    leave,
  }
}
