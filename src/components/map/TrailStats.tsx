import { Button } from '@/components/ui/button';
import { Pause, Play, AlertTriangle, Wifi, WifiOff, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { TRAILS } from '@/lib/map-data';
import { useEffect, useState } from 'react';

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
  const [expanded, setExpanded] = useState(false);

  // Collapse when switching trails to keep UI tidy.
  useEffect(() => {
    setExpanded(false);
  }, [selectedTrail]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-strong border-b border-border/30 px-4 py-2"
    >
      <div className="container mx-auto flex items-center justify-between gap-2">
        {/* Compact summary */}
        <div className="min-w-0 flex items-center gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold truncate" style={{ color: TRAILS[selectedTrail].color }}>
                {TRAILS[selectedTrail].name}
              </div>
              {offTrail && (
                <div className="inline-flex items-center gap-1 text-destructive text-xs animate-pulse">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Off Trail</span>
                </div>
              )}
            </div>
            <div className="flex items-baseline gap-3 text-xs text-muted-foreground">
              <span className="whitespace-nowrap">
                <span className="text-foreground font-semibold">{distance.toFixed(2)}</span> km
              </span>
              <span className="whitespace-nowrap">
                <span className="text-foreground font-semibold">{formatTime(elapsed)}</span>
              </span>
              <span className="whitespace-nowrap">
                <span className="text-foreground font-semibold">{pace > 0 ? pace.toFixed(1) : '--'}</span> min/km
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button size="icon" variant="outline" onClick={onOfflineCache} aria-label={offlineReady ? 'Offline cached' : 'Save offline'}>
            {offlineReady ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
          </Button>
          {tracking ? (
            <Button size="icon" variant="destructive" onClick={onStopTracking} aria-label="Stop tracking">
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="icon" onClick={onStartTracking} aria-label="Start hike">
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
            aria-expanded={expanded}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="container mx-auto mt-2 flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs text-muted-foreground">
            Trail: <span className="font-medium text-foreground">{TRAILS[selectedTrail].name}</span>
          </div>
          <div className="flex items-center gap-2">
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
      )}
    </motion.div>
  );
}
