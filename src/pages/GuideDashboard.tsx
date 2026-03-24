import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CalendarCheck,
  Users,
  Mountain,
  Phone,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Clock,
  MapPin,
  Bell,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { parseMeta } from '@/lib/bookingMeta';
import { format } from 'date-fns';

export default function GuideDashboard() {
  const { user } = useAuth();
  const [assignedBookings, setAssignedBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  /* ── Load bookings assigned to this guide ──
     We match by looking for the guide's name stored in meta.assignedGuide.
     In production this would use a proper guide_id column.
  */
  useEffect(() => {
    if (!user) return;
    loadAssigned();
  }, [user]);

  const loadAssigned = async () => {
    setLoading(true);
    // Fetch confirmed bookings and filter by assignedGuide in meta
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'confirmed')
      .order('booking_date', { ascending: true });

    // Get guide's own display name from profiles
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user!.id)
      .single();

    const guideName = profileData?.full_name ?? '';

    // Filter bookings where this guide is assigned
    const mine = (data || []).filter((b: any) => {
      const meta = parseMeta(b.notes);
      return (
        guideName &&
        meta.assignedGuide &&
        meta.assignedGuide.toLowerCase().includes(guideName.toLowerCase())
      );
    });

    setAssignedBookings(mine);
    setLoading(false);
  };

  const upcoming = assignedBookings.filter((b) => new Date(b.booking_date) >= new Date());
  const past = assignedBookings.filter((b) => new Date(b.booking_date) < new Date());

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">
            Guide <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="text-muted-foreground mb-8">
            Your assigned hiking groups for Mount Kalisungan.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Assigned', value: assignedBookings.length, icon: CalendarCheck, color: 'text-primary' },
            { label: 'Upcoming', value: upcoming.length, icon: Clock, color: 'text-sky-500' },
            { label: 'Completed', value: past.length, icon: CheckCircle2, color: 'text-primary' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="glass-card">
                <CardContent className="p-5 flex items-center gap-3">
                  <s.icon className={`h-7 w-7 ${s.color} opacity-60 flex-shrink-0`} />
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Notification tip */}
        {upcoming.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-sm"
          >
            <Bell className="h-4 w-4 text-primary flex-shrink-0" />
            <span>
              You have <strong>{upcoming.length}</strong> upcoming group{upcoming.length > 1 ? 's' : ''} assigned. Be at the trailhead 30 minutes before start time.
            </span>
          </motion.div>
        )}

        {/* Upcoming */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-sky-500" /> Upcoming Assignments
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : upcoming.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="text-center py-12">
                <Mountain className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No upcoming assignments yet. Admin will assign you to a group.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcoming.map((b) => {
                const meta = parseMeta(b.notes);
                return (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card className="glass-card border-primary/20">
                      <CardContent className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-3 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="bg-primary/20 text-primary border-primary/30">
                                Assigned to You
                              </Badge>
                              <span className="text-xs text-muted-foreground">Booking #{b.id.slice(0, 8)}</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-start gap-2">
                                <CalendarCheck className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Date</p>
                                  <p className="font-semibold">{b.booking_date}</p>
                                </div>
                              </div>
                              {meta.adjustedTime && (
                                <div className="flex items-start gap-2">
                                  <Clock className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Start Time</p>
                                    <p className="font-semibold">{meta.adjustedTime}</p>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-start gap-2">
                                <Users className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Group Size</p>
                                  <p className="font-semibold">{b.group_size} pax</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Trail</p>
                                  <p className="font-semibold">Mt. Kalisungan</p>
                                </div>
                              </div>
                            </div>

                            {/* Emergency contact */}
                            <div className="rounded-lg bg-secondary/30 border border-border/20 p-3 flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-destructive flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Emergency Contact</p>
                                  <p className="font-semibold">{b.emergency_contact_name || '—'}</p>
                                </div>
                              </div>
                              {b.emergency_contact_phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Phone</p>
                                    <a
                                      href={`tel:${b.emergency_contact_phone}`}
                                      className="font-semibold text-primary hover:underline"
                                    >
                                      {b.emergency_contact_phone}
                                    </a>
                                  </div>
                                </div>
                              )}
                              {meta.userNotes && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Hiker Notes</p>
                                  <p className="font-medium">{meta.userNotes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {past.length > 0 && (
          <Button variant="outline" onClick={() => setShowHistoryPanel(true)}>
            View Completed Assignment History
          </Button>
        )}

        {showHistoryPanel && (
          <div className="fixed right-4 top-24 z-40 w-[420px] max-w-[92vw]">
            <Card className="glass-card border-primary/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" /> Completed Assignments
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setShowHistoryPanel(false)}>Close</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
                  {past.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-xl bg-secondary/20 border border-border/10 text-sm opacity-80"
                    >
                      <div className="flex items-center gap-4">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="font-medium">{b.booking_date}</span>
                        <span className="text-muted-foreground">{b.group_size} pax</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Completed</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
