import interiorsUrl from '$lib/assets/maps/welcome/Interiors_32x32-used.png?url'
import modernOfficeUrl from '$lib/assets/maps/welcome/Modern_Office_32x32.png?url'
import roomBuilderUrl from '$lib/assets/maps/welcome/Room_Builder_32x32.png?url'
import roomBuilderOfficeUrl from '$lib/assets/maps/welcome/Room_Builder_Office_32x32.png?url'
import mapUrl from '$lib/assets/maps/welcome/welcome.tmj?url'
import { Avatar } from '$lib/game/entities/avatar'
import { MovementController } from '$lib/game/input/movement-controller'
import Phaser from 'phaser'

/**
 * Placeholder spawn point, chosen outside every zone's bounding box in welcome.tmj as of
 * authoring time. The map has no collision layer yet (tasks.md T013 known gap), so this can't
 * be validated against walkable/collision data (data-model.md's spawn invariant) until T021 —
 * revisit then.
 */
const SPAWN_X = 150
const SPAWN_Y = 150

const KEY_TO_DIRECTION: Record<string, 'up' | 'down' | 'left' | 'right'> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
}

export class OfficeScene extends Phaser.Scene {
  private readonly movementController = new MovementController()
  private avatar!: Avatar
  private avatarView!: Phaser.GameObjects.Rectangle

  constructor() {
    super('office')
  }

  preload(): void {
    this.load.tilemapTiledJSON('welcome', mapUrl)
    this.load.image('Room_Builder_32x32', roomBuilderUrl)
    this.load.image('Interiors_32x32', interiorsUrl)
    this.load.image('Modern_Office_32x32', modernOfficeUrl)
    this.load.image('Room_Builder_Office_32x32', roomBuilderOfficeUrl)
  }

  create(): void {
    const map = this.make.tilemap({ key: 'welcome' })

    // map.addTilesetImage() looks up a tileset by name and only binds the image to the
    // FIRST match. welcome.tmj has two tileset entries both named "Room_Builder_32x32"
    // (same source image, two separate gid ranges — see tasks.md T013), so that helper
    // would silently leave the second range's tiles textureless. Bind every tileset
    // entry's image directly instead; layer creation resolves each tile's tileset by gid
    // range, not by name, so this is safe even with the duplicate name.
    for (const tileset of map.tilesets) {
      tileset.setImage(this.textures.get(tileset.name))
    }

    for (const layerData of map.layers) {
      map.createLayer(layerData.name, map.tilesets, 0, 0)
    }

    this.avatar = new Avatar(SPAWN_X, SPAWN_Y, 'man')
    this.avatarView = this.add.rectangle(this.avatar.x, this.avatar.y, 24, 32, 0x4477FF)

    this.input.keyboard?.on('keydown', this.handleKeyDown, this)
    this.input.keyboard?.on('keyup', this.handleKeyUp, this)
    this.game.events.on(Phaser.Core.Events.BLUR, this.handleBlur, this)

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', this.handleKeyDown, this)
      this.input.keyboard?.off('keyup', this.handleKeyUp, this)
      this.game.events.off(Phaser.Core.Events.BLUR, this.handleBlur, this)
    })
  }

  update(_time: number, delta: number): void {
    this.avatar.update(this.movementController.getIntent(), delta / 1000)
    this.avatarView.setPosition(this.avatar.x, this.avatar.y)
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const direction = KEY_TO_DIRECTION[event.code]
    if (direction) {
      this.movementController.press(direction)
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const direction = KEY_TO_DIRECTION[event.code]
    if (direction) {
      this.movementController.release(direction)
    }
  }

  private handleBlur(): void {
    this.movementController.clear()
  }
}
