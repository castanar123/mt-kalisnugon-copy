import type { LatLngTuple } from 'leaflet';

// Mount Kalisungan center coordinates (Calauan, Laguna, Philippines)
export const MT_KALISUNGAN_CENTER: LatLngTuple = [14.1475, 121.3454];
export const DEFAULT_ZOOM = 15;

// Trail route data (approximate real paths on Mt. Kalisungan)
export const TRAILS = [
  {
    name: 'Summit Trail',
    difficulty: 'hard' as const,
    color: '#ef4444',
    elevation: '622m',
    distance: '3.2 km',
    path: [
      [14.1440, 121.3430],
      [14.1448, 121.3435],
      [14.1455, 121.3440],
      [14.1462, 121.3445],
      [14.1468, 121.3448],
      [14.1473, 121.3452],
      [14.1478, 121.3455],
      [14.1483, 121.3458],
      [14.1488, 121.3460],
      [14.1495, 121.3462],
    ] as LatLngTuple[],
  },
  {
    name: 'River Trail',
    difficulty: 'easy' as const,
    color: '#3b82f6',
    elevation: '350m',
    distance: '2.1 km',
    path: [
      [14.1440, 121.3430],
      [14.1438, 121.3438],
      [14.1435, 121.3445],
      [14.1433, 121.3452],
      [14.1430, 121.3458],
      [14.1428, 121.3465],
      [14.1425, 121.3470],
      [14.1423, 121.3475],
    ] as LatLngTuple[],
  },
  {
    name: 'Ridge Trail',
    difficulty: 'moderate' as const,
    color: '#f59e0b',
    elevation: '480m',
    distance: '2.8 km',
    path: [
      [14.1440, 121.3430],
      [14.1445, 121.3425],
      [14.1450, 121.3420],
      [14.1458, 121.3418],
      [14.1465, 121.3415],
      [14.1472, 121.3418],
      [14.1478, 121.3422],
      [14.1485, 121.3425],
      [14.1490, 121.3430],
    ] as LatLngTuple[],
  },
];

// Points of interest
export const POI = [
  { name: 'Trailhead / Registration', pos: [14.1440, 121.3430] as LatLngTuple, type: 'checkpoint' },
  { name: 'Summit (629m)', pos: [14.1495, 121.3462] as LatLngTuple, type: 'summit' },
  { name: 'Campsite A', pos: [14.1465, 121.3445] as LatLngTuple, type: 'camp' },
  { name: 'River Crossing', pos: [14.1430, 121.3458] as LatLngTuple, type: 'water' },
  { name: 'Viewpoint Ridge', pos: [14.1478, 121.3422] as LatLngTuple, type: 'viewpoint' },
  { name: 'Ranger Station', pos: [14.1442, 121.3433] as LatLngTuple, type: 'ranger' },
];

// Zone polygons
export const ZONES = [
  {
    name: 'Camping Zone',
    color: '#22c55e',
    positions: [
      [14.1460, 121.3440],
      [14.1470, 121.3440],
      [14.1470, 121.3450],
      [14.1460, 121.3450],
    ] as LatLngTuple[],
  },
  {
    name: 'Restricted Wildlife Area',
    color: '#ef4444',
    positions: [
      [14.1490, 121.3450],
      [14.1505, 121.3450],
      [14.1505, 121.3470],
      [14.1490, 121.3470],
    ] as LatLngTuple[],
  },
];

// Haversine distance in km
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Distance from point to nearest point on polyline
export function distanceToTrail(lat: number, lng: number, trail: LatLngTuple[]): number {
  let minDist = Infinity;
  for (const [tLat, tLng] of trail) {
    const d = haversineDistance(lat, lng, tLat, tLng);
    if (d < minDist) minDist = d;
  }
  return minDist;
}
