import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { parseMeta } from '@/lib/bookingMeta';
import { exportToExcelMultiSheet } from '@/lib/excel-export';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  Users, Globe, MapPin, BarChart2, Loader2, FileDown, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#f97316', '#64748b'];

interface DemoStats {
  total: number;
  byAgeGroup: Record<string, number>;
  bySex: Record<string, number>;
  byNationality: Record<string, number>;
  byCity: Record<string, number>;
}

function ageGroup(age: string | undefined): string {
  const n = parseInt(age ?? '0');
  if (!n) return 'Unknown';
  if (n < 13) return 'Child (0-12)';
  if (n < 18) return 'Teen (13-17)';
  if (n < 26) return 'Young Adult (18-25)';
  if (n < 36) return 'Adult (26-35)';
  if (n < 46) return 'Adult (36-45)';
  if (n < 61) return 'Middle Age (46-60)';
  return 'Senior (61+)';
}

function toChartData(record: Record<string, number>, limit = 10) {
  return Object.entries(record)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }));
}

export default function DemographicsTab() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DemoStats | null>(null);
  const [rawRows, setRawRows] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .not('status', 'eq', 'cancelled')
      .order('booking_date', { ascending: false });

    const rows = (data || []).filter((b) => {
      const meta = parseMeta(b.notes);
      return Boolean(meta.onsiteStartConfirmed);
    });
    setRawRows(rows);

    const s: DemoStats = {
      total: 0,
      byAgeGroup: {},
      bySex: {},
      byNationality: {},
      byCity: {},
    };

    for (const b of rows) {
      const meta = parseMeta(b.notes);
      const groupSize = b.group_size || 1;
      s.total += groupSize;

      // Main hiker
      const ag = ageGroup(meta.age);
      s.byAgeGroup[ag] = (s.byAgeGroup[ag] || 0) + 1;

      const sex = meta.sex === 'male' ? 'Male'
        : meta.sex === 'female' ? 'Female'
        : 'Prefer not to say';
      s.bySex[sex] = (s.bySex[sex] || 0) + 1;

      const nat = meta.nationality || 'Filipino';
      s.byNationality[nat] = (s.byNationality[nat] || 0) + 1;

      const city = [meta.city, meta.province].filter(Boolean).join(', ') || 'Not specified';
      s.byCity[city] = (s.byCity[city] || 0) + 1;

      // Companions
      const companions = meta.companionDetails || [];
      for (const c of companions) {
        const cag = ageGroup(c.age);
        s.byAgeGroup[cag] = (s.byAgeGroup[cag] || 0) + 1;

        const csex = c.sex === 'male' ? 'Male' : c.sex === 'female' ? 'Female' : 'Prefer not to say';
        s.bySex[csex] = (s.bySex[csex] || 0) + 1;

        const cnat = c.nationality || 'Filipino';
        s.byNationality[cnat] = (s.byNationality[cnat] || 0) + 1;

        if (c.city) {
          s.byCity[c.city] = (s.byCity[c.city] || 0) + 1;
        }
      }
    }

    setStats(s);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const handleExport = () => {
    if (!stats) return;

    const hikerRows = rawRows.map((b) => {
      const meta = parseMeta(b.notes);
      return {
        'Booking ID': b.id,
        'Booking Date': b.booking_date,
        'Status': b.status,
        'Group Size': b.group_size,
        'Full Name': meta.fullName || b.emergency_contact_name || '',
        'Age': meta.age || '',
        'Age Group': ageGroup(meta.age),
        'Sex': meta.sex || '',
        'Nationality': meta.nationality || 'Filipino',
        'City': meta.city || '',
        'Province': meta.province || '',
        'Hike Type': meta.hikeType || '',
        'Start Time': meta.hikeTime || '',
        'Email': meta.emailAddress || '',
        'Phone': meta.phoneNumber || '',
        'Payment Status': meta.paymentStatus || 'unpaid',
      };
    });

    const companionRows: Record<string, unknown>[] = [];
    for (const b of rawRows) {
      const meta = parseMeta(b.notes);
      const companions = meta.companionDetails || [];
      for (const [i, c] of companions.entries()) {
        companionRows.push({
          'Booking ID': b.id,
          'Booking Date': b.booking_date,
          'Companion #': i + 1,
          'Name': c.name,
          'Age': c.age || '',
          'Age Group': ageGroup(c.age),
          'Sex': c.sex || '',
          'Nationality': c.nationality || '',
          'City': c.city || '',
        });
      }
    }

    const ageRows = toChartData(stats.byAgeGroup, 20).map(({ name, value }) => ({
      'Age Group': name, 'Visitor Count': value,
    }));
    const sexRows = toChartData(stats.bySex, 10).map(({ name, value }) => ({
      'Sex': name, 'Visitor Count': value,
    }));
    const natRows = toChartData(stats.byNationality, 30).map(({ name, value }) => ({
      'Nationality': name, 'Visitor Count': value,
    }));
    const cityRows = toChartData(stats.byCity, 50).map(({ name, value }) => ({
      'City / Province': name, 'Visitor Count': value,
    }));

    const summaryRows = [
      { Metric: 'Generated At', Value: new Date().toLocaleString('en-PH') },
      { Metric: 'Dataset Scope', Value: 'Started / onsite-confirmed bookings only' },
      { Metric: 'Total Visitors', Value: stats.total },
      { Metric: 'Started Bookings', Value: rawRows.length },
      { Metric: 'Distinct Nationalities', Value: Object.keys(stats.byNationality).length },
      { Metric: 'Distinct Origin Cities', Value: Object.keys(stats.byCity).length },
    ];

    exportToExcelMultiSheet([
      { name: 'Summary', rows: summaryRows },
      { name: 'All Bookings', rows: hikerRows },
      { name: 'Companions', rows: companionRows },
      { name: 'Age Groups', rows: ageRows },
      { name: 'By Sex', rows: sexRows },
      { name: 'By Nationality', rows: natRows },
      { name: 'By Location', rows: cityRows },
    ], `mt-kalisungan-demographics-${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Visitor Demographics</h2>
          <p className="text-sm text-muted-foreground">
            Age groups, sex, nationality, and origin breakdown of started/onsite-confirmed visitors only.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </Button>
          <Button size="sm" onClick={handleExport} disabled={!stats} className="gap-1.5">
            <FileDown className="h-3.5 w-3.5" /> Export Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : stats ? (
        <>
          {/* Summary stat */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Visitors', value: stats.total, icon: Users, color: 'text-primary' },
              { label: 'Nationalities', value: Object.keys(stats.byNationality).length, icon: Globe, color: 'text-sky-500' },
              { label: 'Origin Cities', value: Object.keys(stats.byCity).length, icon: MapPin, color: 'text-amber-500' },
              { label: 'Started Bookings', value: rawRows.length, icon: BarChart2, color: 'text-purple-500' },
            ].map((s) => (
              <Card key={s.label} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-bold mt-1">{s.value}</p>
                    </div>
                    <s.icon className={cn('h-7 w-7 opacity-60', s.color)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Age Groups Chart */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Visitors by Age Group
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={toChartData(stats.byAgeGroup)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(155 15% 18%)" />
                    <XAxis type="number" fontSize={11} stroke="hsl(150 10% 55%)" />
                    <YAxis type="category" dataKey="name" width={140} fontSize={10} stroke="hsl(150 10% 55%)" />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="value" name="Visitors" fill="hsl(152 60% 42%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sex Distribution */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-sky-500" /> Visitors by Sex
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={toChartData(stats.bySex)} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {toChartData(stats.bySex).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Nationality Chart */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-amber-500" /> Visitors by Nationality (Top 10)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={toChartData(stats.byNationality, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(155 15% 18%)" />
                    <XAxis dataKey="name" fontSize={10} stroke="hsl(150 10% 55%)" angle={-30} textAnchor="end" height={50} />
                    <YAxis fontSize={11} stroke="hsl(150 10% 55%)" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                    <Bar dataKey="value" name="Visitors" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* City/Province Chart */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-purple-500" /> Top Origin Cities (Top 10)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {toChartData(stats.byCity, 10).map(({ name, value }, i) => {
                    const maxVal = toChartData(stats.byCity, 1)[0]?.value || 1;
                    return (
                      <div key={name} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-5 shrink-0 tabular-nums">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-medium truncate">{name}</span>
                            <Badge variant="outline" className="text-[10px] ml-2 shrink-0">{value}</Badge>
                          </div>
                          <div className="h-1.5 bg-secondary/60 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-purple-500/70"
                              style={{ width: `${(value / maxVal) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-muted-foreground">No data available.</div>
      )}
    </div>
  );
}
