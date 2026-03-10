import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Mountain, CalendarCheck, Activity, AlertTriangle, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import TrailRecorder from '@/components/map/TrailRecorder';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7'];

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalBookings: 0, activeHikers: 0, totalZones: 5, todayVisitors: 0 });
  const [bookings, setBookings] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [{ count: totalBookings }, { count: activeHikers }, { data: bookingsData }, { data: zonesData }] = await Promise.all([
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('hiker_sessions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('trail_zones').select('*'),
    ]);

    setStats({
      totalBookings: totalBookings || 0,
      activeHikers: activeHikers || 0,
      totalZones: zonesData?.length || 5,
      todayVisitors: bookingsData?.filter((b: any) => b.booking_date === new Date().toISOString().split('T')[0]).length || 0,
    });
    setBookings(bookingsData || []);
    setZones(zonesData || []);
  };

  // Mock analytics data for charts
  const weeklyData = [
    { day: 'Mon', visitors: 45 }, { day: 'Tue', visitors: 32 },
    { day: 'Wed', visitors: 58 }, { day: 'Thu', visitors: 41 },
    { day: 'Fri', visitors: 67 }, { day: 'Sat', visitors: 89 },
    { day: 'Sun', visitors: 76 },
  ];

  const trailData = zones.map((z: any, i: number) => ({
    name: z.name, value: z.max_capacity, color: COLORS[i % COLORS.length],
  }));

  const statCards = [
    { label: 'Total Bookings', value: stats.totalBookings, icon: CalendarCheck, color: 'text-primary' },
    { label: 'Active Hikers', value: stats.activeHikers, icon: Activity, color: 'text-sky' },
    { label: 'Today Visitors', value: stats.todayVisitors, icon: Users, color: 'text-warning' },
    { label: 'Trail Zones', value: stats.totalZones, icon: Mountain, color: 'text-primary' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">Admin <span className="text-gradient">Dashboard</span></h1>
          <p className="text-muted-foreground mb-8">Monitor real-time hiker activity, manage zones, and review analytics.</p>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="glass-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-3xl font-bold mt-1">{s.value}</p>
                    </div>
                    <s.icon className={`h-8 w-8 ${s.color} opacity-60`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Visitor Chart */}
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-lg">Weekly Visitors</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(155 15% 18%)" />
                  <XAxis dataKey="day" stroke="hsl(150 10% 55%)" fontSize={12} />
                  <YAxis stroke="hsl(150 10% 55%)" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'hsl(160 12% 10%)', border: '1px solid hsl(155 15% 18%)', borderRadius: '8px', color: 'hsl(140 20% 92%)' }} />
                  <Bar dataKey="visitors" fill="hsl(152 60% 42%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trail Distribution */}
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-lg">Trail Capacity Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={trailData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name }) => name}>
                    {trailData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(160 12% 10%)', border: '1px solid hsl(155 15% 18%)', borderRadius: '8px', color: 'hsl(140 20% 92%)' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Trail Route Editor */}
        <div className="mb-8">
          <TrailRecorder
            existingTrails={zones.map((z: any) => ({ id: z.id, name: z.name, coordinates_json: z.coordinates_json }))}
            onSaved={loadData}
          />
        </div>

        {/* Zone Management */}
        <Card className="glass-card mb-8">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Zone Management</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 text-muted-foreground">
                    <th className="text-left py-2 px-3">Zone</th>
                    <th className="text-left py-2 px-3">Difficulty</th>
                    <th className="text-left py-2 px-3">Elevation</th>
                    <th className="text-left py-2 px-3">Capacity</th>
                    <th className="text-left py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((z: any) => (
                    <tr key={z.id} className="border-b border-border/10">
                      <td className="py-3 px-3 font-medium">{z.name}</td>
                      <td className="py-3 px-3 capitalize">{z.difficulty}</td>
                      <td className="py-3 px-3">{z.elevation_meters}m</td>
                      <td className="py-3 px-3">{z.max_capacity}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${z.status === 'active' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                          {z.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-primary" /> Recent Bookings</CardTitle></CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No bookings yet. They will appear here once hikers start booking.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 text-muted-foreground">
                      <th className="text-left py-2 px-3">Date</th>
                      <th className="text-left py-2 px-3">Group</th>
                      <th className="text-left py-2 px-3">Status</th>
                      <th className="text-left py-2 px-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b: any) => (
                      <tr key={b.id} className="border-b border-border/10">
                        <td className="py-3 px-3">{b.booking_date}</td>
                        <td className="py-3 px-3">{b.group_size} pax</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${b.status === 'confirmed' ? 'bg-primary/20 text-primary' : 'bg-warning/20 text-warning'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
