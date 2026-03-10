import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Polygon, Marker, Popup, useMap, Circle, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { MT_KALISUNGAN_CENTER, DEFAULT_ZOOM, TRAILS, POI, ZONES, haversineDistance, distanceToTrail } from '@/lib/map-data';
import { Button } from '@/components/ui/button';
import { Locate } from 'lucide-react';
import { toast } from 'sonner';
import ElevationProfile from '@/components/map/ElevationProfile';
import MapLegend from '@/components/map/MapLegend';
import TrailStats from '@/components/map/TrailStats';
import TrailNavigation from '@/components/map/TrailNavigation';
import MapCompass from '@/components/map/MapCompass';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const hikerIcon = new L.DivIcon({
  html: `<div style="width:16px;height:16px;background:#22c55e;border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px #22c55e80;"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const poiIcons: Record<string, L.DivIcon> = {
  checkpoint: new L.DivIcon({ html: `<div style="width:12px;height:12px;background:#f59e0b;border:2px solid #fff;border-radius:50%;"></div>`, className: '', iconSize: [12, 12], iconAnchor: [6, 6] }),
  summit: new L.DivIcon({ html: `<div style="width:14px;height:14px;background:#ef4444;border:2px solid #fff;border-radius:3px;transform:rotate(45deg);"></div>`, className: '', iconSize: [14, 14], iconAnchor: [7, 7] }),
  camp: new L.DivIcon({ html: `<div style="width:12px;height:12px;background:#22c55e;border:2px solid #fff;border-radius:2px;"></div>`, className: '', iconSize: [12, 12], iconAnchor: [6, 6] }),
  water: new L.DivIcon({ html: `<div style="width:12px;height:12px;background:#3b82f6;border:2px solid #fff;border-radius:50%;"></div>`, className: '', iconSize: [12, 12], iconAnchor: [6, 6] }),
  viewpoint: new L.DivIcon({ html: `<div style="width:12px;height:12px;background:#a855f7;border:2px solid #fff;border-radius:50%;"></div>`, className: '', iconSize: [12, 12], iconAnchor: [6, 6] }),
  ranger: new L.DivIcon({ html: `<div style="width:12px;height:12px;background:#f97316;border:2px solid #fff;border-radius:2px;"></div>`, className: '', iconSize: [12, 12], iconAnchor: [6, 6] }),
};

function LocateControl() {
  const map = useMap();
  return (
    <Button size="icon" variant="outline" className="absolute bottom-4 right-4 z-[1000] glass-card" onClick={() => map.locate({ setView: true, maxZoom: 17 })}>
      <Locate className="h-4 w-4" />
    </Button>
  );
}

// Snap user position to nearest point on selected trail
function findNearestTrailIndex(userPos: [number, number], trailPath: L.LatLngTuple[]): number {
  let minDist = Infinity;
  let minIdx = 0;
  for (let i = 0; i < trailPath.length; i++) {
    const d = haversineDistance(userPos[0], userPos[1], trailPath[i][0], trailPath[i][1]);
    if (d < minDist) {
      minDist = d;
      minIdx = i;
    }
  }
  return minIdx;
}

export default function MapPage() {
  const [tracking, setTracking] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [trackPath, setTrackPath] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [offTrail, setOffTrail] = useState(false);
  const [selectedTrail, setSelectedTrail] = useState(0);
  const [offlineReady, setOfflineReady] = useState(false);
  const [userTrailProgress, setUserTrailProgress] = useState<number | undefined>(undefined);
  const watchRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setTracking(true);
    setTrackPath([]);
    setDistance(0);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(newPos);
        setTrackPath((prev) => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const d = haversineDistance(last[0], last[1], newPos[0], newPos[1]);
            setDistance((old) => old + d);
          }
          return [...prev, newPos];
        });

        // Track progress along selected trail
        const idx = findNearestTrailIndex(newPos, TRAILS[selectedTrail].path);
        setUserTrailProgress(idx);

        // Check if off-trail (> 100m from nearest trail point)
        const minDist = Math.min(...TRAILS.map((t) => distanceToTrail(newPos[0], newPos[1], t.path)));
        if (minDist > 0.1) {
          setOffTrail(true);
          toast.warning('You are off the marked trail!', { id: 'off-trail' });
        } else {
          setOffTrail(false);
        }
      },
      (err) => toast.error(`GPS Error: ${err.message}`),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }, [selectedTrail]);

  const stopTracking = useCallback(() => {
    setTracking(false);
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => () => { stopTracking(); }, [stopTracking]);

  const handleOfflineCache = async () => {
    toast.info('Caching map tiles for offline use...');
    try {
      const cache = await caches.open('map-tiles-v1');
      const z = 15;
      const cx = Math.floor(((121.3454 + 180) / 360) * Math.pow(2, z));
      const cy = Math.floor(((1 - Math.log(Math.tan((14.1475 * Math.PI) / 180) + 1 / Math.cos((14.1475 * Math.PI) / 180)) / Math.PI) / 2) * Math.pow(2, z));
      const urls: string[] = [];
      for (let dx = -3; dx <= 3; dx++) {
        for (let dy = -3; dy <= 3; dy++) {
          urls.push(`https://tile.openstreetmap.org/${z}/${cx + dx}/${cy + dy}.png`);
        }
      }
      await cache.addAll(urls);
      setOfflineReady(true);
      toast.success('Map tiles cached!');
    } catch {
      toast.error('Failed to cache tiles.');
    }
  };

  const currentTrail = TRAILS[selectedTrail];

  return (
    <div className="h-screen pt-16 flex flex-col">
      <TrailStats
        distance={distance}
        elapsed={elapsed}
        selectedTrail={selectedTrail}
        offTrail={offTrail}
        tracking={tracking}
        offlineReady={offlineReady}
        onStartTracking={startTracking}
        onStopTracking={stopTracking}
        onOfflineCache={handleOfflineCache}
      />

      {/* Trail selector */}
      <div className="glass-card border-b border-border/30 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        {TRAILS.map((t, i) => (
          <button
            key={t.name}
            onClick={() => setSelectedTrail(i)}
            className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-all ${
              selectedTrail === i ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            style={selectedTrail === i ? { backgroundColor: t.color } : {}}
          >
            {t.name} • {t.distance} • {t.elevation}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer center={MT_KALISUNGAN_CENTER} zoom={DEFAULT_ZOOM} className="h-full w-full" zoomControl={false}>
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Street Map">
              <TileLayer attribution='&copy; OpenStreetMap' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Topographic">
              <TileLayer attribution='OpenTopoMap' url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer attribution='Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            </LayersControl.BaseLayer>
          </LayersControl>

          {TRAILS.map((t, i) => (
            <Polyline
              key={t.name}
              positions={t.path}
              pathOptions={{
                color: t.color,
                weight: i === selectedTrail ? 6 : 3,
                opacity: i === selectedTrail ? 1 : 0.4,
              }}
            />
          ))}

          <Marker
            position={currentTrail.path[0]}
            icon={new L.DivIcon({
              html: `<div style="width:18px;height:18px;background:${currentTrail.color};border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px ${currentTrail.color}80;display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff;font-weight:bold;">S</div>`,
              className: '',
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            })}
          >
            <Popup><strong>Start: {currentTrail.name}</strong></Popup>
          </Marker>
          <Marker
            position={currentTrail.path[currentTrail.path.length - 1]}
            icon={new L.DivIcon({
              html: `<div style="width:18px;height:18px;background:${currentTrail.color};border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px ${currentTrail.color}80;display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff;font-weight:bold;">E</div>`,
              className: '',
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            })}
          >
            <Popup><strong>End: {currentTrail.name}</strong></Popup>
          </Marker>

          {ZONES.map((z) => (
            <Polygon key={z.name} positions={z.positions} pathOptions={{ color: z.color, fillColor: z.color, fillOpacity: 0.15, weight: 2, dashArray: '5 5' }}>
              <Popup><strong>{z.name}</strong></Popup>
            </Polygon>
          ))}

          {POI.map((p) => (
            <Marker key={p.name} position={p.pos} icon={poiIcons[p.type] || poiIcons.checkpoint}>
              <Popup><strong>{p.name}</strong><br /><span className="capitalize">{p.type}</span></Popup>
            </Marker>
          ))}

          {userPos && (
            <>
              <Marker position={userPos} icon={hikerIcon}>
                <Popup>Your Position</Popup>
              </Marker>
              <Circle center={userPos} radius={15} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.15 }} />
            </>
          )}

          {trackPath.length > 1 && (
            <Polyline positions={trackPath} pathOptions={{ color: '#22c55e', weight: 3, dashArray: '5 10' }} />
          )}

          <LocateControl />
        </MapContainer>

        {/* Turn-by-turn navigation overlay */}
        <div className="absolute top-4 left-4 z-[1000] w-72">
          <TrailNavigation
            trailPath={currentTrail.path}
            trailName={currentTrail.name}
            trailColor={currentTrail.color}
            userPos={userPos}
            tracking={tracking}
            userTrailProgress={userTrailProgress}
          />
        </div>

        {/* Compass */}
        <div className="absolute top-4 right-16 z-[1000] w-24">
          <MapCompass userPos={userPos} />
        </div>

        <MapLegend />
      </div>

      {/* Elevation Profile */}
      <div className="px-4 py-3 border-t border-border/30">
        <ElevationProfile
          trailPath={currentTrail.path}
          trailName={currentTrail.name}
          trailColor={currentTrail.color}
          userProgress={userTrailProgress}
        />
      </div>
    </div>
  );
}
