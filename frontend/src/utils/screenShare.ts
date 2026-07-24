/** True when getDisplayMedia exists (required for Share desktop). */
export function isDesktopShareApiAvailable(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getDisplayMedia === 'function'
}

/** Phones, tablets, and iPadOS desktop-mode UAs. */
export function isLikelyMobileOrTablet(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/Android|webOS|iPhone|iPad|iPod|Mobile/i.test(ua)) return true
  // iPad reporting as MacIntel
  return navigator.maxTouchPoints > 1 && /MacIntel/.test(navigator.platform)
}

/** In-app browsers (Messenger, Instagram, etc.) often block screen capture. */
export function isLikelyInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /FBAN|FBAV|Instagram|Line\//i.test(ua)
}

/** Whether we should offer the Share desktop control. */
export function canOfferDesktopShare(): boolean {
  if (!isDesktopShareApiAvailable()) return false
  if (isLikelyInAppBrowser()) return false
  // Phones/tablets: API may exist but OS/browser usually blocks or denies — use Share lesson
  if (isLikelyMobileOrTablet()) return false
  return true
}

export function desktopShareUnavailableReason(): string {
  if (isLikelyInAppBrowser()) {
    return 'Open this meeting in Chrome or Safari (not Messenger or Facebook in-app browser), then try again—or use Share lesson.'
  }
  if (isLikelyMobileOrTablet()) {
    return 'Share desktop is for laptop/desktop browsers. On phone or tablet, use Share lesson for slides and links.'
  }
  if (!isDesktopShareApiAvailable()) {
    return 'This browser does not support screen sharing. Try Chrome or Edge on a computer.'
  }
  return 'Use Share lesson to show content inside the meeting.'
}

export function describeDisplayMediaError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      if (isLikelyMobileOrTablet() || isLikelyInAppBrowser()) {
        return desktopShareUnavailableReason()
      }
      return 'Screen share was blocked. Allow capture when prompted, or check browser permissions.'
    }
    if (error.name === 'AbortError') {
      return 'Screen share cancelled.'
    }
    if (error.name === 'NotSupportedError' || error.name === 'NotFoundError') {
      return desktopShareUnavailableReason()
    }
  }
  return desktopShareUnavailableReason()
}
