<script lang='ts'>
  import type { MediaControls } from '$lib/av/media-controls'
  import type { GuestProfile } from '$lib/entry/guest-profile-schema'
  import AvatarVideoOverlay from '$lib/av/avatar-video-overlay.svelte'
  import EntryForm from '$lib/entry/entry-form.svelte'
  import { MEDIA_CONTROLS_READY_EVENT, OfficeScene } from '$lib/game/scenes/office-scene'
  import Phaser from 'phaser'
  import { onDestroy } from 'svelte'

  let gameContainer: HTMLDivElement
  let game: Phaser.Game | undefined

  let guestProfile: GuestProfile | undefined = $state()
  let mediaControls: MediaControls | undefined = $state()
  let micEnabled = $state(false)
  let cameraEnabled = $state(false)
  let micUnavailable = $state(false)
  let cameraUnavailable = $state(false)

  /** Mounts the game only once entry is confirmed (FR-009) — see `EntryForm` below. */
  function handleEntryConfirm(profile: GuestProfile): void {
    guestProfile = profile

    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: gameContainer,
      width: window.innerWidth,
      height: window.innerHeight,
      // Nearest-neighbor texture filtering, so the 32px-tile art stays crisp at the camera's
      // fixed zoom (office-scene.ts's CAMERA_ZOOM) instead of blurring like photo content would.
      pixelArt: true,
      scale: {
        // Keeps the canvas (and, via CameraManager.onResize, the main camera) in sync with
        // gameContainer's size on every browser window resize (FR-006 Edge Case / T026).
        mode: Phaser.Scale.RESIZE,
      },
      scene: [],
    })

    game.scene.add('office', OfficeScene, true, { displayName: profile.displayName, spriteType: profile.avatarType })

    // OfficeScene creates MediaControls only once its own LiveKit room connection resolves
    // (spec 003 FR-008's same gating, reused for media) — see office-scene.ts.
    game.events.on(MEDIA_CONTROLS_READY_EVENT, (controls: MediaControls) => {
      mediaControls = controls
      micEnabled = controls.microphoneEnabled
      cameraEnabled = controls.cameraEnabled
      micUnavailable = controls.microphoneUnavailable
      cameraUnavailable = controls.cameraUnavailable
    })
  }

  onDestroy(() => {
    game?.destroy(true)
  })

  async function toggleMicrophone(): Promise<void> {
    if (!mediaControls) {
      return
    }
    await mediaControls.setMicrophoneEnabled(!micEnabled)
    micEnabled = mediaControls.microphoneEnabled
    micUnavailable = mediaControls.microphoneUnavailable
  }

  async function toggleCamera(): Promise<void> {
    if (!mediaControls) {
      return
    }
    await mediaControls.setCameraEnabled(!cameraEnabled)
    cameraEnabled = mediaControls.cameraEnabled
    cameraUnavailable = mediaControls.cameraUnavailable
  }
</script>

<div class='game-container' bind:this={gameContainer}>
  {#if guestProfile}
    <AvatarVideoOverlay />
  {/if}
</div>

{#if !guestProfile}
  <EntryForm onConfirm={handleEntryConfirm} />
{:else}
  <div class='media-controls'>
    <button type='button' disabled={!mediaControls || micUnavailable} onclick={toggleMicrophone}>
      {micUnavailable ? '🔇 Mic unavailable' : micEnabled ? '🎤 Mute' : '🔇 Unmute'}
    </button>
    <button type='button' disabled={!mediaControls || cameraUnavailable} onclick={toggleCamera}>
      {cameraUnavailable ? '📷 Camera unavailable' : cameraEnabled ? '📷 Turn camera off' : '📷 Turn camera on'}
    </button>
  </div>
{/if}

<style>
  .game-container {
    position: relative;
    width: 100vw;
    height: 100dvh;
    overflow: hidden;
  }

  .media-controls {
    position: fixed;
    bottom: 16px;
    left: 50%;
    display: flex;
    gap: 8px;
    transform: translateX(-50%);
  }

  .media-controls button {
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    background: rgb(0 0 0 / 70%);
    color: #fff;
    cursor: pointer;
  }

  .media-controls button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
</style>
