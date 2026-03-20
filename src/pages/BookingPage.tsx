import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CalendarCheck,
  Users,
  Loader2,
  Clock,
  ShieldAlert,
  Info,
  ChevronRight,
  ChevronLeft,
  Shield,
  ClipboardCheck,
  Check,
  Sun,
  Moon,
  Minus,
  Plus,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { encodeMeta } from '@/lib/bookingMeta';
import { confirmReservation } from '@/lib/notification-service';
import { CapacityCalendar, type DayCapacityMap } from '@/components/booking/CapacityCalendar';
import { cn } from '@/lib/utils';

/* ─── Types ─── */
type HikeType = 'day' | 'night';

interface TimeOption {
  time: string;
  label: string;
  recommended?: boolean;
}

/* ─── Constants ─── */
const HIKE_TIME_OPTIONS: Record<HikeType, TimeOption[]> = {
  day: [
    { time: '04:30 AM', label: 'Very Early' },
    { time: '05:00 AM', label: 'Early Bird' },
    { time: '06:00 AM', label: 'Most Popular', recommended: true },
    { time: '07:00 AM', label: 'Morning' },
    { time: '08:00 AM', label: 'Late Start' },
  ],
  night: [
    { time: '09:00 PM', label: 'Evening' },
    { time: '10:00 PM', label: 'Summit at Dawn', recommended: true },
    { time: '11:00 PM', label: 'Midnight Trek' },
    { time: '12:00 AM', label: 'Late Night' },
  ],
};

const STEPS = [
  { id: 1, label: 'Schedule', icon: CalendarCheck },
  { id: 2, label: 'Safety', icon: ShieldAlert },
  { id: 3, label: 'Agreement', icon: Shield },
  { id: 4, label: 'Confirm', icon: ClipboardCheck },
];

const DEFAULT_MAX_CAPACITY = 100;

