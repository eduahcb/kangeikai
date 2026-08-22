import type { Room } from 'livekit-client'

/**
 * Controls the local participant's own microphone/camera publishing (FR-004/FR-005).
 *
 * `setMicrophoneEnabled`/`setCameraEnabled` never throw: a denied permission or missing
 * device (spec.md US3) is caught and recorded as `microphoneUnavailable`/`cameraUnavailable`
 * instead, so callers (the auto-enable attempt on connect, and the UI's toggle buttons) can
 * treat it as a normal state to disable/label around rather than an error to handle.
 */
export class MediaControls {
  private micUnavailable = false
  private cameraUnavailableFlag = false

  constructor(private readonly room: Room) {}

  get microphoneEnabled(): boolean {
    return this.room.localParticipant.isMicrophoneEnabled
  }

  get cameraEnabled(): boolean {
    return this.room.localParticipant.isCameraEnabled
  }

  get microphoneUnavailable(): boolean {
    return this.micUnavailable
  }

  get cameraUnavailable(): boolean {
    return this.cameraUnavailableFlag
  }

  async setMicrophoneEnabled(enabled: boolean): Promise<void> {
    try {
      await this.room.localParticipant.setMicrophoneEnabled(enabled)
      this.micUnavailable = false
    }
    catch (error) {
      this.micUnavailable = true
      console.warn('kangeikai: microphone unavailable (permission denied or no device)', error)
    }
  }

  async setCameraEnabled(enabled: boolean): Promise<void> {
    try {
      await this.room.localParticipant.setCameraEnabled(enabled)
      this.cameraUnavailableFlag = false
    }
    catch (error) {
      this.cameraUnavailableFlag = true
      console.warn('kangeikai: camera unavailable (permission denied or no device)', error)
    }
  }
}
