import type { LocalVideoTrack, RemoteVideoTrack } from 'livekit-client'

/**
 * One video-strip tile's view-model, refreshed every frame — always includes the local
 * participant ("You") plus every nearby remote participant, camera on or off (a camera-off
 * tile still renders a placeholder, per spec.md's US2 acceptance scenarios treating "nearby"
 * as the visibility gate, not camera state).
 */
export interface VideoOverlayTile {
  sessionId: string
  name: string
  isLocal: boolean
  cameraEnabled: boolean
  micEnabled: boolean
  videoTrack: LocalVideoTrack | RemoteVideoTrack | undefined
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
