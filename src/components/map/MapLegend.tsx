import { TRAILS } from '@/lib/map-data';

export default function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] glass-card rounded-lg p-3 text-xs space-y-1.5">
      <div className="font-semibold text-foreground mb-1">Legend</div>
      {TRAILS.map((t) => (
        <div key={t.name} className="flex items-center gap-2">
          <div className="w-4 h-0.5 rounded" style={{ backgroundColor: t.color }} />
          <span className="text-muted-foreground">{t.name} ({t.difficulty})</span>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full border-2 border-dashed" style={{ borderColor: '#22c55e' }} />
        <span className="text-muted-foreground">Camping Zone</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full border-2 border-dashed" style={{ borderColor: '#ef4444' }} />
        <span className="text-muted-foreground">Restricted Area</span>
      </div>
    </div>
  );
}
