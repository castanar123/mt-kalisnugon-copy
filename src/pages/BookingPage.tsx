import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
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
  Info,
  ChevronRight,
  ChevronLeft,
  Shield,
  UserRound,
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
import BookingAIChat, { type GroupComposition } from '@/components/booking/BookingAIChat';
import BookingInsightsPanel from '@/components/booking/BookingInsightsPanel';
import { cn } from '@/lib/utils';

/* ── Weather code → human-readable label (Open-Meteo) ── */
function weatherCodeToLabel(code: number): string {
  if (code === 0) return 'Clear Sky';
  if ([1, 2, 3].includes(code)) return 'Partly Cloudy';
  if ([45, 48].includes(code)) return 'Foggy';
  if ([51, 53, 55].includes(code)) return 'Light Drizzle';
  if ([61, 63, 65].includes(code)) return 'Rainy';
  if ([71, 73, 75, 77].includes(code)) return 'Snow';
  if ([80, 81, 82].includes(code)) return 'Rain Showers';
  if ([85, 86].includes(code)) return 'Snow Showers';
  if (code === 95) return 'Thunderstorm';
  if ([96, 99].includes(code)) return 'Thunderstorm with Hail';
  return 'Variable Conditions';
}

/* ─── Types ─── */
type HikeType = 'day' | 'night';

interface TimeOption {
  time: string;
  label: string;
  recommended?: boolean;
}

interface WeatherSnapshot {
  maxTempC: number;
  minTempC: number;
  rainProbability: number;
  condition: string;
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
  { id: 2, label: 'Details', icon: UserRound },
  { id: 3, label: 'Agreement', icon: Shield },
  { id: 4, label: 'Confirm', icon: ClipboardCheck },
];

const DEFAULT_MAX_CAPACITY = 100;

type SubmittedBooking = {
  booking_date: string;
  group_size: number;
  qr_code_data: string;
  hikeType: HikeType;
  hikeTime: string;
  fullName: string;
  age: string;
  emailAddress: string;
  phoneNumber: string;
  province: string;
  city: string;
  companions: string[];
  medicalNotes: string;
};

