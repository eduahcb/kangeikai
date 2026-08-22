export interface Zone {
  name: string
  x: number
  y: number
  width: number
  height: number
}

/**
 * The name of the zone containing (x, y), or `null` if outside every zone
 * (data-model.md's `ZoneMembership` — zones don't overlap per map authoring, so the first
 * match is unambiguous).
 */
export function zoneAt(zones: readonly Zone[], x: number, y: number): string | null {
  const zone = zones.find(z => x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.height)
  return zone?.name ?? null
}
