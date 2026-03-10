import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarCheck, Users, QrCode, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function BookingPage() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>();
  const [groupSize, setGroupSize] = useState(1);
  const [emergName, setEmergName] = useState('');
  const [emergPhone, setEmergPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [capacity, setCapacity] = useState<{ max_capacity: number; current_count: number } | null>(null);

  useEffect(() => {
    if (!date) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    supabase.from('daily_capacity').select('*').eq('date', dateStr).single().then(({ data }) => {
      if (data) setCapacity(data as any);
      else setCapacity({ max_capacity: 100, current_count: 0 });
    });
  }, [date]);

  const handleBook = async () => {
    if (!user || !date) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    if (capacity && capacity.current_count + groupSize > capacity.max_capacity) {
      toast.error('Not enough capacity for selected date');
      return;
    }

    setLoading(true);
    const qrData = `KALISUNGAN-${user.id.slice(0, 8)}-${dateStr}-${Date.now()}`;
    const { data, error } = await supabase.from('bookings').insert({
      user_id: user.id,
      booking_date: dateStr,
      group_size: groupSize,
      qr_code_data: qrData,
      emergency_contact_name: emergName,
      emergency_contact_phone: emergPhone,
      notes,
      status: 'confirmed',
    }).select().single();

    if (error) {
      toast.error(error.message);
    } else {
      setBooking(data);
      toast.success('Booking confirmed!');
      // Update capacity
      await supabase.from('daily_capacity').update({ current_count: (capacity?.current_count || 0) + groupSize }).eq('date', dateStr);
    }
    setLoading(false);
  };

  const remaining = capacity ? capacity.max_capacity - capacity.current_count : null;

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">Book Your <span className="text-gradient">Hike</span></h1>
          <p className="text-muted-foreground mb-8">Reserve your spot on Mount Kalisungan. Smart capacity management ensures a safe experience.</p>
        </motion.div>

        {booking ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="glass-card border-primary/30 max-w-md mx-auto">
              <CardHeader className="text-center">
                <CalendarCheck className="h-12 w-12 text-primary mx-auto mb-2" />
                <CardTitle className="text-gradient">Booking Confirmed!</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="bg-background/50 rounded-xl p-6 inline-block">
                  <QRCodeSVG value={booking.qr_code_data} size={180} bgColor="transparent" fgColor="hsl(140,20%,92%)" />
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>Date:</strong> {booking.booking_date}</p>
                  <p><strong>Group Size:</strong> {booking.group_size}</p>
                  <p><strong>Status:</strong> <span className="text-primary capitalize">{booking.status}</span></p>
                  <p className="text-xs text-muted-foreground mt-2">Show this QR code at the trailhead registration</p>
                </div>
                <Button variant="outline" onClick={() => setBooking(null)}>Book Another</Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-primary" /> Select Date</CardTitle></CardHeader>
              <CardContent>
                <Calendar mode="single" selected={date} onSelect={setDate} disabled={{ before: new Date() }} className="mx-auto" />
                {date && remaining !== null && (
                  <div className={`mt-4 text-center text-sm ${remaining < 20 ? 'text-warning' : 'text-primary'}`}>
                    <Users className="h-4 w-4 inline mr-1" />
                    {remaining} slots remaining for {format(date, 'MMM d, yyyy')}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><QrCode className="h-5 w-5 text-primary" /> Booking Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Group Size</Label>
                  <Input type="number" min={1} max={20} value={groupSize} onChange={(e) => setGroupSize(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Contact Name</Label>
                  <Input value={emergName} onChange={(e) => setEmergName(e.target.value)} placeholder="Contact name" />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Contact Phone</Label>
                  <Input value={emergPhone} onChange={(e) => setEmergPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special requirements..." />
                </div>
                <Button className="w-full" onClick={handleBook} disabled={!date || loading || !user}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Confirm Booking
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
