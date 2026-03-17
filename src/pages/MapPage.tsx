import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Polygon, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MT_KALISUNGAN_CENTER, DEFAULT_ZOOM, TRAILS, POI, ZONES, haversineDistance, distanceToTrail } from '@/lib/map-data';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Locate, Pause, Play, AlertTriangle, ChevronLeft, ChevronRight, Layers, Download, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import ElevationProfile from '@/components/map/ElevationProfile';
import MapLegend from '@/components/map/MapLegend';
import TrailStats from '@/components/map/TrailStats';
import TrailNavigation from '@/components/map/TrailNavigation';
import MapCompass from '@/components/map/MapCompass';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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

function LocateControl({
  map,
  className,
  bottomClassName,
}: {
  map: L.Map | null;
  className?: string;
  bottomClassName?: string;
}) {
  return (
    <Button
      size="icon"
      variant="outline"
      className={className ?? `absolute right-4 z-[1000] glass-card ${bottomClassName ?? 'bottom-[7.5rem]'} md:bottom-4`}
      onClick={() => map?.locate({ setView: true, maxZoom: 17 })}
      disabled={!map}
      aria-label="Locate me"
    >
      <Locate className="h-4 w-4" />
    </Button>
  );
}

type BaseLayer = 'street' | 'topo' | 'sat';

