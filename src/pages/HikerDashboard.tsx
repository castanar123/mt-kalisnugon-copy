import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CalendarCheck, Map, Bot, Mountain, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';

export default function HikerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('bookings').select('*').eq('user_id', user.id).order('booking_date', { ascending: false }),
      supabase.from('hiker_sessions').select('*').eq('user_id', user.id).order('start_time', { ascending: false }),
    ]).then(([{ data: b }, { data: s }]) => {
      setBookings(b || []);
      setSessions(s || []);
    });
  }, [user]);

  const totalDistance = sessions.reduce((sum, s) => sum + Number(s.total_distance_km || 0), 0);

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">Hiker <span className="text-gradient">Dashboard</span></h1>
          <p className="text-muted-foreground mb-8">Your hiking journey on Mount Kalisungan.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'My Bookings', value: bookings.length, icon: CalendarCheck },
            { label: 'Hikes Completed', value: sessions.filter((s) => s.status === 'completed').length, icon: Mountain },
            { label: 'Total Distance', value: `${totalDistance.toFixed(1)} km`, icon: Map },
            { label: 'Active Hike', value: sessions.some((s) => s.status === 'active') ? 'Yes' : 'No', icon: Mountain },
          ].map((s, i) => (
            <Card key={s.label} className="glass-card">
              <CardContent className="p-5">
                <s.icon className="h-6 w-6 text-primary mb-2 opacity-60" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Button asChild variant="outline" className="h-auto py-6 flex-col gap-2 glass-card">
            <Link to="/map"><Map className="h-6 w-6 text-primary" /> Open Trail Map</Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-6 flex-col gap-2 glass-card">
            <Link to="/chat"><Bot className="h-6 w-6 text-primary" /> AI Assistant</Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-6 flex-col gap-2 glass-card">
            <Link to="/booking"><CalendarCheck className="h-6 w-6 text-primary" /> Book a Hike</Link>
          </Button>
        </div>

        {/* Bookings */}
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><QrCode className="h-5 w-5 text-primary" /> My Bookings</CardTitle></CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-4">No bookings yet. Book your first hike!</p>
                <Button asChild><Link to="/booking">Book Now</Link></Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookings.map((b) => (
                  <div key={b.id} className="p-4 rounded-xl bg-secondary/30 border border-border/20 text-center">
                    <div className="mb-3">
                      <QRCodeSVG value={b.qr_code_data || b.id} size={100} bgColor="transparent" fgColor="hsl(140,20%,92%)" />
                    </div>
                    <p className="font-semibold">{b.booking_date}</p>
                    <p className="text-xs text-muted-foreground">{b.group_size} pax</p>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs ${
                      b.status === 'confirmed' ? 'bg-primary/20 text-primary' : 'bg-warning/20 text-warning'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