/* ─── Helpers ─── */
function formatTimeInput(time24: string): string {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

/* ─── Component ─── */
export default function BookingPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  // ── Step 1: Schedule
  const [date, setDate] = useState<Date | undefined>();
  const [hikeType, setHikeType] = useState<HikeType>('day');
  const [hikeTime, setHikeTime] = useState('06:00 AM');
  const [groupSize, setGroupSize] = useState(1);
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState('');
  const [monthCapacity, setMonthCapacity] = useState<DayCapacityMap>({});

  // ── Step 2: Safety
  const [emergName, setEmergName] = useState('');
  const [emergPhone, setEmergPhone] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [notes, setNotes] = useState('');

  // ── Step 3: Agreement
  const [agreedRules, setAgreedRules] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);

  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any>(null);

  /* ── Capacity fetching ── */
  const fetchMonthCapacity = useCallback(async (year: number, month: number) => {
    const start = format(new Date(year, month, 1), 'yyyy-MM-dd');
    const end = format(new Date(year, month + 1, 0), 'yyyy-MM-dd');
    const { data } = await supabase
      .from('daily_capacity')
      .select('*')
      .gte('date', start)
      .lte('date', end);
    if (data) {
      setMonthCapacity((prev) => {
        const map = { ...prev };
        (data as any[]).forEach((row) => {
          map[row.date] = {
            max_capacity: row.max_capacity,
            current_count: row.current_count,
          };
        });
        return map;
      });
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    fetchMonthCapacity(now.getFullYear(), now.getMonth());

    // Realtime: update calendar when admin changes capacity or bookings are confirmed
    const channel = supabase
      .channel('booking-page-capacity')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_capacity' },
        (payload) => {
          const row = payload.new as any;
          if (row?.date) {
            setMonthCapacity((prev) => ({
              ...prev,
              [row.date]: {
                max_capacity: row.max_capacity ?? DEFAULT_MAX_CAPACITY,
                current_count: row.current_count ?? 0,
              },
            }));
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMonthCapacity]);

  /* ── Derived slot count for selected date ── */
  const slotsForDate = useMemo(() => {
    if (!date) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    const cap = monthCapacity[dateStr];
    const max = cap?.max_capacity ?? DEFAULT_MAX_CAPACITY;
    const current = cap?.current_count ?? 0;
    return Math.max(0, max - current);
  }, [date, monthCapacity]);

  /* ── Hike type change ── */
  const handleHikeTypeChange = (type: HikeType) => {
    setHikeType(type);
    setUseCustomTime(false);
    setCustomTimeInput('');
    const recommended = HIKE_TIME_OPTIONS[type].find((t) => t.recommended);
    if (recommended) setHikeTime(recommended.time);
  };

  /* ── Validation ── */
  const validateStep = () => {
    if (step === 1) {
      if (!date) return 'Please select a date on the calendar.';
      if (groupSize < 1 || groupSize > 30) return 'Group size must be between 1 and 30.';
      if (slotsForDate !== null && groupSize > slotsForDate) {
        return `Only ${slotsForDate} slot${slotsForDate !== 1 ? 's' : ''} available on this date. Reduce group size or choose another date.`;
      }
      if (!hikeTime) return 'Please select a start time.';
    }
    if (step === 2) {
      if (!emergName.trim() || !emergPhone.trim()) return 'Please provide emergency contact details.';
      if (!bloodType.trim()) return 'Blood type is required for safety.';
    }
    if (step === 3) {
      if (!agreedRules || !agreedPrivacy) return 'You must agree to all policies.';
    }
    return '';
  };

  const next = () => {
    const err = validateStep();
    if (err) { toast.error(err); return; }
    setStep((s) => s + 1);
  };

  /* ── Submit ── */
  const handleBook = async () => {
    if (!user || !date) return;
    const dateStr = format(date, 'yyyy-MM-dd');
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
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
    } else {
      setBooking({ ...data, hikeTime, bloodType, hikeType });
      toast.success('Booking submitted! Awaiting admin approval.');
      confirmReservation({
        id: data.id.toString(),
        visitorName: user.user_metadata?.full_name || 'Hiker',
        email: user.email || '',
        phone: emergPhone,
        hikeDate: dateStr,
        trail: 'Mt. Kalisungan Summit',
        hikeTime,
      });
    }
    setLoading(false);
  };

  /* ─────────────── SUCCESS SCREEN ─────────────── */
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
            <h2 className="text-gradient text-2xl font-bold">Booking Submitted!</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Your reservation is pending admin approval. You'll be notified via Email &amp; SMS once reviewed.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-warning/10 border border-warning/30 text-warning text-sm font-medium">
              <Info className="h-4 w-4 flex-shrink-0" />
              Status: Awaiting Admin Approval
            </div>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Date', value: booking.booking_date },
                { label: 'Hike Type', value: booking.hikeType === 'night' ? '🌙 Night Hike' : '☀️ Day Hike' },
                { label: 'Start Time', value: booking.hikeTime },
                { label: 'Group Size', value: `${booking.group_size} pax` },
                { label: 'Blood Type', value: booking.bloodType },
                { label: 'Emergency Contact', value: booking.emergency_contact_name },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-border/15">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">Your booking QR code</p>
              <div className="inline-block bg-white p-3 rounded-xl">
                <QRCodeSVG value={booking.qr_code_data} size={140} bgColor="#ffffff" fgColor="#1a2e1a" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Show this at the trailhead once confirmed.</p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => { setBooking(null); setStep(1); setDate(undefined); setGroupSize(1); }}
            >
              Book Another Hike
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  /* ─────────────── BOOKING FORM ─────────────── */
  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">
            Book Your <span className="text-gradient">Hike</span>
          </h1>
          <p className="text-muted-foreground">
            Complete the {STEPS.length}-step process to secure your slot at Mount Kalisungan.
          </p>
        </motion.div>

        {/* ─── Step Indicator ─── */}
        <div className="flex items-center justify-center mb-12 gap-0 overflow-x-auto pb-2 no-scrollbar">
          {STEPS.map((s, i) => {
            const done = step > s.id;
            const active = step === s.id;
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center gap-2 px-3 sm:px-4">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                      done ? 'bg-primary text-white' :
                      active ? 'bg-primary/20 border-2 border-primary text-primary' :
                      'bg-secondary/50 border-2 border-border/30 text-muted-foreground',
                    )}
                  >
                    {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider whitespace-nowrap',
                      active ? 'text-primary' : 'text-muted-foreground opacity-50',
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'w-10 sm:w-14 h-[2px] mb-6 transition-colors duration-300',
                      done ? 'bg-primary' : 'bg-border/30',
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ─── Step Content ─── */}
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="glass-card border-primary/20 p-5 sm:p-8">

                {/* ═══════════════ STEP 1: SCHEDULE ═══════════════ */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div className="text-center">
                      <h2 className="text-xl font-bold">Select Schedule</h2>
                      <p className="text-sm text-muted-foreground mt-1">When do you plan to hike?</p>
                    </div>

                    {/* Hike Type Toggle */}
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          { type: 'day' as HikeType, Icon: Sun, label: 'Day Hike', desc: 'Summit by daylight' },
                          { type: 'night' as HikeType, Icon: Moon, label: 'Night Hike', desc: 'Sunrise at the top' },
                        ] as const
                      ).map(({ type, Icon, label, desc }) => (
                        <button
                          key={type}
                          onClick={() => handleHikeTypeChange(type)}
                          aria-pressed={hikeType === type}
                          className={cn(
                            'flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 font-semibold transition-all duration-200 text-sm',
                            hikeType === type
                              ? 'border-primary bg-primary/10 text-primary shadow-sm'
                              : 'border-border/30 text-muted-foreground hover:border-primary/30 hover:bg-primary/5',
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{label}</span>
                          <span
                            className={cn(
                              'text-[10px] font-normal',
                              hikeType === type ? 'text-primary/70' : 'text-muted-foreground/60',
                            )}
                          >
                            {desc}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Capacity Calendar */}
                    <div className="rounded-xl border border-border/30 p-3 sm:p-4 bg-background/40">
                      <CapacityCalendar
                        selected={date}
                        onSelect={setDate}
                        groupSize={groupSize}
                        monthCapacity={monthCapacity}
                        onMonthChange={fetchMonthCapacity}
                      />
                    </div>

                    {/* Selected date info */}
                    {date && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm',
                          slotsForDate !== null && slotsForDate < groupSize
                            ? 'bg-destructive/10 border-destructive/30 text-destructive'
                            : slotsForDate !== null && slotsForDate < 20
                            ? 'bg-warning/10 border-warning/30 text-warning'
                            : 'bg-primary/10 border-primary/30 text-primary',
                        )}
                      >
                        <CalendarCheck className="h-4 w-4 flex-shrink-0" />
                        <span>
                          <strong>{format(date, 'MMMM d, yyyy')}</strong>
                          {slotsForDate !== null && (
                            <> — <strong>{slotsForDate}</strong> slot{slotsForDate !== 1 ? 's' : ''} available</>
                          )}
                        </span>
                      </motion.div>
                    )}

                    {/* Group Size */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/20 bg-secondary/20">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-semibold leading-tight">Group Size</p>
                          <p className="text-[11px] text-muted-foreground">1–30 people per booking</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setGroupSize((s) => Math.max(1, s - 1))}
                          disabled={groupSize <= 1}
                          aria-label="Decrease group size"
                          className="w-8 h-8 rounded-full border border-border/50 flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-lg font-bold tabular-nums">{groupSize}</span>
                        <button
                          onClick={() => setGroupSize((s) => Math.min(30, s + 1))}
                          disabled={groupSize >= 30}
                          aria-label="Increase group size"
                          className="w-8 h-8 rounded-full border border-border/50 flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        {date && slotsForDate !== null && groupSize > slotsForDate && (
                          <span className="ml-1 text-[10px] font-bold px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                            Over limit
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Start Time */}
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex flex-wrap items-center gap-1.5">
                        Preferred Start Time
                        <span className="text-[10px] font-normal normal-case tracking-normal text-muted-foreground/60">
                          — {hikeType === 'day' ? 'Day hike schedule' : 'Night hike schedule'}
                        </span>
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {HIKE_TIME_OPTIONS[hikeType].map((opt) => (
                          <button
                            key={opt.time}
                            onClick={() => { setHikeTime(opt.time); setUseCustomTime(false); }}
                            aria-pressed={hikeTime === opt.time && !useCustomTime}
                            className={cn(
                              'flex flex-col items-center px-3 py-2.5 rounded-xl border-2 text-xs font-bold transition-all min-w-[76px]',
                              hikeTime === opt.time && !useCustomTime
                                ? 'bg-primary border-primary text-primary-foreground shadow-md'
                                : 'border-border/30 text-muted-foreground hover:border-primary/30 hover:bg-primary/5',
                            )}
                          >
                            <span>{opt.time}</span>
                            <span
                              className={cn(
                                'text-[9px] font-medium mt-0.5',
                                hikeTime === opt.time && !useCustomTime
                                  ? 'text-primary-foreground/70'
                                  : opt.recommended
                                  ? 'text-amber-500'
                                  : 'opacity-55',
                              )}
                            >
                              {opt.recommended ? '★ Recommended' : opt.label}
                            </span>
                          </button>
                        ))}

                        {/* Custom time chip */}
                        <button
                          onClick={() => setUseCustomTime(true)}
                          aria-pressed={useCustomTime}
                          className={cn(
                            'flex flex-col items-center px-3 py-2.5 rounded-xl border-2 text-xs font-bold transition-all min-w-[76px]',
                            useCustomTime
                              ? 'bg-primary border-primary text-primary-foreground shadow-md'
                              : 'border-border/30 text-muted-foreground hover:border-primary/30 hover:bg-primary/5',
                          )}
                        >
                          <span>{useCustomTime && hikeTime ? hikeTime : 'Custom'}</span>
                          <span
                            className={cn(
                              'text-[9px] font-medium mt-0.5',
                              useCustomTime ? 'text-primary-foreground/70' : 'opacity-55',
                            )}
                          >
                            Pick time
                          </span>
                        </button>
                      </div>

                      {/* Custom time input */}
                      <AnimatePresence>
                        {useCustomTime && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-3 overflow-hidden"
                          >
                            <Input
                              type="time"
                              value={customTimeInput}
                              onChange={(e) => {
                                setCustomTimeInput(e.target.value);
                                const formatted = formatTimeInput(e.target.value);
                                if (formatted) setHikeTime(formatted);
                              }}
                              className="max-w-[150px] font-semibold"
                              aria-label="Custom start time"
                            />
                            <span className="text-sm text-muted-foreground">
                              {hikeTime && useCustomTime ? (
                                <span className="text-primary font-semibold">{hikeTime}</span>
                              ) : (
                                'Enter desired time'
                              )}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* ═══════════════ STEP 2: SAFETY ═══════════════ */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-bold">Safety Records</h2>
                      <p className="text-sm text-muted-foreground mt-1">Required for emergency preparedness.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bloodType">Blood Type</Label>
                        <Input
                          id="bloodType"
                          value={bloodType}
                          onChange={(e) => setBloodType(e.target.value)}
                          placeholder="e.g. O+"
                          className="font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergName">Emergency Contact Name</Label>
                        <Input
                          id="emergName"
                          value={emergName}
                          onChange={(e) => setEmergName(e.target.value)}
                          placeholder="Name of Relative"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="emergPhone">Emergency Contact Phone</Label>
                        <Input
                          id="emergPhone"
                          value={emergPhone}
                          onChange={(e) => setEmergPhone(e.target.value)}
                          placeholder="09XXXXXXXXX"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="notes">Special Medical Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Any allergies or medical conditions..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══════════════ STEP 3: AGREEMENT ═══════════════ */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-bold">Agreement</h2>
                      <p className="text-sm text-muted-foreground mt-1">Please review our terms and policies.</p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3 p-4 rounded-xl bg-secondary/20 border border-border/15">
                        <Checkbox
                          id="rules"
                          checked={agreedRules}
                          onCheckedChange={(v) => setAgreedRules(!!v)}
                          className="mt-1"
                        />
                        <Label htmlFor="rules" className="text-sm leading-relaxed cursor-pointer">
                          I agree to follow the{' '}
                          <span className="text-primary font-bold">Rules &amp; Regulations</span> of Mount
                          Kalisungan, including the "Leave No Trace" policy.
                        </Label>
                      </div>
                      <div className="flex items-start space-x-3 p-4 rounded-xl bg-secondary/20 border border-border/15">
                        <Checkbox
                          id="privacy"
                          checked={agreedPrivacy}
                          onCheckedChange={(v) => setAgreedPrivacy(!!v)}
                          className="mt-1"
                        />
                        <Label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
                          I consent to the{' '}
                          <span className="text-primary font-bold">Data Privacy Policy</span> regarding the
                          collection of my personal and safety information.
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══════════════ STEP 4: CONFIRM ═══════════════ */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-bold">Confirm Booking</h2>
                      <p className="text-sm text-muted-foreground mt-1">Review your details before submitting.</p>
                    </div>
                    <div className="space-y-3 p-5 rounded-2xl bg-primary/5 border border-primary/20">
                      {[
                        { label: 'Hike Date', value: date ? format(date, 'MMMM d, yyyy') : '' },
                        { label: 'Hike Type', value: hikeType === 'night' ? '🌙 Night Hike' : '☀️ Day Hike' },
                        { label: 'Start Time', value: hikeTime },
                        { label: 'Group Size', value: `${groupSize} Pax` },
                        { label: 'Emergency Contact', value: `${emergName} · ${emergPhone}` },
                        { label: 'Blood Type', value: bloodType },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="flex justify-between items-center py-2 border-b border-border/10 last:border-0"
                        >
                          <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                            {label}
                          </span>
                          <span className="font-bold text-primary text-sm text-right max-w-[55%] truncate">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* ─── Navigation Buttons ─── */}
          <div className="flex justify-between items-center mt-6">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1 || loading}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            {step < STEPS.length ? (
              <Button
                onClick={next}
                className="gap-2 px-8 h-12 text-base font-bold shadow-lg shadow-primary/20"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleBook}
                disabled={loading}
                className="gap-2 px-8 h-12 text-base font-bold shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Confirm Reservation
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