/* ─── Helpers ─── */
function formatTimeInput(time24: string): string {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

function parseHourFromTime12(time12: string): number {
  const [time, period] = time12.split(' ');
  if (!time || !period) return 0;
  const [h] = time.split(':').map(Number);
  const normalized = h % 12;
  return period.toUpperCase() === 'PM' ? normalized + 12 : normalized;
}

function dayDifference(target: Date): number {
  const today = new Date();
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const b = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/* ─── Component ─── */
export default function BookingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // ── Step 1: Schedule
  const [date, setDate] = useState<Date | undefined>();
  const [hikeType, setHikeType] = useState<HikeType>('day');
  const [hikeTime, setHikeTime] = useState('06:00 AM');
  const [groupSize, setGroupSize] = useState(1);
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState('');
  const [monthCapacity, setMonthCapacity] = useState<DayCapacityMap>({});
  const [smartGuideEnabled, setSmartGuideEnabled] = useState(false);
  const [groupComposition, setGroupComposition] = useState<GroupComposition | null>(null);
  const [weatherInsight, setWeatherInsight] = useState<WeatherSnapshot | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // ── Step 2: Personal details
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [companions, setCompanions] = useState<string[]>([]);
  const [medicalNotes, setMedicalNotes] = useState('');

  // ── Step 3: Agreement
  const [agreedRules, setAgreedRules] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [hasScrolledRulesToEnd, setHasScrolledRulesToEnd] = useState(false);
  const [hasScrolledPrivacyToEnd, setHasScrolledPrivacyToEnd] = useState(false);
  const rulesRef = useRef<HTMLDivElement | null>(null);
  const privacyRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<SubmittedBooking | null>(null);

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
        data.forEach((row) => {
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
          const row = payload.new as { date?: string; max_capacity?: number; current_count?: number };
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

  useEffect(() => {
    if (!user) return;
    setFullName((prev) => prev || user.user_metadata?.full_name || '');
    setEmailAddress((prev) => prev || user.email || '');

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', user.id)
        .single();

      if (data?.full_name) setFullName((prev) => prev || data.full_name);
      if (data?.phone) setPhoneNumber((prev) => prev || data.phone);
    };

    void fetchProfile();
  }, [user]);

  useEffect(() => {
    const neededCompanions = Math.max(0, groupSize - 1);
    setCompanions((prev) => {
      if (prev.length === neededCompanions) return prev;
      if (prev.length < neededCompanions) {
        return [...prev, ...Array.from({ length: neededCompanions - prev.length }, () => '')];
      }
      return prev.slice(0, neededCompanions);
    });
  }, [groupSize]);

  /* ── Derived slot count for selected date ── */
  const slotsForDate = useMemo(() => {
    if (!date) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    const cap = monthCapacity[dateStr];
    const max = cap?.max_capacity ?? DEFAULT_MAX_CAPACITY;
    const current = cap?.current_count ?? 0;
    return Math.max(0, max - current);
  }, [date, monthCapacity]);

  const fetchSmartWeather = useCallback(async (selectedDate: Date) => {
    const weatherApiKey = import.meta.env.VITE_WEATHERAPI_KEY as string | undefined;
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');

    try {
      setWeatherLoading(true);
      setWeatherError(null);

      if (weatherApiKey) {
        const diff = Math.max(1, Math.min(10, dayDifference(selectedDate) + 1));
        const response = await fetch(
          `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=14.1475,121.3454&days=${diff}&aqi=no&alerts=no`,
        );
        if (!response.ok) throw new Error(`WeatherAPI request failed (${response.status})`);
        const payload = await response.json() as {
          forecast?: { forecastday?: Array<{ date: string; day: { maxtemp_c: number; mintemp_c: number; daily_chance_of_rain: number; condition?: { text?: string } } }> };
        };
        const selected = payload.forecast?.forecastday?.find((item) => item.date === formattedDate);
        if (!selected) throw new Error('No forecast available for the selected date');
        setWeatherInsight({
          maxTempC: selected.day.maxtemp_c,
          minTempC: selected.day.mintemp_c,
          rainProbability: Number(selected.day.daily_chance_of_rain ?? 0),
          condition: selected.day.condition?.text ?? 'Forecast available',
        });
        return;
      }

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=14.1475&longitude=121.3454&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=Asia%2FManila&forecast_days=16`,
      );
      if (!response.ok) throw new Error(`Open-Meteo request failed (${response.status})`);
      const payload = await response.json() as {
        daily?: {
          time: string[];
          temperature_2m_max: number[];
          temperature_2m_min: number[];
          precipitation_probability_max: number[];
          weathercode: number[];
        };
      };

      const idx = payload.daily?.time?.findIndex((d) => d === formattedDate) ?? -1;
      if (idx < 0 || !payload.daily) throw new Error('No forecast available for the selected date');
      setWeatherInsight({
        maxTempC: payload.daily.temperature_2m_max[idx],
        minTempC: payload.daily.temperature_2m_min[idx],
        rainProbability: payload.daily.precipitation_probability_max[idx] ?? 0,
        condition: weatherCodeToLabel(payload.daily.weathercode[idx] ?? -1),
      });
    } catch (err: unknown) {
      setWeatherInsight(null);
      setWeatherError(err instanceof Error ? err.message : 'Unable to load weather insight');
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!smartGuideEnabled || !date) return;
    void fetchSmartWeather(date);
  }, [smartGuideEnabled, date, fetchSmartWeather]);

  const handleClearInsights = useCallback(() => {
    setSmartGuideEnabled(false);
    setWeatherInsight(null);
    setWeatherError(null);
    setWeatherLoading(false);
  }, []);

  const smartRecommendations = useMemo(() => {
    if (!smartGuideEnabled || !date || !weatherInsight) return null;

    const selectedHour = parseHourFromTime12(hikeTime);
    const highHeat = selectedHour >= 8 && weatherInsight.maxTempC >= 32;
    const highRain = weatherInsight.rainProbability > 50;

    const groupMessage = groupSize <= 2
      ? 'Small group detected. Hiking with 3 or more improves safety coverage.'
      : groupSize > 10
      ? 'Large group detected. Consider splitting into smaller teams for trail flow and safety.'
      : 'Group size is in an ideal range for pace and coordination.';

    const recommendedTimes = HIKE_TIME_OPTIONS[hikeType]
      .filter((opt) => {
        const hour = parseHourFromTime12(opt.time);
        if (highRain) return hour < 8;
        if (weatherInsight.maxTempC >= 32) return hour < 8;
        return true;
      })
      .map((opt) => opt.time);

    const bestTime = recommendedTimes[0] ?? HIKE_TIME_OPTIONS[hikeType][0].time;

    return {
      bestTime,
      highHeat,
      highRain,
      groupMessage,
      recommendedTimes,
    };
  }, [smartGuideEnabled, date, weatherInsight, hikeTime, groupSize, hikeType]);

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
      if (!fullName.trim()) return 'Full name is required.';
      if (!age.trim() || Number(age) < 1) return 'Please enter a valid age.';
      if (!emailAddress.trim()) return 'Email address is required.';
      if (groupSize > 1) {
        const missing = companions.findIndex((name) => !name.trim());
        if (missing >= 0) return `Please provide full name for Companion ${missing + 1}.`;
      }
    }
    if (step === 3) {
      if (!hasScrolledRulesToEnd) return 'Please read the full rules and scroll to the end before agreeing.';
      if (!hasScrolledPrivacyToEnd) return 'Please read the full data privacy policy and scroll to the end before agreeing.';
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
    const companionNames = companions.map((name) => name.trim()).filter(Boolean);
    const metaNotes = encodeMeta({
      userNotes: medicalNotes,
      fullName,
      age,
      emailAddress,
      phoneNumber,
      province,
      city,
      companions: companionNames,
      medicalNotes,
    });

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        booking_date: dateStr,
        group_size: groupSize,
        qr_code_data: qrData,
        emergency_contact_name: fullName,
        emergency_contact_phone: phoneNumber,
        notes: metaNotes,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
    } else {
      setBooking({ ...data, hikeTime, hikeType, fullName, age, emailAddress, phoneNumber, province, city, companions: companionNames });
      toast.success('Booking submitted! Awaiting admin approval.');
      confirmReservation({
        id: data.id.toString(),
        visitorName: fullName,
        email: emailAddress || user.email || '',
        phone: phoneNumber,
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
                { label: 'Full Name', value: booking.fullName },
                { label: 'Age', value: booking.age },
                { label: 'Email', value: booking.emailAddress },
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
              onClick={() => {
                setBooking(null);
                setStep(1);
                setDate(undefined);
                setGroupSize(1);
                setAgreedRules(false);
                setAgreedPrivacy(false);
                setHasScrolledRulesToEnd(false);
                setHasScrolledPrivacyToEnd(false);
              }}
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
    <div className="min-h-screen pt-20 pb-24 md:pb-12 px-2 sm:px-4">
      <div className="container max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">
            Book Your <span className="text-gradient">Hike</span>
          </h1>
          <p className="text-muted-foreground">
            Complete the {STEPS.length}-step process to secure your slot at Mount Kalisungan.
          </p>
        </motion.div>

        {/* ─── Step Indicator ─── */}
        <div className="mb-8 md:mb-12 pb-1">
          <div className="grid grid-cols-4 items-start gap-1 sm:gap-2">
          {STEPS.map((s, i) => {
            const done = step > s.id;
            const active = step === s.id;
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex flex-col items-center">
                <div className="flex flex-col items-center gap-1.5 px-1">
                  <div
                    className={cn(
                      'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300',
                      done ? 'bg-primary text-white' :
                      active ? 'bg-primary/20 border-2 border-primary text-primary' :
                      'bg-secondary/50 border-2 border-border/30 text-muted-foreground',
                    )}
                  >
                    {done ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : <Icon className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </div>
                  <span
                    className={cn(
                      'text-[9px] sm:text-[10px] font-bold uppercase tracking-wide whitespace-nowrap',
                      active ? 'text-primary' : 'text-muted-foreground opacity-50',
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'w-full h-[2px] mt-2 transition-colors duration-300',
                      done ? 'bg-primary' : 'bg-border/30',
                    )}
                  />
                )}
              </div>
            );
          })}
          </div>
        </div>

        {/* ─── Step Content ─── */}
        <div className="max-w-none md:max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="glass-card border-primary/20 p-4 sm:p-8">

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
                    <div className="rounded-xl border border-border/30 p-2 sm:p-4 bg-background/40">
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
                      <div className="relative">
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

                      </div>
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
                                : smartRecommendations?.recommendedTimes.includes(opt.time)
                                ? 'border-amber-400/60 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                : 'border-border/30 text-muted-foreground hover:border-primary/30 hover:bg-primary/5',
                            )}
                          >
                            <span>{opt.time}</span>
                            <span
                              className={cn(
                                'text-[9px] font-medium mt-0.5',
                                hikeTime === opt.time && !useCustomTime
                                  ? 'text-primary-foreground/70'
                                  : smartRecommendations?.recommendedTimes.includes(opt.time)
                                  ? 'text-amber-600 dark:text-amber-300'
                                  : opt.recommended
                                  ? 'text-amber-500'
                                  : 'opacity-55',
                              )}
                            >
                              {smartRecommendations?.recommendedTimes.includes(opt.time)
                                ? '⭐ Recommended'
                                : opt.recommended
                                ? '★ Recommended'
                                : opt.label}
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

                {/* ═══════════════ STEP 2: PERSONAL DETAILS ═══════════════ */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-bold">Hiker Details</h2>
                      <p className="text-sm text-muted-foreground mt-1">Connected to your account but you can edit before submitting.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Juan Dela Cruz"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input
                          id="age"
                          type="number"
                          min={1}
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          placeholder="e.g. 24"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emailAddress">Email Address</Label>
                        <Input
                          id="emailAddress"
                          type="email"
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          placeholder="you@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="09XXXXXXXXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="province">Province (Optional)</Label>
                        <Input
                          id="province"
                          value={province}
                          onChange={(e) => setProvince(e.target.value)}
                          placeholder="Laguna"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City (Optional)</Label>
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Calauan"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <Label>Companion Full Names ({Math.max(0, groupSize - 1)})</Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setGroupSize((s) => Math.min(30, s + 1))}
                          >
                            + Add Companion
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {companions.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                              No companions yet. Increase group size to add companion full names.
                            </p>
                          )}
                          {companions.map((companion, idx) => (
                            <div key={`companion-${idx}`} className="flex items-center gap-2">
                              <Input
                                value={companion}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setCompanions((prev) =>
                                    prev.map((item, index) => (index === idx ? value : item)),
                                  );
                                }}
                                placeholder={`Companion ${idx + 1} full name (e.g. Maria Santos)`}
                              />
                              {companions.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => setGroupSize((s) => Math.max(1, s - 1))}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="medicalNotes">Special Medical Notes (Optional)</Label>
                        <Textarea
                          id="medicalNotes"
                          value={medicalNotes}
                          onChange={(e) => setMedicalNotes(e.target.value)}
                          placeholder="Allergies, medical history, or reminders for rangers"
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
                      <p className="text-sm text-muted-foreground mt-1">Read all rules below. You can only agree after scrolling to the end.</p>
                    </div>
                    <div
                      ref={rulesRef}
                      onScroll={(e) => {
                        const element = e.currentTarget;
                        const reachedEnd = element.scrollTop + element.clientHeight >= element.scrollHeight - 8;
                        if (reachedEnd) setHasScrolledRulesToEnd(true);
                      }}
                      className="h-48 overflow-y-auto rounded-xl border border-border/20 bg-secondary/10 p-4 text-sm leading-relaxed"
                    >
                      <p className="font-semibold mb-2">Trail Rules and Regulations</p>
                      <p>1. Follow ranger instructions at all times during registration, ascent, and descent.</p>
                      <p>2. Stay on official trail routes and avoid restricted or dangerous areas.</p>
                      <p>3. Practice Leave No Trace: bring back all trash and do not damage flora and fauna.</p>
                      <p>4. Carry enough water, basic first-aid, and weather-appropriate gear.</p>
                      <p>5. Report medical concerns before the hike and inform rangers of emergencies immediately.</p>
                      <p>6. Respect local community guidelines at Barangay Lamot II and all checkpoints.</p>
                      <p>7. You are responsible for providing accurate details for yourself and companions.</p>
                    </div>
                    {!hasScrolledRulesToEnd && (
                      <p className="text-xs text-amber-600 font-medium">Please scroll to the end of the rules to enable agreement.</p>
                    )}
                    <div className="space-y-4">
                      {hasScrolledRulesToEnd && (
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
                      )}
                      {agreedRules && (
                        <>
                          <div
                            ref={privacyRef}
                            onScroll={(e) => {
                              const element = e.currentTarget;
                              const reachedEnd = element.scrollTop + element.clientHeight >= element.scrollHeight - 8;
                              if (reachedEnd) setHasScrolledPrivacyToEnd(true);
                            }}
                            className="h-40 overflow-y-auto rounded-xl border border-border/20 bg-secondary/10 p-4 text-sm leading-relaxed"
                          >
                            <p className="font-semibold mb-2">Data Privacy Policy</p>
                            <p>1. Personal data is collected for booking verification, safety coordination, emergency response, and post-incident review.</p>
                            <p>2. Your details may only be accessed by authorized personnel in relevant roles for operational and safety purposes.</p>
                            <p>3. Companion details must be submitted with their awareness and consent.</p>
                            <p>4. Data retention follows operational and legal needs, and records may be archived securely for incident tracing.</p>
                            <p>5. By submitting this booking, you consent to storing and processing your data for mountain operation services.</p>
                          </div>
                          {!hasScrolledPrivacyToEnd && (
                            <p className="text-xs text-amber-600 font-medium">Please scroll to the end of the data privacy policy to enable consent.</p>
                          )}
                          {hasScrolledPrivacyToEnd && (
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
                          )}
                        </>
                      )}
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
                        { label: 'Full Name', value: fullName },
                        { label: 'Age', value: age },
                        { label: 'Email', value: emailAddress },
                        { label: 'Address', value: [city, province].filter(Boolean).join(', ') || 'Not provided' },
                        { label: 'Companions', value: companions.map((name) => name.trim()).filter(Boolean).join(', ') || 'None listed' },
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
          <div className="hidden md:flex justify-between items-center mt-6">
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
          <div className="md:hidden fixed bottom-3 left-3 right-3 z-30">
            <div className="glass-card border border-border/30 rounded-2xl p-2 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 1 || loading}
                className="gap-2 flex-1"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              {step < STEPS.length ? (
                <Button
                  onClick={next}
                  className="gap-2 flex-1 h-11 text-sm font-bold"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleBook}
                  disabled={loading}
                  className="gap-2 flex-1 h-11 text-sm font-bold"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Confirm
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI Chat — left side */}
      <BookingAIChat
        date={date}
        groupSize={groupSize}
        hikeType={hikeType}
        weatherInsight={weatherInsight}
        groupComposition={groupComposition}
        onGroupCompositionSet={setGroupComposition}
      />

      {/* Floating AI Insights Panel — right side (desktop) */}
      <BookingInsightsPanel
        date={date}
        smartGuideEnabled={smartGuideEnabled}
        weatherInsight={weatherInsight}
        weatherLoading={weatherLoading}
        weatherError={weatherError}
        smartRecommendations={smartRecommendations}
        groupSize={groupSize}
        hikeType={hikeType}
        onToggleSmartGuide={setSmartGuideEnabled}
        onClear={handleClearInsights}
      />
    </div>
  );
}
