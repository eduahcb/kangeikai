import { Room } from 'colyseus'
import { OfficeRoomState } from './schema/office-room-state'

/**
 * Skeleton for Phase 2 (T009): registers the room and initializes empty state so the server
 * boots and accepts a join with no state-sync logic yet. onJoin/onLeave/onMessage land in
 * Phase 3+ (T012, T013, T017, T020, T021).
 */
export class OfficeRoom extends Room<{ state: OfficeRoomState }> {
  onCreate(): void {
    this.setState(new OfficeRoomState())
  }
}
