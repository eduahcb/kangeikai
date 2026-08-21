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
      scene: [OfficeScene],
    })
  })

  onDestroy(() => {
    game?.destroy(true)
  })
</script>

<div bind:this={gameContainer}></div>
