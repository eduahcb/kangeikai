<script lang='ts'>
  import { OfficeScene } from '$lib/game/scenes/office-scene'
  import Phaser from 'phaser'
  import { onDestroy, onMount } from 'svelte'

  let gameContainer: HTMLDivElement
  let game: Phaser.Game | undefined

  onMount(() => {
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
      scene: [OfficeScene],
    })
  })

  onDestroy(() => {
    game?.destroy(true)
  })
</script>

<div class='game-container' bind:this={gameContainer}></div>

<style>
  .game-container {
    width: 100vw;
    height: 100dvh;
    overflow: hidden;
  }
</style>
