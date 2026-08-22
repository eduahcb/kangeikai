import type { Room } from 'livekit-client'

/** Controls the local participant's own microphone/camera publishing (FR-004/FR-005). */
export class MediaControls {
  constructor(private readonly room: Room) {}

  get microphoneEnabled(): boolean {
    return this.room.localParticipant.isMicrophoneEnabled
  }

  get cameraEnabled(): boolean {
    return this.room.localParticipant.isCameraEnabled
  }

  async setMicrophoneEnabled(enabled: boolean): Promise<void> {
    await this.room.localParticipant.setMicrophoneEnabled(enabled)
  }

  async setCameraEnabled(enabled: boolean): Promise<void> {
    await this.room.localParticipant.setCameraEnabled(enabled)
  }
}
