import { Button } from '@/components/ui/button';
import { Pause, Play, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { TRAILS } from '@/lib/map-data';

interface TrailStatsProps {
  distance: number;
  elapsed: number;
  selectedTrail: number;
  offTrail: boolean;
  tracking: boolean;
  offlineReady: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onOfflineCache: () => void;
}

function formatTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function TrailStats({
  distance, elapsed, selectedTrail, offTrail, tracking, offlineReady,
  onStartTracking, onStopTracking, onOfflineCache,
}: TrailStatsProps) {
  const pace = elapsed > 0 && distance > 0 ? elapsed / 60 / distance : 0;

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card-strong border-b border-border/30 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Distance</span>
            <div className="text-xl font-bold text-primary">{distance.toFixed(2)} km</div>
          </div>
          <div>
            <span className="text-muted-foreground">Time</span>
            <div className="text-xl font-bold">{formatTime(elapsed)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Pace</span>
            <div className="text-xl font-bold">{pace > 0 ? `${pace.toFixed(1)} min/km` : '--'}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Trail</span>
            <div className="text-sm font-semibold" style={{ color: TRAILS[selectedTrail].color }}>
              {TRAILS[selectedTrail].name}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {offTrail && (
            <div className="flex items-center gap-1 text-destructive text-sm animate-pulse">
              <AlertTriangle className="h-4 w-4" /> Off Trail!
            </div>
          )}
          <Button size="sm" variant="outline" onClick={onOfflineCache} className="gap-1">
            {offlineReady ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
            {offlineReady ? 'Cached' : 'Save Offline'}
          </Button>
          {tracking ? (
            <Button size="sm" variant="destructive" onClick={onStopTracking} className="gap-1">
              <Pause className="h-3 w-3" /> Stop
            </Button>
          ) : (
            <Button size="sm" onClick={onStartTracking} className="gap-1">
              <Play className="h-3 w-3" /> Start Hike
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
