'use client'
import {
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { cn } from '../../lib/utils'

const VIDEO_ID = 'PkgStlsVaqw'
const START_SECONDS = 26
const STORAGE_KEY = 'bb-landing-audio-v1'
const LONG_PRESS_MS = 420
const DEFAULT_VOLUME = 70
const SNAPSHOT_INTERVAL_MS = 3000

type PlayerSnapshot = {
  timeSec: number
  volume: number
  muted: boolean
  updatedAt: number
}

interface YTPlayer {
  destroy: () => void
  getCurrentTime: () => number
  getPlayerState: () => number
  mute: () => void
  pauseVideo: () => void
  playVideo: () => void
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void
  setVolume: (volume: number) => void
  stopVideo: () => void
  unMute: () => void
}

type YTPlayerEvent = {
  data: number
  target: YTPlayer
}

interface YTNamespace {
  Player: new (
    element: HTMLElement | string,
    options: {
      height?: string
      width?: string
      videoId: string
      playerVars?: Record<string, number | string>
      events?: {
        onError?: (event: YTPlayerEvent) => void
        onReady?: (event: YTPlayerEvent) => void
        onStateChange?: (event: YTPlayerEvent) => void
      }
    }
  ) => YTPlayer
  PlayerState: {
    BUFFERING: number
    CUED: number
    ENDED: number
    PAUSED: number
    PLAYING: number
    UNSTARTED: number
  }
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let youtubeApiPromise: Promise<YTNamespace> | null = null

const clampVolume = (value: number) => Math.min(100, Math.max(0, Math.round(value)))

const readSnapshot = (): PlayerSnapshot | null => {
  if (typeof window === 'undefined') return null
  const raw = window.sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<PlayerSnapshot>
    if (
      typeof parsed.timeSec === 'number' &&
      Number.isFinite(parsed.timeSec) &&
      typeof parsed.volume === 'number' &&
      Number.isFinite(parsed.volume) &&
      typeof parsed.muted === 'boolean'
    ) {
      return {
        timeSec: Math.max(0, parsed.timeSec),
        volume: clampVolume(parsed.volume),
        muted: parsed.muted,
        updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now()
      }
    }
  } catch {
    return null
  }
  return null
}

const loadYouTubeApi = (): Promise<YTNamespace> => {
  if (typeof window === 'undefined') return Promise.reject(new Error('YouTube API can only load in browser'))
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (youtubeApiPromise) return youtubeApiPromise

  youtubeApiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]')
    const timeoutId = window.setTimeout(() => reject(new Error('Timed out while loading YouTube API')), 12000)
    const previousReady = window.onYouTubeIframeAPIReady

    const resolveIfReady = () => {
      if (!window.YT?.Player) return
      window.clearTimeout(timeoutId)
      resolve(window.YT)
    }

    window.onYouTubeIframeAPIReady = () => {
      previousReady?.()
      resolveIfReady()
    }

    if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      script.onerror = () => {
        window.clearTimeout(timeoutId)
        reject(new Error('Failed to load YouTube API script'))
      }
      document.body.appendChild(script)
    } else {
      resolveIfReady()
    }
  }).catch(error => {
    youtubeApiPromise = null
    throw error
  })

  return youtubeApiPromise
}

