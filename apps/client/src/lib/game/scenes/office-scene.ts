import type { AvatarDirection, AvatarSpriteType } from '@kangeikai/shared'
import interiorsUrl from '$lib/assets/maps/welcome/Interiors_32x32-used.png?url'
import modernOfficeUrl from '$lib/assets/maps/welcome/Modern_Office_32x32.png?url'
import roomBuilderUrl from '$lib/assets/maps/welcome/Room_Builder_32x32.png?url'
import roomBuilderOfficeUrl from '$lib/assets/maps/welcome/Room_Builder_Office_32x32.png?url'
import mapUrl from '$lib/assets/maps/welcome/welcome.tmj?url'
import avatarManIdleUrl from '$lib/assets/sprites/avatar-man-idle.png?url'
import avatarManWalkUrl from '$lib/assets/sprites/avatar-man-walk.png?url'
import avatarWomanIdleUrl from '$lib/assets/sprites/avatar-woman-idle.png?url'
import avatarWomanWalkUrl from '$lib/assets/sprites/avatar-woman-walk.png?url'
import { Avatar, AVATAR_FRAME_RANGES, getSpriteAnimation } from '$lib/game/entities/avatar'
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

const KEY_TO_DIRECTION: Record<string, AvatarDirection> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
}

/** Frame width/height for every avatar spritesheet (768x64px, 32px-wide frames — see avatar.ts). */
const AVATAR_FRAME_SIZE = { frameWidth: 32, frameHeight: 64 }

const AVATAR_SPRITE_TYPES: AvatarSpriteType[] = ['man', 'woman']
const AVATAR_MOTION_SEGMENTS = ['idle', 'walk'] as const

/**
 * Texture key for a spriteType+segment's spritesheet, e.g. "man-idle". Shared by all four
 * directions' animations, which each play a different frame range from the same sheet.
 */
function avatarTextureKey(spriteType: AvatarSpriteType, segment: 'idle' | 'walk'): string {
  return `${spriteType}-${segment}`
}

export class OfficeScene extends Phaser.Scene {
  private readonly movementController = new MovementController()
  private avatar!: Avatar
  private avatarView!: Phaser.GameObjects.Sprite

  constructor() {
    super('office')
  }

  preload(): void {
    this.load.tilemapTiledJSON('welcome', mapUrl)
    this.load.image('Room_Builder_32x32', roomBuilderUrl)
    this.load.image('Interiors_32x32', interiorsUrl)
    this.load.image('Modern_Office_32x32', modernOfficeUrl)
    this.load.image('Room_Builder_Office_32x32', roomBuilderOfficeUrl)

    this.load.spritesheet(avatarTextureKey('man', 'idle'), avatarManIdleUrl, AVATAR_FRAME_SIZE)
    this.load.spritesheet(avatarTextureKey('man', 'walk'), avatarManWalkUrl, AVATAR_FRAME_SIZE)
    this.load.spritesheet(avatarTextureKey('woman', 'idle'), avatarWomanIdleUrl, AVATAR_FRAME_SIZE)
    this.load.spritesheet(avatarTextureKey('woman', 'walk'), avatarWomanWalkUrl, AVATAR_FRAME_SIZE)
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

    for (const spriteType of AVATAR_SPRITE_TYPES) {
      for (const segment of AVATAR_MOTION_SEGMENTS) {
        const textureKey = avatarTextureKey(spriteType, segment)
        for (const direction of Object.keys(AVATAR_FRAME_RANGES) as AvatarDirection[]) {
          this.anims.create({
            key: getSpriteAnimation(spriteType, segment === 'walk' ? 'walking' : 'idle', direction).key,
            frames: this.anims.generateFrameNumbers(textureKey, AVATAR_FRAME_RANGES[direction]),
            frameRate: segment === 'walk' ? 8 : 4,
            repeat: -1,
          })
        }
      }
    }

    this.avatar = new Avatar(SPAWN_X, SPAWN_Y, 'man')
    this.avatarView = this.add.sprite(this.avatar.x, this.avatar.y, avatarTextureKey('man', 'idle'))
    this.avatarView.anims.play(getSpriteAnimation(this.avatar.spriteType, this.avatar.motionState, this.avatar.direction).key)

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

    const animation = getSpriteAnimation(this.avatar.spriteType, this.avatar.motionState, this.avatar.direction)
    if (this.avatarView.anims.currentAnim?.key !== animation.key) {
      this.avatarView.anims.play(animation.key)
    }
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
