/**
 * In-app "Presenter mode" — a teacher-driven, synchronized content surface
 * (slide deck / URL / text) shown in the meeting's main viewport, relayed
 * over the existing meeting signaling WebSocket. See ws_meetings.py for the
 * server-side protocol and authoritative state.
 */

export type PresenterSlide =
  | { type: 'image'; src: string; name?: string }
  | { type: 'url'; url: string }
  | { type: 'text'; title: string; body: string }

export interface PresenterState {
  active: boolean
  slides: PresenterSlide[]
  currentIndex: number
}

export const emptyPresenterState: PresenterState = {
  active: false,
  slides: [],
  currentIndex: 0,
}

/** Mutations a teacher can request; the server applies these to its authoritative state. */
export type PresenterUpdateAction =
  | { action: 'start' }
  | { action: 'stop' }
  | { action: 'set-index'; index: number }
  | { action: 'add-slide'; slide: PresenterSlide }
  | { action: 'remove-slide'; index: number }

export type PresenterMessage =
  | ({ type: 'presenter-update' } & PresenterUpdateAction)
  | { type: 'presenter-state'; state: PresenterState }
  | { type: 'presenter-request' }

/** Reads an image file as a data URL so it can be relayed inline over the WebSocket. */
export function readImageFileAsSlide(file: File): Promise<PresenterSlide> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve({ type: 'image', src: reader.result, name: file.name })
      } else {
        reject(new Error('Could not read image file.'))
      }
    }
    reader.onerror = () => reject(new Error('Could not read image file.'))
    reader.readAsDataURL(file)
  })
}

/** Normalizes and validates a teacher-entered URL before it becomes a slide. */
export function normalizePresenterUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim()
  if (!trimmed) return null

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const parsed = new URL(withProtocol)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.toString()
  } catch {
    return null
  }
}
