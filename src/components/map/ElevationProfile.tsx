import { useMemo, useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown, ChevronUp, Mountain, Loader2 } from 'lucide-react';
import type { LatLngTuple } from 'leaflet';

interface ElevationProfileProps {
  trailPath: LatLngTuple[];
  trailName: string;
  trailColor: string;
  userProgress?: number; // index along trail where user currently is
  defaultCollapsed?: boolean;
}

interface ElevationPoint {
  distance: number;
  elevation: number;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ElevationProfile({ trailPath, trailName, trailColor, userProgress }: ElevationProfileProps) {
  const [data, setData] = useState<ElevationPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(true);

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const minElev = Math.min(...data.map((d) => d.elevation));
    const maxElev = Math.max(...data.map((d) => d.elevation));
    const gain = maxElev - minElev;
    return { minElev, maxElev, gain };
  }, [data]);

  useEffect(() => {
    if (trailPath.length < 2) return;
    fetchElevation();
  }, [trailPath]);

  useEffect(() => {
    // reset collapsed state when switching trails
    setCollapsed(true);
  }, [trailName]);

  const fetchElevation = async () => {
    setLoading(true);
    setError(null);
    try {
      const locations = trailPath.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
      const { data: result, error: fnError } = await supabase.functions.invoke('get-elevation', {
        body: { locations },
      });

      if (fnError) throw new Error(fnError.message);

      if (result?.results) {
        let cumDist = 0;
        const points: ElevationPoint[] = result.results.map((r: any, i: number) => {
          if (i > 0) {
            cumDist += haversineKm(trailPath[i - 1][0], trailPath[i - 1][1], trailPath[i][0], trailPath[i][1]);
          }
          return { distance: Math.round(cumDist * 1000), elevation: Math.round(r.elevation) };
        });
        setData(points);
      }
    } catch (err: any) {
      setError('Could not load elevation data');
      console.error('Elevation fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-lg p-4 flex items-center justify-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading elevation data...
      </div>
    );
  }

  if (error || data.length === 0) {
    return null;
  }
  if (!stats) return null;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="glass-card rounded-lg w-10 h-10 flex items-center justify-center border border-border/40 hover:bg-background/40 transition-colors"
        aria-label={`Show ${trailName} elevation`}
      >
        <Mountain className="h-4 w-4" style={{ color: trailColor }} />
      </button>
    );
  }

  return (
    <div className="glass-card rounded-lg overflow-hidden w-full max-w-2xl">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${trailColor}20`, color: trailColor }}>
            <Mountain className="h-4 w-4" />
          </div>
          <div className="min-w-0 text-left">
            <div className="text-sm font-semibold truncate">{trailName} Elevation</div>
            <div className="text-xs text-muted-foreground truncate">
              ↑ {stats.gain}m • Min {stats.minElev}m • Max {stats.maxElev}m
            </div>
          </div>
        </div>
        <div className="shrink-0 text-muted-foreground">
          {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      <div className="px-4 pb-4">
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id={`elev-${trailName}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={trailColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={trailColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(155 15% 18%)" />
            <XAxis
              dataKey="distance"
              fontSize={10}
              stroke="hsl(150 10% 55%)"
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}km`}
            />
            <YAxis
              fontSize={10}
              stroke="hsl(150 10% 55%)"
              tickFormatter={(v) => `${v}m`}
              domain={[stats.minElev - 20, stats.maxElev + 20]}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(160 12% 10%)',
                border: '1px solid hsl(155 15% 18%)',
                borderRadius: '8px',
                color: 'hsl(140 20% 92%)',
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value}m`, 'Elevation']}
              labelFormatter={(label: number) => `${(label / 1000).toFixed(2)} km`}
            />
            <Area type="monotone" dataKey="elevation" stroke={trailColor} fill={`url(#elev-${trailName})`} strokeWidth={2} />
            {userProgress !== undefined && userProgress < data.length && (
              <Area type="monotone" dataKey="elevation" stroke="#22c55e" strokeWidth={0} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