export const LandingMusicControl = () => {
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isHoldingVolume, setIsHoldingVolume] = useState(false)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const [volume, setVolume] = useState(DEFAULT_VOLUME)
  const [muted, setMuted] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  const playerMountRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const holdTimerRef = useRef<number | null>(null)
  const snapshotIntervalRef = useRef<number | null>(null)
  const autoplayCheckRef = useRef<number | null>(null)
  const activePointerIdRef = useRef<number | null>(null)
  const pointerYRef = useRef(0)
  const suppressTapRef = useRef(false)
  const isHoldingRef = useRef(false)
  const holdStartYRef = useRef(0)
  const holdStartVolumeRef = useRef(DEFAULT_VOLUME)
  const volumeRef = useRef(DEFAULT_VOLUME)
  const mutedRef = useRef(false)

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current == null) return
    window.clearTimeout(holdTimerRef.current)
    holdTimerRef.current = null
  }, [])

  const applyVolume = useCallback((nextVolume: number) => {
    const clamped = clampVolume(nextVolume)
    const player = playerRef.current
    if (player) {
      try {
        player.setVolume(clamped)
        if (clamped === 0) player.mute()
        if (clamped > 0) player.unMute()
      } catch {
        return
      }
    }
    const nextMuted = clamped === 0
    volumeRef.current = clamped
    mutedRef.current = nextMuted
    setVolume(clamped)
    setMuted(nextMuted)
  }, [])

  const persistSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return
    let timeSec = START_SECONDS
    const player = playerRef.current
    if (player) {
      try {
        const currentTime = player.getCurrentTime()
        if (Number.isFinite(currentTime) && currentTime >= 0) timeSec = currentTime
      } catch {
        // Keep best-effort fallback time.
      }
    }
    const payload: PlayerSnapshot = {
      timeSec,
      volume: volumeRef.current,
      muted: mutedRef.current,
      updatedAt: Date.now()
    }
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Ignore storage failures (private mode / quota / policy).
    }
  }, [])

  const togglePlayback = useCallback(() => {
    const player = playerRef.current
    if (!player || !isReady) return
    try {
      if (isPlaying) {
        player.pauseVideo()
        setIsPlaying(false)
        persistSnapshot()
        return
      }
      const currentTime = player.getCurrentTime()
      if (currentTime < START_SECONDS - 0.5) {
        player.seekTo(START_SECONDS, true)
      }
      player.playVideo()
      setAutoplayBlocked(false)
    } catch {
      setAutoplayBlocked(true)
    }
  }, [isPlaying, isReady, persistSnapshot])

  const adjustVolumeFromPointer = useCallback(
    (clientY: number) => {
      const delta = holdStartYRef.current - clientY
      const nextVolume = holdStartVolumeRef.current + delta * 0.65
      applyVolume(nextVolume)
    },
    [applyVolume]
  )

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!isReady) return
    if (activePointerIdRef.current != null) return

    activePointerIdRef.current = event.pointerId
    pointerYRef.current = event.clientY
    suppressTapRef.current = false
    holdStartYRef.current = event.clientY
    holdStartVolumeRef.current = volumeRef.current

    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Pointer capture can fail in some browsers; continue without it.
    }

    clearHoldTimer()
    holdTimerRef.current = window.setTimeout(() => {
      suppressTapRef.current = true
      isHoldingRef.current = true
      setIsHoldingVolume(true)
      holdStartYRef.current = pointerYRef.current
      holdStartVolumeRef.current = volumeRef.current
    }, LONG_PRESS_MS)
  }

  const endPointerInteraction = (
    event: ReactPointerEvent<HTMLButtonElement>,
    canceled: boolean
  ) => {
    if (event.pointerId !== activePointerIdRef.current) return

    clearHoldTimer()
    activePointerIdRef.current = null

    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // Ignore capture release failures.
    }

    const wasHolding = isHoldingRef.current
    isHoldingRef.current = false
    setIsHoldingVolume(false)

    if (!wasHolding && !suppressTapRef.current && !canceled) {
      togglePlayback()
    }
    suppressTapRef.current = false
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerId !== activePointerIdRef.current) return
    pointerYRef.current = event.clientY
    if (!isHoldingRef.current) return
    adjustVolumeFromPointer(event.clientY)
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    endPointerInteraction(event, false)
  }

  const handlePointerCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    endPointerInteraction(event, true)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isReady) return
    if (event.key !== ' ' && event.key !== 'Enter') return
    event.preventDefault()
    togglePlayback()
  }

  useEffect(() => {
    const stored = readSnapshot()
    if (!stored) return
    volumeRef.current = stored.volume
    mutedRef.current = stored.muted
    setVolume(stored.volume)
    setMuted(stored.muted)
  }, [])

  useEffect(() => {
    let cancelled = false

    const initializePlayer = async () => {
      try {
        const YT = await loadYouTubeApi()
        if (cancelled || !playerMountRef.current) return

        const player = new YT.Player(playerMountRef.current, {
          width: '0',
          height: '0',
          videoId: VIDEO_ID,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            start: START_SECONDS
          },
          events: {
            onReady: event => {
              if (cancelled) return
              playerRef.current = event.target
              setIsReady(true)

              const snapshot = readSnapshot()
              const initialVolume = snapshot?.volume ?? DEFAULT_VOLUME
              const initialMuted = snapshot?.muted ?? false
              const initialTime = snapshot?.timeSec ?? START_SECONDS

              volumeRef.current = initialVolume
              mutedRef.current = initialMuted
              setVolume(initialVolume)
              setMuted(initialMuted)

              try {
                event.target.setVolume(initialVolume)
                if (initialMuted || initialVolume === 0) event.target.mute()
                if (!initialMuted && initialVolume > 0) event.target.unMute()
                event.target.seekTo(initialTime, true)
                event.target.playVideo()
              } catch {
                setAutoplayBlocked(true)
              }

              if (snapshotIntervalRef.current != null) window.clearInterval(snapshotIntervalRef.current)
              snapshotIntervalRef.current = window.setInterval(persistSnapshot, SNAPSHOT_INTERVAL_MS)

              if (autoplayCheckRef.current != null) window.clearTimeout(autoplayCheckRef.current)
              autoplayCheckRef.current = window.setTimeout(() => {
                if (cancelled) return
                const activePlayer = playerRef.current
                if (!activePlayer) return
                let state = YT.PlayerState.UNSTARTED
                try {
                  state = activePlayer.getPlayerState()
                } catch {
                  return
                }
                const canPlay = state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING
                if (!canPlay) {
                  setIsPlaying(false)
                  setAutoplayBlocked(true)
                }
              }, 900)
            },
            onStateChange: event => {
              if (cancelled) return
              if (event.data === YT.PlayerState.PLAYING) {
                setIsPlaying(true)
                setAutoplayBlocked(false)
                return
              }
              if (event.data === YT.PlayerState.PAUSED) {
                setIsPlaying(false)
                return
              }
              if (event.data === YT.PlayerState.ENDED) {
                setIsPlaying(false)
                try {
                  event.target.seekTo(START_SECONDS, true)
                  event.target.playVideo()
                } catch {
                  setAutoplayBlocked(true)
                }
              }
            },
            onError: () => {
              if (cancelled) return
              setUnavailable(true)
            }
          }
        })

        playerRef.current = player
      } catch {
        if (!cancelled) setUnavailable(true)
      }
    }

    initializePlayer()

    return () => {
      cancelled = true
      clearHoldTimer()

      if (autoplayCheckRef.current != null) {
        window.clearTimeout(autoplayCheckRef.current)
        autoplayCheckRef.current = null
      }
      if (snapshotIntervalRef.current != null) {
        window.clearInterval(snapshotIntervalRef.current)
        snapshotIntervalRef.current = null
      }

      isHoldingRef.current = false
      persistSnapshot()

      const player = playerRef.current
      playerRef.current = null
      if (player) {
        try {
          player.stopVideo()
        } catch {
          // Ignore stop failures during teardown.
        }
        try {
          player.destroy()
        } catch {
          // Ignore destroy failures during teardown.
        }
      }
    }
  }, [clearHoldTimer, persistSnapshot])

  if (unavailable) return null

  const iconLabel = isPlaying ? 'Pause landing music' : 'Play landing music'
  const indicatorPosition = Math.min(100, Math.max(0, volume))
  const VolumeIcon = muted || volume === 0 ? VolumeX : Volume2
  const PlaybackIcon = isPlaying ? Pause : Play

  return (
    <>
      <div ref={playerMountRef} aria-hidden className="pointer-events-none fixed -left-[9999px] top-0 h-0 w-0 overflow-hidden" />

      {autoplayBlocked && !isPlaying && isReady && (
        <div className="pointer-events-none fixed bottom-24 right-6 z-50 rounded-md border border-border/70 bg-surface/95 px-3 py-1 text-[11px] font-medium text-muted shadow-sm backdrop-blur md:right-8">
          Tap to play
        </div>
      )}

      {isHoldingVolume && (
        <div className="pointer-events-none fixed bottom-24 right-6 z-50 flex w-14 flex-col items-center gap-2 rounded-2xl border border-border/70 bg-surface/95 px-3 py-3 text-xs font-medium text-muted shadow-lg backdrop-blur md:right-8">
          <span>{volume}%</span>
          <div className="relative h-28 w-2 rounded-full bg-surface-3">
            <div
              className="absolute inset-x-0 bottom-0 rounded-full bg-primary"
              style={{ height: `${indicatorPosition}%` }}
            />
            <div
              className="absolute left-1/2 h-3.5 w-3.5 rounded-full border border-border/70 bg-surface shadow-xs"
              style={{ bottom: `${indicatorPosition}%`, transform: 'translate(-50%, 50%)' }}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label={iconLabel}
        title={iconLabel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onKeyDown={handleKeyDown}
        onContextMenu={event => event.preventDefault()}
        className={cn(
          'focus-ring fixed bottom-6 right-6 z-50 flex h-14 w-14 touch-none select-none items-center justify-center rounded-xl border border-border/70 bg-surface/95 text-foreground shadow-lg backdrop-blur transition-colors duration-150 md:right-8',
          'hover:scale-[1.03] active:scale-[0.98]',
          !isReady && 'opacity-80',
          isPlaying && 'bg-surface text-primary'
        )}
      >
        <PlaybackIcon className="h-5 w-5" />
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-border/70 bg-surface text-foreground shadow-xs">
          <VolumeIcon className="h-3.5 w-3.5" />
        </span>
      </button>
    </>
  )
}
