<script lang='ts'>
  import type { LocalVideoTrack, RemoteVideoTrack } from 'livekit-client'
  import type { Action } from 'svelte/action'
  import { videoOverlayState } from '$lib/av/video-overlay-state.svelte'

  /** Attaches/detaches a LiveKit video track to this element as the track prop changes. */
  const attachVideoTrack: Action<HTMLVideoElement, LocalVideoTrack | RemoteVideoTrack | undefined> = (node, track) => {
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

  function initial(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?'
  }
</script>

<div class='strip'>
  {#each videoOverlayState.tiles as tile (tile.sessionId)}
    <div class='tile'>
      {#if tile.cameraEnabled && tile.videoTrack}
        <video use:attachVideoTrack={tile.videoTrack} autoplay playsinline muted={tile.isLocal}></video>
      {:else}
        <div class='placeholder'>
          <span class='avatar-circle'>
            {initial(tile.name)}
            <span class='mic-dot' class:on={tile.micEnabled}></span>
          </span>
        </div>
      {/if}
      <span class='name-label'>{tile.isLocal ? 'You' : tile.name}</span>
    </div>
  {/each}
</div>

<style>
  .strip {
    position: absolute;
    top: 16px;
    left: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    pointer-events: none;
  }

  .tile {
    position: relative;
    width: 140px;
    height: 105px;
    overflow: hidden;
    border-radius: 12px;
    background: #000;
  }

  .tile video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: #1a1a1a;
  }

  .avatar-circle {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #e8a9c9;
    color: #3a2030;
    font-weight: 600;
  }

  .mic-dot {
    position: absolute;
    right: -2px;
    bottom: -2px;
    width: 10px;
    height: 10px;
    border: 2px solid #1a1a1a;
    border-radius: 50%;
    background: #6b7280;
  }

  .mic-dot.on {
    background: #22c55e;
  }

  .name-label {
    position: absolute;
    bottom: 6px;
    left: 6px;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgb(0 0 0 / 60%);
    color: #fff;
    font-size: 12px;
  }
</style>