function MapInstanceBridge({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

function MapLayersControl({
  value,
  onChange,
}: {
  value: BaseLayer;
  onChange: (v: BaseLayer) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        size="icon"
        variant="outline"
        className="glass-card"
        onClick={() => setOpen((v) => !v)}
        aria-label="Map layers"
        aria-expanded={open}
      >
        <Layers className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute bottom-12 right-0 w-40 glass-card-strong rounded-lg p-2 border border-border/40">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground px-2 pb-1">
            Layers
          </div>
          {(
            [
              { id: 'street', label: 'Street' },
              { id: 'topo', label: 'Topographic' },
              { id: 'sat', label: 'Satellite' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onChange(opt.id);
                setOpen(false);
              }}
              className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors ${
                value === opt.id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
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
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [baseLayer, setBaseLayer] = useState<BaseLayer>('street');
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [trackPath, setTrackPath] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [offTrail, setOffTrail] = useState(false);
  const [selectedTrail, setSelectedTrail] = useState(0);
  const [offlineReady, setOfflineReady] = useState(false);
  const [userTrailProgress, setUserTrailProgress] = useState<number | undefined>(undefined);
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
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
  const pace = elapsed > 0 && distance > 0 ? elapsed / 60 / distance : 0;

  useEffect(() => {
    // keep the map clean by default on mobile when switching trails
    setMobileControlsOpen(false);
  }, [selectedTrail]);

  return (
    <div className={`h-screen pt-16 flex flex-col ${mobileControlsOpen ? 'map-mobile-controls-open' : ''}`}>
      {/* Desktop/tablet top bar */}
      <div className="hidden md:block">
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
      </div>

      {/* Desktop/tablet trail selector */}
      <div className="hidden md:flex glass-card border-b border-border/30 px-4 py-2 items-center gap-2 overflow-x-auto">
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
        <ErrorBoundary title="Map failed to render">
          <MapContainer
            center={MT_KALISUNGAN_CENTER}
            zoom={DEFAULT_ZOOM}
            className="h-full w-full"
            zoomControl={false}
            attributionControl={false}
            ref={mapRef as any}
            whenReady={() => {}}
          >
            <MapInstanceBridge onReady={setMapInstance} />
            {baseLayer === 'street' && (
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
            )}
            {baseLayer === 'topo' && (
              <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" />
            )}
            {baseLayer === 'sat' && (
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            )}

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
          </MapContainer>
        </ErrorBoundary>

        {/* Turn-by-turn navigation overlay */}
        <div className="absolute top-4 left-4 z-[1000] w-[calc(100%-7.5rem)] md:w-72">
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
        <div className="absolute top-24 right-4 md:top-4 md:right-16 z-[1000] w-24">
          <MapCompass userPos={userPos} />
        </div>

        {/* Desktop right-side stack: layers + elevation + locate */}
        <div className="hidden md:flex absolute right-4 bottom-4 z-[1100] flex-col items-end gap-2">
          <MapLayersControl value={baseLayer} onChange={setBaseLayer} />
          <ElevationProfile
            trailPath={currentTrail.path}
            trailName={currentTrail.name}
            trailColor={currentTrail.color}
            userProgress={userTrailProgress}
          />
          <LocateControl map={mapInstance} className="glass-card" />
        </div>

        {/* Desktop legend */}
        <MapLegend className="absolute bottom-44 left-4 z-[1000] hidden md:block" />

        {/* Mobile legend toggle (other side) */}
        <div
          className={`md:hidden absolute left-4 z-[1100] flex flex-col items-start gap-2 ${
            mobileControlsOpen ? 'bottom-[14.5rem]' : 'bottom-[6.5rem]'
          }`}
        >
          {!legendOpen ? (
            <Button
              size="icon"
              variant="outline"
              className="glass-card"
              onClick={() => setLegendOpen(true)}
              aria-label="Open legend"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="relative">
              <MapLegend className="w-56" />
              <button
                type="button"
                onClick={() => setLegendOpen(false)}
                aria-label="Close legend"
                className="absolute -left-2 -top-2 h-7 w-7 rounded-full glass-card flex items-center justify-center"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile right-side stack: ONLY 3 controls (layers, elevation, locate) */}
        <div
          className={`md:hidden absolute right-4 z-[1100] flex flex-col items-end gap-2 ${
            mobileControlsOpen ? 'bottom-[14.5rem]' : 'bottom-[6.5rem]'
          }`}
        >
          <MapLayersControl value={baseLayer} onChange={setBaseLayer} />
          <ElevationProfile
            trailPath={currentTrail.path}
            trailName={currentTrail.name}
            trailColor={currentTrail.color}
            userProgress={userTrailProgress}
          />
          <LocateControl map={mapInstance} className="glass-card" />
        </div>

        {/* Mobile bottom controls (collapsible) */}
        <div className="md:hidden absolute bottom-4 left-4 right-4 z-[1000]">
          <div className="glass-card-strong rounded-lg overflow-hidden">
            <div
              onClick={() => setMobileControlsOpen((v) => !v)}
              className="w-full px-3 py-2 flex items-center gap-3 hover:bg-white/5 transition-colors"
              aria-expanded={mobileControlsOpen}
              aria-label={mobileControlsOpen ? 'Collapse controls' : 'Expand controls'}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setMobileControlsOpen((v) => !v);
              }}
            >
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold truncate" style={{ color: currentTrail.color }}>
                    {currentTrail.name}
                  </div>
                  {offTrail && (
                    <div className="inline-flex items-center gap-1 text-destructive text-xs animate-pulse">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Off</span>
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground flex gap-3">
                  <span>
                    <span className="text-foreground font-semibold">{distance.toFixed(2)}</span> km
                  </span>
                  <span>
                    <span className="text-foreground font-semibold">{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}</span>
                  </span>
                  <span>
                    <span className="text-foreground font-semibold">{pace > 0 ? pace.toFixed(1) : '--'}</span> min/km
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOfflineCache(); }}
                  aria-label={offlineReady ? 'Map downloaded for offline use' : 'Download map for offline use'}
                  disabled={offlineReady}
                >
                  {offlineReady ? <CheckCircle2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                </Button>
                {tracking ? (
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); stopTracking(); }}
                    aria-label="Stop tracking"
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); startTracking(); }}
                    aria-label="Start hike"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                <div className="text-muted-foreground pl-1">
                  {mobileControlsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </div>
              </div>
            </div>

            {mobileControlsOpen && (
              <div className="border-t border-border/30 px-3 py-2 space-y-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {TRAILS.map((t, i) => (
                    <button
                      key={t.name}
                      onClick={() => setSelectedTrail(i)}
                      className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        selectedTrail === i ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                      style={selectedTrail === i ? { backgroundColor: t.color } : {}}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{currentTrail.distance} • {currentTrail.elevation}</span>
                  <span className="capitalize">{currentTrail.difficulty}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleOfflineCache} className="gap-1 flex-1" disabled={offlineReady}>
                    {offlineReady ? <CheckCircle2 className="h-3 w-3" /> : <Download className="h-3 w-3" />}
                    {offlineReady ? 'Downloaded' : 'Download Map'}
                  </Button>
                  {tracking ? (
                    <Button size="sm" variant="destructive" onClick={stopTracking} className="gap-1 flex-1">
                      <Pause className="h-3 w-3" /> Stop
                    </Button>
                  ) : (
                    <Button size="sm" onClick={startTracking} className="gap-1 flex-1">
                      <Play className="h-3 w-3" /> Start
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
