import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Mountain,
  CalendarCheck,
  Activity,
  MapPin,
  Megaphone,
  UserCog,
  LayoutDashboard,
  Loader2,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  ClipboardList,
  UserCheck,
  CalendarClock,
  XCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { parseMeta, encodeMeta } from '@/lib/bookingMeta';
import { addAnnouncement, loadAnnouncements, removeAnnouncement, type AdminAnnouncement } from '@/lib/announcements';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import TrailRecorder from '@/components/map/TrailRecorder';
import { format } from 'date-fns';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7'];

/* ── Mock guide data (replace with Supabase when guide profiles table is ready) ── */
const MOCK_GUIDES = [
  { id: 'g1', name: 'Rodel Manalansan', phone: '+63 912 345 6789', status: 'available', trail: 'Summit Trail', totalHikes: 48 },
  { id: 'g2', name: 'Bong Villarosa', phone: '+63 917 234 5678', status: 'on-duty', trail: 'Ridge Route', totalHikes: 62 },
  { id: 'g3', name: 'Nilo Santos', phone: '+63 918 876 5432', status: 'available', trail: 'Scenic Loop', totalHikes: 35 },
  { id: 'g4', name: 'Allan Reyes', phone: '+63 921 456 7890', status: 'off-duty', trail: '—', totalHikes: 27 },
];

const GUIDE_STATUS_STYLES: Record<string, string> = {
  available: 'bg-primary/20 text-primary',
  'on-duty': 'bg-sky-500/20 text-sky-600 dark:text-sky-400',
  'off-duty': 'bg-muted text-muted-foreground',
};

const ANNOUNCEMENT_TYPE_STYLES: Record<string, string> = {
  info: 'bg-primary/10 text-primary border-primary/30',
  warning: 'bg-warning/10 text-yellow-700 dark:text-yellow-400 border-warning/30',
  closure: 'bg-destructive/10 text-destructive border-destructive/30',
};

