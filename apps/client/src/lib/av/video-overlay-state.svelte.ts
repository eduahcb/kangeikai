import type { RemoteVideoTrack } from 'livekit-client'

/** One nearby remote participant's video-tile view-model, refreshed every frame. */
export interface VideoOverlayTile {
  sessionId: string
  screenX: number
  screenY: number
  cameraEnabled: boolean
  micEnabled: boolean
  videoTrack: RemoteVideoTrack | undefined
}

/**
 * Reactive bridge between `OfficeScene` (Phaser, imperative per-frame loop) and
 * `avatar-video-overlay.svelte` (declarative DOM overlay) — `OfficeScene.update()` writes
 * `tiles` every frame via `set()`; the component reads it reactively via the `tiles` getter.
 */
function createVideoOverlayState() {
  let tiles = $state<VideoOverlayTile[]>([])

  return {
    get tiles(): VideoOverlayTile[] {
      return tiles
    },
    set(value: VideoOverlayTile[]): void {
      tiles = value
    },
  }
}

export const videoOverlayState = createVideoOverlayState()
