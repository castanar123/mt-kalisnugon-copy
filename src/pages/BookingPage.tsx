import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CalendarCheck,
  Users,
  QrCode,
  Loader2,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { encodeMeta } from '@/lib/bookingMeta';

const HIKE_TIMES = ['05:00 AM', '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM'];

export default function BookingPage() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>();
  const [hikeTime, setHikeTime] = useState(HIKE_TIMES[1]);
  const [groupSize, setGroupSize] = useState(1);
  const [emergName, setEmergName] = useState('');
  const [emergPhone, setEmergPhone] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [notes, setNotes] = useState('');
  const [agreedRules, setAgreedRules] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [capacity, setCapacity] = useState<{ max_capacity: number; current_count: number } | null>(null);

  useEffect(() => {
    if (!date) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    supabase
      .from('daily_capacity')
      .select('*')
      .eq('date', dateStr)
      .single()
      .then(({ data }) => {
        setCapacity(data ? (data as any) : { max_capacity: 100, current_count: 0 });
      });
  }, [date]);

  const handleBook = async () => {
    if (!user || !date) return;
    if (!agreedRules || !agreedPrivacy) {
      toast.error('Please agree to the Rules & Regulations and Privacy Policy to continue.');
      return;
    }
    if (!emergName.trim() || !emergPhone.trim()) {
      toast.error('Please provide emergency contact details.');
      return;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    if (capacity && capacity.current_count + groupSize > capacity.max_capacity) {
      toast.error('Not enough capacity for selected date.');
      return;
    }

    setLoading(true);
    const qrData = `KALISUNGAN-${user.id.slice(0, 8)}-${dateStr}-${Date.now()}`;
    const metaNotes = encodeMeta({ userNotes: notes });

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        booking_date: dateStr,
        group_size: groupSize,
        qr_code_data: qrData,
        emergency_contact_name: emergName,
        emergency_contact_phone: emergPhone,
        notes: metaNotes,
        status: 'pending',  // ← awaiting admin review
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
    } else {
      setBooking({ ...data, hikeTime, bloodType });
      toast.success('Booking submitted! Awaiting admin approval.');
    }
    setLoading(false);
  };

  const remaining = capacity ? capacity.max_capacity - capacity.current_count : null;

  /* ─── Success screen ─── */
  if (booking) {
    return (
      <motion.div
        className="min-h-screen pt-20 pb-12 px-4 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="glass-card border-primary/30 max-w-md w-full mx-auto">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-gradient text-2xl">Booking Submitted!</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              Your reservation is pending admin approval. You will be notified once reviewed.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Pending badge */}
            <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-warning/10 border border-warning/30 text-warning text-sm font-medium">
              <Info className="h-4 w-4 flex-shrink-0" />
              Status: Awaiting Admin Approval
            </div>

            {/* Booking details */}
            <div className="space-y-2 text-sm">
              {[
                { label: 'Date', value: booking.booking_date },
                { label: 'Start Time', value: booking.hikeTime },
                { label: 'Group Size', value: `${booking.group_size} pax` },
                { label: 'Emergency Contact', value: booking.emergency_contact_name },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-border/15">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>

            {/* QR code */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">Your booking QR code</p>
              <div className="inline-block bg-white p-3 rounded-xl">
                <QRCodeSVG value={booking.qr_code_data} size={140} bgColor="#ffffff" fgColor="#1a2e1a" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Show this at the trailhead once confirmed.</p>
            </div>

            {/* What's next */}
            <div className="rounded-xl bg-secondary/30 border border-border/20 p-4 space-y-2 text-sm">
              <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3">What Happens Next</p>
              {[
                'Admin reviews your booking request',
                'Admin assigns a local guide to your group',
                'You receive confirmation (check your dashboard)',
                'If date is adjusted, you will be asked to confirm',
                'Present QR code at trailhead on your hike day',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full" onClick={() => setBooking(null)}>
              Book Another Hike
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  /* ─── Booking form ─── */
  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">
            Book Your <span className="text-gradient">Hike</span>
          </h1>
          <p className="text-muted-foreground mb-8">
            Reserve your spot on Mount Kalisungan. Admin will review, assign a guide, and confirm your slot.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Date & Time */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-primary" /> Select Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={{ before: new Date() }}
                className="mx-auto"
              />
              {date && remaining !== null && (
                <div className={`text-center text-sm ${remaining < 20 ? 'text-warning' : 'text-primary'}`}>
                  <Users className="h-4 w-4 inline mr-1" />
                  {remaining} slots remaining for {format(date, 'MMM d, yyyy')}
                </div>
              )}

              {/* Time selection */}
              <div className="space-y-2">
                <Label>Preferred Start Time</Label>
                <div className="flex flex-wrap gap-2">
                  {HIKE_TIMES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setHikeTime(t)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        hikeTime === t
                          ? 'bg-primary/20 border-primary/50 text-primary font-medium'
                          : 'border-border/30 text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Admin may adjust your time based on trail capacity.</p>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" /> Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Group Size</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={groupSize}
                  onChange={(e) => setGroupSize(Number(e.target.value))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-destructive" /> Emergency Contact Name
                  </Label>
                  <Input
                    value={emergName}
                    onChange={(e) => setEmergName(e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Phone</Label>
                  <Input
                    value={emergPhone}
                    onChange={(e) => setEmergPhone(e.target.value)}
                    placeholder="+63 9XX XXX XXXX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Blood Type <span className="text-muted-foreground">(optional)</span></Label>
                <Input
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  placeholder="e.g. O+, A+, B-"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special requirements, medical concerns, experience level…"
                  rows={2}
                />
              </div>

              {/* Agreements */}
              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="rules"
                    checked={agreedRules}
                    onCheckedChange={(v) => setAgreedRules(Boolean(v))}
                  />
                  <label htmlFor="rules" className="text-sm leading-relaxed text-muted-foreground cursor-pointer">
                    I have read and agree to the{' '}
                    <span className="text-primary underline underline-offset-2">Rules & Regulations</span>{' '}
                    of Mount Kalisungan.
                  </label>
                </div>
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="privacy"
                    checked={agreedPrivacy}
                    onCheckedChange={(v) => setAgreedPrivacy(Boolean(v))}
                  />
                  <label htmlFor="privacy" className="text-sm leading-relaxed text-muted-foreground cursor-pointer">
                    I agree to the{' '}
                    <span className="text-primary underline underline-offset-2">Data Privacy Policy</span>.
                  </label>
                </div>
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleBook}
                disabled={!date || loading || !user || !agreedRules || !agreedPrivacy}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
                Submit Booking Request
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Booking will be reviewed by admin. You will receive confirmation on your dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
