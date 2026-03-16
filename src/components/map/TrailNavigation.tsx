import { useEffect, useMemo, useState } from 'react';
import { Navigation, MapPin, ArrowUp, ArrowUpRight, ArrowRight, ArrowDownRight, ArrowDown, ArrowDownLeft, ArrowLeft, ArrowUpLeft, Flag, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LatLngTuple } from 'leaflet';

interface TrailNavigationProps {
  trailPath: LatLngTuple[];
  trailName: string;
  trailColor: string;
  userPos: [number, number] | null;
  tracking: boolean;
  userTrailProgress: number | undefined;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

function getDirection(deg: number): { label: string; Icon: typeof ArrowUp } {
  if (deg >= 337.5 || deg < 22.5) return { label: 'North', Icon: ArrowUp };
  if (deg >= 22.5 && deg < 67.5) return { label: 'Northeast', Icon: ArrowUpRight };
  if (deg >= 67.5 && deg < 112.5) return { label: 'East', Icon: ArrowRight };
  if (deg >= 112.5 && deg < 157.5) return { label: 'Southeast', Icon: ArrowDownRight };
  if (deg >= 157.5 && deg < 202.5) return { label: 'South', Icon: ArrowDown };
  if (deg >= 202.5 && deg < 247.5) return { label: 'Southwest', Icon: ArrowDownLeft };
  if (deg >= 247.5 && deg < 292.5) return { label: 'West', Icon: ArrowLeft };
  return { label: 'Northwest', Icon: ArrowUpLeft };
}

function getTurnInstruction(prevBearing: number, nextBearing: number): string {
  let diff = nextBearing - prevBearing;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  if (Math.abs(diff) < 20) return 'Continue straight';
  if (diff > 0 && diff < 60) return 'Bear right';
  if (diff >= 60 && diff < 120) return 'Turn right';
  if (diff >= 120) return 'Sharp right';
  if (diff < 0 && diff > -60) return 'Bear left';
  if (diff <= -60 && diff > -120) return 'Turn left';
  return 'Sharp left';
}

export default function TrailNavigation({
  trailPath,
  trailName,
  trailColor,
  userPos,
  tracking,
  userTrailProgress,
}: TrailNavigationProps) {
  const [collapsed, setCollapsed] = useState(true);

  const navData = useMemo(() => {
    if (!userPos || userTrailProgress === undefined || trailPath.length < 2) return null;

    const currentIdx = Math.min(userTrailProgress, trailPath.length - 1);
    const nextIdx = Math.min(currentIdx + 1, trailPath.length - 1);
    const isAtEnd = currentIdx >= trailPath.length - 1;

    // Distance to next waypoint
    const distToNext = haversineKm(userPos[0], userPos[1], trailPath[nextIdx][0], trailPath[nextIdx][1]);

    // Bearing to next waypoint
    const bearingToNext = bearing(userPos[0], userPos[1], trailPath[nextIdx][0], trailPath[nextIdx][1]);
    const direction = getDirection(bearingToNext);

    // Turn instruction
    let turnInstruction = 'Head towards the trail';
    if (currentIdx > 0 && nextIdx < trailPath.length - 1) {
      const prevBearing = bearing(trailPath[currentIdx - 1][0], trailPath[currentIdx - 1][1], trailPath[currentIdx][0], trailPath[currentIdx][1]);
      const nextBearing2 = bearing(trailPath[currentIdx][0], trailPath[currentIdx][1], trailPath[nextIdx][0], trailPath[nextIdx][1]);
      turnInstruction = getTurnInstruction(prevBearing, nextBearing2);
    } else if (currentIdx === 0) {
      turnInstruction = 'Head to the first waypoint';
    }

    // Total remaining distance
    let remainingDist = distToNext;
    for (let i = nextIdx; i < trailPath.length - 1; i++) {
      remainingDist += haversineKm(trailPath[i][0], trailPath[i][1], trailPath[i + 1][0], trailPath[i + 1][1]);
    }

    // Total trail distance
    let totalDist = 0;
    for (let i = 0; i < trailPath.length - 1; i++) {
      totalDist += haversineKm(trailPath[i][0], trailPath[i][1], trailPath[i + 1][0], trailPath[i + 1][1]);
    }

    const progress = totalDist > 0 ? Math.max(0, Math.min(1, (totalDist - remainingDist) / totalDist)) : 0;

    // Waypoints list (upcoming)
    const waypoints = [];
    for (let i = nextIdx; i < Math.min(nextIdx + 3, trailPath.length); i++) {
      const d = haversineKm(userPos[0], userPos[1], trailPath[i][0], trailPath[i][1]);
      waypoints.push({
        index: i,
        distance: d,
        isLast: i === trailPath.length - 1,
      });
    }

    return {
      distToNext,
      direction,
      turnInstruction,
      remainingDist,
      totalDist,
      progress,
      currentIdx,
      nextIdx,
      isAtEnd,
      waypoints,
    };
  }, [userPos, userTrailProgress, trailPath]);

  // Keep UI tidy when starting/stopping tracking or switching trails.
  useEffect(() => {
    setCollapsed(true);
  }, [tracking, trailName]);

  if (!tracking || !navData) {
    return (
      <div className="glass-card rounded-lg p-3 text-center text-sm text-muted-foreground">
        <Navigation className="h-5 w-5 mx-auto mb-1 opacity-50" />
        Start tracking to see turn-by-turn navigation
      </div>
    );
  }

  const { distToNext, direction, turnInstruction, remainingDist, progress, isAtEnd, waypoints } = navData;
  const distLabel = distToNext < 0.1 ? `${Math.round(distToNext * 1000)}m` : `${distToNext.toFixed(2)}km`;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={turnInstruction}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        className="glass-card rounded-lg overflow-hidden"
      >
        {/* Collapsible header */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="w-full p-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand navigation details' : 'Collapse navigation details'}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${trailColor}20`, color: trailColor }}
          >
            {isAtEnd ? <Flag className="h-5 w-5" /> : <direction.Icon className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-bold truncate">
              {isAtEnd ? 'You have reached the end!' : turnInstruction}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {isAtEnd ? `${trailName} complete` : `${direction.label} • ${distLabel} to next`}
            </div>
          </div>
          <div className="shrink-0 text-muted-foreground">
            {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {!collapsed && (
          <div className="px-3 pb-3 space-y-3">
        {/* Main turn instruction */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${trailColor}20`, color: trailColor }}
          >
            {isAtEnd ? (
              <Flag className="h-6 w-6" />
            ) : (
              <direction.Icon className="h-6 w-6" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate">
              {isAtEnd ? 'You have reached the end!' : turnInstruction}
            </div>
            <div className="text-xs text-muted-foreground">
              {isAtEnd
                ? `${trailName} complete`
                : `${direction.label} — ${distLabel} to next waypoint`}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{(progress * 100).toFixed(0)}% complete</span>
            <span>{remainingDist < 0.1 ? `${Math.round(remainingDist * 1000)}m` : `${remainingDist.toFixed(2)}km`} remaining</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: trailColor }}
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Upcoming waypoints */}
        {waypoints.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Upcoming</div>
            {waypoints.map((wp) => (
              <div key={wp.index} className="flex items-center gap-2 text-xs">
                <MapPin className="h-3 w-3 shrink-0" style={{ color: wp.isLast ? trailColor : 'hsl(var(--muted-foreground))' }} />
                <span className={wp.isLast ? 'font-semibold' : 'text-muted-foreground'}>
                  {wp.isLast ? 'Trail End' : `Waypoint ${wp.index + 1}`}
                </span>
                <span className="ml-auto text-muted-foreground">
                  {wp.distance < 0.1 ? `${Math.round(wp.distance * 1000)}m` : `${wp.distance.toFixed(2)}km`}
                </span>
              </div>
            ))}
          </div>
        )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
