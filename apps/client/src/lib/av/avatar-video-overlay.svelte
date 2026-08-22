<script lang='ts'>
  import type { RemoteVideoTrack } from 'livekit-client'
  import type { Action } from 'svelte/action'
  import { videoOverlayState } from '$lib/av/video-overlay-state.svelte'

  /** Attaches/detaches a LiveKit video track to this element as the track prop changes (T015). */
  const attachVideoTrack: Action<HTMLVideoElement, RemoteVideoTrack | undefined> = (node, track) => {
    track?.attach(node)
    return {
      update(nextTrack) {
        if (nextTrack === track) {
          return
        }
        track?.detach(node)
        nextTrack?.attach(node)
        track = nextTrack
      },
      destroy() {
        track?.detach(node)
      },
    }
  }
</script>

<div class='overlay'>
  {#each videoOverlayState.tiles as tile (tile.sessionId)}
    <div class='tile' style:left='{tile.screenX}px' style:top='{tile.screenY}px'>
      {#if tile.cameraEnabled && tile.videoTrack}
        <video use:attachVideoTrack={tile.videoTrack} autoplay playsinline muted></video>
      {/if}
      {#if !tile.micEnabled}
        <span class='muted-indicator' role='img' aria-label='Muted'>🔇</span>
      {/if}
    </div>
  {/each}
</div>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .tile {
    position: absolute;
    transform: translate(-50%, -100%);
  }

  .tile video {
    display: block;
    width: 64px;
    height: 64px;
    border-radius: 8px;
    object-fit: cover;
    background: #000;
  }

  .muted-indicator {
    position: absolute;
    right: -4px;
    bottom: -4px;
    font-size: 14px;
  }
</style>
