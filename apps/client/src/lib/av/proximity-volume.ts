/**
 * Linear falloff from 1 (distance 0) to 0 (distance >= hearingRangePx), per
 * contracts/proximity-volume-function.md.
 */
export function proximityVolume(distance: number, hearingRangePx: number): number {
  if (distance <= 0) {
    return 1
  }
  if (distance >= hearingRangePx) {
    return 0
  }
  return 1 - distance / hearingRangePx
}