export default function AdminDashboard() {
  /* ── Overview state ── */
  const [stats, setStats] = useState({ totalBookings: 0, activeHikers: 0, totalZones: 5, todayVisitors: 0 });
  const [bookings, setBookings] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);

  /* ── Announcements state ── */
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annType, setAnnType] = useState<'info' | 'warning' | 'closure'>('info');
  const [annImportant, setAnnImportant] = useState(false);
  const [annStartDate, setAnnStartDate] = useState('');
  const [annEndDate, setAnnEndDate] = useState('');
  const [annSending, setAnnSending] = useState(false);

  /* ── Guide state ── */
  const [guides, setGuides] = useState(MOCK_GUIDES);

  /* ── Booking Requests state ── */
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  /* ── Capacity Management state ── */
  const [capDate, setCapDate] = useState('');
  const [capMax, setCapMax] = useState(100);
  const [capRangeStart, setCapRangeStart] = useState('');
  const [capRangeEnd, setCapRangeEnd] = useState('');
  const [capSaving, setCapSaving] = useState(false);
  const [upcomingCapacities, setUpcomingCapacities] = useState<any[]>([]);

  // Accept flow
  const [acceptDialogId, setAcceptDialogId] = useState<string | null>(null);
  const [selectedGuide, setSelectedGuide] = useState('');
  const [acceptSaving, setAcceptSaving] = useState(false);

  // Adjust flow
  const [adjustDialogId, setAdjustDialogId] = useState<string | null>(null);
  const [adjustDate, setAdjustDate] = useState('');
  const [adjustTime, setAdjustTime] = useState('06:00 AM');
  const [adjustSaving, setAdjustSaving] = useState(false);

  useEffect(() => {
    loadData();
    loadPendingBookings();
    loadUpcomingCapacities();
    setAnnouncements(loadAnnouncements());
  }, []);

  /* ── Capacity Management ── */
  const loadUpcomingCapacities = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data } = await supabase
      .from('daily_capacity')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(60);
    setUpcomingCapacities(data || []);
  };

  const saveCapacity = async () => {
    if (!capDate) { toast.error('Please select a date.'); return; }
    if (capMax < 1) { toast.error('Max capacity must be at least 1.'); return; }
    setCapSaving(true);
    const { error } = await supabase
      .from('daily_capacity')
      .upsert({ date: capDate, max_capacity: capMax }, { onConflict: 'date' });
    if (error) {
      toast.error('Failed to save: ' + error.message);
    } else {
      toast.success(`✅ Capacity for ${capDate} set to ${capMax} hikers.`);
      setCapDate('');
      setCapMax(100);
      loadUpcomingCapacities();
    }
    setCapSaving(false);
  };

  const saveCapacityRange = async () => {
    if (!capRangeStart || !capRangeEnd) {
      toast.error('Please select both start and end dates.');
      return;
    }
    if (capMax < 1) {
      toast.error('Max capacity must be at least 1.');
      return;
    }
    const start = new Date(`${capRangeStart}T00:00:00`);
    const end = new Date(`${capRangeEnd}T00:00:00`);
    if (end < start) {
      toast.error('End date must be after start date.');
      return;
    }

    const rows: Array<{ date: string; max_capacity: number }> = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      rows.push({ date: format(cursor, 'yyyy-MM-dd'), max_capacity: capMax });
      cursor.setDate(cursor.getDate() + 1);
    }

    setCapSaving(true);
    const { error } = await supabase.from('daily_capacity').upsert(rows, { onConflict: 'date' });
    if (error) {
      toast.error('Failed bulk update: ' + error.message);
    } else {
      toast.success(`Updated ${rows.length} day(s) to ${capMax} hikers/day.`);
      setCapRangeStart('');
      setCapRangeEnd('');
      loadUpcomingCapacities();
    }
    setCapSaving(false);
  };

  const deleteCapacityLimit = async (id: string) => {
    const { error } = await supabase.from('daily_capacity').delete().eq('id', id);
    if (error) toast.error('Failed to remove: ' + error.message);
    else {
      toast.success('Capacity limit removed (reverts to default 100).');
      loadUpcomingCapacities();
    }
  };

  const loadPendingBookings = async () => {
    setPendingLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .in('status', ['pending', 'adjustment_pending'])
      .order('created_at', { ascending: true });
    setPendingBookings(data || []);
    setPendingLoading(false);
  };

  /* ── Accept booking + assign guide ── */
  const handleAcceptBooking = async () => {
    if (!acceptDialogId || !selectedGuide) return;
    setAcceptSaving(true);
    const booking = pendingBookings.find((b) => b.id === acceptDialogId);
    const meta = parseMeta(booking?.notes);
    const updatedMeta = encodeMeta({ ...meta, assignedGuide: selectedGuide });
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'confirmed', notes: updatedMeta })
      .eq('id', acceptDialogId);
    if (error) {
      toast.error('Failed to accept booking');
    } else {
      toast.success(`✅ Booking accepted! Guide "${selectedGuide}" assigned and notified.`);
      setPendingBookings((prev) => prev.filter((b) => b.id !== acceptDialogId));
      setAcceptDialogId(null);
      setSelectedGuide('');
    }
    setAcceptSaving(false);
  };

  /* ── Adjust booking date/time ── */
  const handleAdjustBooking = async () => {
    if (!adjustDialogId || !adjustDate) return;
    setAdjustSaving(true);
    const booking = pendingBookings.find((b) => b.id === adjustDialogId);
    const meta = parseMeta(booking?.notes);
    const updatedMeta = encodeMeta({ ...meta, adjustedDate: adjustDate, adjustedTime: adjustTime });
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'adjustment_pending', notes: updatedMeta })
      .eq('id', adjustDialogId);
    if (error) {
      toast.error('Failed to adjust booking');
    } else {
      toast.success('📅 Booking adjustment proposed. Hiker will be notified to confirm.');
      setPendingBookings((prev) => prev.filter((b) => b.id !== adjustDialogId));
      setAdjustDialogId(null);
      setAdjustDate('');
    }
    setAdjustSaving(false);
  };

  /* ── Reject booking ── */
  const handleRejectBooking = async (bookingId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);
    if (error) toast.error('Failed to reject booking');
    else {
      toast.success('Booking rejected and cancelled.');
      setPendingBookings((prev) => prev.filter((b) => b.id !== bookingId));
    }
  };

  const loadData = async () => {
    const [
      { count: totalBookings },
      { count: activeHikers },
      { data: bookingsData },
      { data: zonesData },
    ] = await Promise.all([
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('hiker_sessions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('trail_zones').select('*'),
    ]);

    setStats({
      totalBookings: totalBookings || 0,
      activeHikers: activeHikers || 0,
      totalZones: zonesData?.length || 5,
      todayVisitors:
        bookingsData?.filter(
          (b: any) => b.booking_date === new Date().toISOString().split('T')[0]
        ).length || 0,
    });
    setBookings(bookingsData || []);
    setZones(zonesData || []);
  };

  /* ── Weekly mock data ── */
  const weeklyData = [
    { day: 'Mon', visitors: 45 },
    { day: 'Tue', visitors: 32 },
    { day: 'Wed', visitors: 58 },
    { day: 'Thu', visitors: 41 },
    { day: 'Fri', visitors: 67 },
    { day: 'Sat', visitors: 89 },
    { day: 'Sun', visitors: 76 },
  ];

  const trailData = zones.map((z: any, i: number) => ({
    name: z.name,
    value: z.max_capacity,
    color: COLORS[i % COLORS.length],
  }));

  const statCards = [
    { label: 'Total Bookings', value: stats.totalBookings, icon: CalendarCheck, color: 'text-primary' },
    { label: 'Active Hikers', value: stats.activeHikers, icon: Activity, color: 'text-sky-500' },
    { label: 'Today Visitors', value: stats.todayVisitors, icon: Users, color: 'text-warning' },
    { label: 'Trail Zones', value: stats.totalZones, icon: Mountain, color: 'text-primary' },
  ];

  /* ── Post announcement ── */
  const postAnnouncement = async () => {
    if (!annTitle.trim() || !annBody.trim()) {
      toast.error('Please fill in title and message.');
      return;
    }
    setAnnSending(true);
    await new Promise((r) => setTimeout(r, 800)); // Simulate API call
    const startsAt = annStartDate ? new Date(`${annStartDate}T00:00:00`).toISOString() : undefined;
    const expiresAt = annEndDate ? new Date(`${annEndDate}T23:59:59`).toISOString() : undefined;
    const newAnn: AdminAnnouncement = {
      id: Date.now().toString(),
      title: annTitle.trim(),
      body: annBody.trim(),
      type: annType,
      created_at: new Date().toISOString(),
      isImportant: annImportant || annType === 'warning' || annType === 'closure',
      starts_at: startsAt,
      expires_at: expiresAt,
    };
    setAnnouncements(addAnnouncement(newAnn));
    setAnnTitle('');
    setAnnBody('');
    setAnnType('info');
    setAnnImportant(false);
    setAnnStartDate('');
    setAnnEndDate('');
    setAnnSending(false);
    toast.success('Announcement posted!');
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(removeAnnouncement(id));
    toast.success('Announcement removed.');
  };

  /* ── Toggle guide status ── */
  const cycleGuideStatus = (id: string) => {
    const cycle: Record<string, 'available' | 'on-duty' | 'off-duty'> = {
      available: 'on-duty',
      'on-duty': 'off-duty',
      'off-duty': 'available',
    };
    setGuides((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status: cycle[g.status] } : g))
    );
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">
            Admin <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="text-muted-foreground mb-8">
            Monitor real-time hiker activity, manage zones, announcements, and guides.
          </p>
        </motion.div>

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="glass-card gap-1 h-auto flex-wrap p-1">
            <TabsTrigger value="requests" className="gap-1.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary relative">
              <ClipboardList className="h-3.5 w-3.5" /> Booking Requests
              {pendingBookings.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingBookings.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="overview" className="gap-1.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <LayoutDashboard className="h-3.5 w-3.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-1.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Megaphone className="h-3.5 w-3.5" /> Announcements
            </TabsTrigger>
            <TabsTrigger value="guides" className="gap-1.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <UserCog className="h-3.5 w-3.5" /> Guide Management
            </TabsTrigger>
            <TabsTrigger value="capacity" className="gap-1.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Daily Capacity
            </TabsTrigger>
          </TabsList>

          {/* ─────────────────────────────── BOOKING REQUESTS TAB ── */}
          <TabsContent value="requests" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Pending Booking Requests</h2>
                <p className="text-sm text-muted-foreground">Review, approve, assign guides, or adjust schedules.</p>
              </div>
              <Button variant="outline" size="sm" onClick={loadPendingBookings} disabled={pendingLoading} className="gap-1.5">
                {pendingLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
                Refresh
              </Button>
            </div>

            {pendingLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : pendingBookings.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle2 className="h-12 w-12 text-primary/30 mx-auto mb-3" />
                <p className="text-muted-foreground">All bookings are reviewed. No pending requests.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingBookings.map((b) => {
                  const meta = parseMeta(b.notes);
                  const isAdjusted = b.status === 'adjustment_pending';
                  return (
                    <Card key={b.id} className={`glass-card ${isAdjusted ? 'border-sky-500/30' : 'border-warning/20'}`}>
                      <CardContent className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          {/* Booking info */}
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                isAdjusted
                                  ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400'
                                  : 'bg-warning/20 text-warning'
                              }`}>
                                {isAdjusted ? '⏳ Awaiting Hiker Confirmation' : '🆕 New Request'}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">{b.id.slice(0, 8)}…</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">Booking Date</p>
                                <p className="font-semibold">{b.booking_date}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Group Size</p>
                                <p className="font-semibold">{b.group_size} pax</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Emergency Contact</p>
                                <p className="font-semibold truncate">{b.emergency_contact_name || '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Phone</p>
                                <p className="font-semibold">{b.emergency_contact_phone || '—'}</p>
                              </div>
                              {meta.userNotes && (
                                <div className="col-span-2">
                                  <p className="text-xs text-muted-foreground">Notes</p>
                                  <p className="font-semibold truncate">{meta.userNotes}</p>
                                </div>
                              )}
                              {meta.adjustedDate && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Proposed New Date</p>
                                  <p className="font-semibold text-primary">{meta.adjustedDate}</p>
                                </div>
                              )}
                              {meta.assignedGuide && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Assigned Guide</p>
                                  <p className="font-semibold">{meta.assignedGuide}</p>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Submitted: {new Date(b.created_at).toLocaleString()}
                            </p>
                          </div>

                          {/* Action buttons */}
                          {!isAdjusted && (
                            <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
                              <Button
                                size="sm"
                                className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                                onClick={() => { setAcceptDialogId(b.id); setSelectedGuide(''); }}
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                Accept & Assign Guide
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
                                onClick={() => { setAdjustDialogId(b.id); setAdjustDate(b.booking_date); }}
                              >
                                <CalendarClock className="h-3.5 w-3.5" />
                                Adjust Date/Time
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    Reject
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reject this booking?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      The booking for <strong>{b.booking_date}</strong> ({b.group_size} pax) will be cancelled. The hiker will be notified.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => handleRejectBooking(b.id)}
                                    >
                                      Yes, Reject
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Accept + Assign Guide Dialog */}
            {acceptDialogId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4">
                <Card className="glass-card w-full max-w-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-primary" />
                      Accept & Assign Guide
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Select an available guide to assign to this booking. The guide will be notified.
                    </p>
                    <div className="space-y-2">
                      <Label>Assign Guide</Label>
                      <Select value={selectedGuide} onValueChange={setSelectedGuide}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a guide…" />
                        </SelectTrigger>
                        <SelectContent>
                          {guides
                            .filter((g) => g.status !== 'off-duty')
                            .map((g) => (
                              <SelectItem key={g.id} value={g.name}>
                                {g.name} — <span className="capitalize">{g.status}</span> ({g.trail})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setAcceptDialogId(null)}
                        disabled={acceptSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 gap-2"
                        onClick={handleAcceptBooking}
                        disabled={!selectedGuide || acceptSaving}
                      >
                        {acceptSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Confirm & Notify Guide
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Adjust Date Dialog */}
            {adjustDialogId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4">
                <Card className="glass-card w-full max-w-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarClock className="h-5 w-5 text-sky-500" />
                      Adjust Booking Date/Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Propose a new schedule. The hiker will be asked to confirm or decline.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="adjustDate">New Date</Label>
                      <Input
                        id="adjustDate"
                        type="date"
                        value={adjustDate}
                        onChange={(e) => setAdjustDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>New Start Time</Label>
                      <Select value={adjustTime} onValueChange={setAdjustTime}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['05:00 AM', '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM'].map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setAdjustDialogId(null)}
                        disabled={adjustSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 gap-2"
                        onClick={handleAdjustBooking}
                        disabled={!adjustDate || adjustSaving}
                      >
                        {adjustSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
                        Send to Hiker for Confirmation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ─────────────────────────────── OVERVIEW TAB ── */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
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

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Weekly Visitor Chart */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Weekly Visitors</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(155 15% 18%)" />
                      <XAxis dataKey="day" stroke="hsl(150 10% 55%)" fontSize={12} />
                      <YAxis stroke="hsl(150 10% 55%)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))',
                        }}
                      />
                      <Bar dataKey="visitors" fill="hsl(152 60% 42%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Trail Distribution */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Trail Capacity Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={trailData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        label={({ name }) => name}
                      >
                        {trailData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Trail Route Editor */}
            <TrailRecorder
              existingTrails={zones.map((z: any) => ({
                id: z.id,
                name: z.name,
                coordinates_json: z.coordinates_json,
              }))}
              onSaved={loadData}
            />

            {/* Zone Management */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Zone Management
                </CardTitle>
              </CardHeader>
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
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                z.status === 'active'
                                  ? 'bg-primary/20 text-primary'
                                  : 'bg-destructive/20 text-destructive'
                              }`}
                            >
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
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-primary" /> Recent Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    No bookings yet.
                  </p>
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
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs ${
                                  b.status === 'confirmed'
                                    ? 'bg-primary/20 text-primary'
                                    : b.status === 'cancelled'
                                    ? 'bg-destructive/20 text-destructive'
                                    : 'bg-warning/20 text-warning'
                                }`}
                              >
                                {b.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-muted-foreground">
                              {new Date(b.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─────────────────────────────── ANNOUNCEMENTS TAB ── */}
          <TabsContent value="announcements" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Post form */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-primary" /> Post Announcement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={annType} onValueChange={(v) => setAnnType(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">ℹ️ Info / General</SelectItem>
                        <SelectItem value="warning">⚠️ Weather Warning</SelectItem>
                        <SelectItem value="closure">🚫 Trail Closure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="annTitle">Title</Label>
                    <Input
                      id="annTitle"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="e.g. Trail Closure Notice"
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="annBody">Message</Label>
                    <Textarea
                      id="annBody"
                      value={annBody}
                      onChange={(e) => setAnnBody(e.target.value)}
                      placeholder="Describe the announcement in detail..."
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">{annBody.length}/500</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="annStartDate">Show From (optional)</Label>
                      <Input
                        id="annStartDate"
                        type="date"
                        value={annStartDate}
                        onChange={(e) => setAnnStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="annEndDate">Expires On (optional)</Label>
                      <Input
                        id="annEndDate"
                        type="date"
                        value={annEndDate}
                        onChange={(e) => setAnnEndDate(e.target.value)}
                        min={annStartDate || undefined}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border/20 bg-secondary/20 p-3">
                    <Checkbox
                      id="annImportant"
                      checked={annImportant}
                      onCheckedChange={(v) => setAnnImportant(!!v)}
                    />
                    <Label htmlFor="annImportant" className="text-sm cursor-pointer">
                      Mark as important (show on user dashboard)
                    </Label>
                  </div>
                  <Button className="w-full gap-2" onClick={postAnnouncement} disabled={annSending}>
                    {annSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Post Announcement
                  </Button>
                </CardContent>
              </Card>

              {/* Recent announcements */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" /> Recent Announcements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {announcements.length === 0 ? (
                    <div className="text-center py-12">
                      <Megaphone className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No announcements posted yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {announcements.map((a) => (
                        <div
                          key={a.id}
                          className={`rounded-xl border p-4 relative ${ANNOUNCEMENT_TYPE_STYLES[a.type]}`}
                        >
                          <button
                            onClick={() => deleteAnnouncement(a.id)}
                            className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"
                            aria-label="Delete announcement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="flex items-center gap-2 mb-1">
                            {a.type === 'warning' && <AlertTriangle className="h-3.5 w-3.5" />}
                            {a.type === 'closure' && <AlertTriangle className="h-3.5 w-3.5" />}
                            {a.type === 'info' && <CheckCircle2 className="h-3.5 w-3.5" />}
                            <span className="font-semibold text-sm">{a.title}</span>
                            {a.isImportant && (
                              <Badge className="text-[10px] bg-destructive/15 text-destructive border-destructive/30">
                                Important
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed opacity-90">{a.body}</p>
                          <p className="text-xs opacity-60 mt-2">
                            {format(new Date(a.created_at), 'MMM d, yyyy • h:mm a')}
                          </p>
                          {(a.starts_at || a.expires_at) && (
                            <p className="text-xs opacity-70 mt-1">
                              Visible: {a.starts_at ? format(new Date(a.starts_at), 'MMM d, yyyy') : 'Now'} - {a.expires_at ? format(new Date(a.expires_at), 'MMM d, yyyy') : 'No expiry'}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─────────────────────────────── GUIDE MANAGEMENT TAB ── */}
          <TabsContent value="guides" className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-lg font-semibold">Local Guide Roster</h2>
                <p className="text-sm text-muted-foreground">Manage guide availability and trail assignments.</p>
              </div>
              <Badge variant="outline" className="text-primary border-primary/30">
                {guides.filter((g) => g.status === 'available').length} available
              </Badge>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {guides.map((guide) => (
                <Card key={guide.id} className="glass-card">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar initial */}
                        <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-bold text-lg">
                          {guide.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold">{guide.name}</p>
                          <p className="text-xs text-muted-foreground">{guide.phone}</p>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${GUIDE_STATUS_STYLES[guide.status]}`}
                      >
                        {guide.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-secondary/30 px-3 py-2">
                        <p className="text-xs text-muted-foreground">Assigned Trail</p>
                        <p className="font-medium truncate">{guide.trail}</p>
                      </div>
                      <div className="rounded-lg bg-secondary/30 px-3 py-2">
                        <p className="text-xs text-muted-foreground">Total Hikes</p>
                        <p className="font-medium">{guide.totalHikes}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => cycleGuideStatus(guide.id)}
                      >
                        <UserCog className="h-3.5 w-3.5 mr-1.5" />
                        Change Status
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => toast.info(`Call ${guide.name}: ${guide.phone}`)}
                      >
                        Contact Guide
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Guide summary */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">Guide Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  {[
                    { label: 'Available', count: guides.filter((g) => g.status === 'available').length, color: 'text-primary' },
                    { label: 'On Duty', count: guides.filter((g) => g.status === 'on-duty').length, color: 'text-sky-500' },
                    { label: 'Off Duty', count: guides.filter((g) => g.status === 'off-duty').length, color: 'text-muted-foreground' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-secondary/30 border border-border/20 py-4">
                      <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* ─────────────────────────────── DAILY CAPACITY TAB ── */}
          <TabsContent value="capacity" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Daily Hiker Capacity</h2>
              <p className="text-sm text-muted-foreground">
                Set the maximum number of hikers allowed per day. Hikers see live availability when booking. Default is 100 if not set.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Set Capacity Form */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5 text-primary" /> Set Limit for a Date
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Choose a future date and set how many total hiker slots are available. This updates the booking calendar in real-time.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="capDate">Date</Label>
                    <Input
                      id="capDate"
                      type="date"
                      value={capDate}
                      onChange={(e) => setCapDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capMax">Max Hikers Per Day</Label>
                    <Input
                      id="capMax"
                      type="number"
                      min={1}
                      max={500}
                      value={capMax}
                      onChange={(e) => setCapMax(Math.max(1, parseInt(e.target.value) || 1))}
                      placeholder="100"
                      className="font-bold text-lg h-12"
                    />
                    <p className="text-xs text-muted-foreground">
                      Setting a lower number restricts new bookings once the count is reached.
                    </p>
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={saveCapacity}
                    disabled={capSaving || !capDate}
                  >
                    {capSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CalendarCheck className="h-4 w-4" />
                    )}
                    Save Capacity Limit
                  </Button>
                  <div className="h-px bg-border/30 my-2" />
                  <p className="text-sm font-semibold">Bulk date-range update</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="capRangeStart">Start Date</Label>
                      <Input
                        id="capRangeStart"
                        type="date"
                        value={capRangeStart}
                        onChange={(e) => setCapRangeStart(e.target.value)}
                        min={format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capRangeEnd">End Date</Label>
                      <Input
                        id="capRangeEnd"
                        type="date"
                        value={capRangeEnd}
                        onChange={(e) => setCapRangeEnd(e.target.value)}
                        min={capRangeStart || format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full gap-2"
                    onClick={saveCapacityRange}
                    disabled={capSaving || !capRangeStart || !capRangeEnd}
                  >
                    {capSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
                    Apply to Date Range
                  </Button>
                </CardContent>
              </Card>

              {/* Upcoming Limits */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-primary" /> Upcoming Limits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingCapacities.length === 0 ? (
                    <div className="text-center py-12">
                      <SlidersHorizontal className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">
                        No custom limits set. All dates use the default of 100 hikers/day.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {upcomingCapacities.map((cap) => {
                        const available = Math.max(0, cap.max_capacity - cap.current_count);
                        const ratio = cap.max_capacity > 0 ? available / cap.max_capacity : 0;
                        const statusColor =
                          available === 0
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : ratio <= 0.3
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
                        return (
                          <div
                            key={cap.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-border/20 bg-secondary/20"
                          >
                            <div className="space-y-0.5">
                              <p className="text-sm font-semibold">{cap.date}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  Booked: <strong>{cap.current_count}</strong> / {cap.max_capacity}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
                                  {available === 0 ? 'Full' : `${available} left`}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Mini capacity bar */}
                              <div className="w-16 h-1.5 rounded-full bg-border/30 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    ratio <= 0.3 ? 'bg-amber-500' : ratio === 0 ? 'bg-red-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${(cap.current_count / cap.max_capacity) * 100}%` }}
                                />
                              </div>
                              <button
                                onClick={() => deleteCapacityLimit(cap.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                                aria-label={`Remove limit for ${cap.date}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Info card */}
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="flex gap-3 items-start text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">How it works:</strong>{' '}
                    When a capacity limit is set for a date, hikers see the remaining slots live on the booking calendar.
                    Once confirmed bookings fill the limit, that date shows as "Full" and cannot be booked.
                    Deleting a limit reverts the date to the default of 100 hikers/day.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
