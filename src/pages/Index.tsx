import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mountain, Map, Bot, CalendarCheck, Shield, Navigation, WifiOff, ArrowUpRight, Wind, Droplets } from 'lucide-react';
import { motion } from 'framer-motion';
import heroImage from '@/assets/mt-kalisungan-hero.jpg';
import logo from '@/assets/logo.png';
import TrailGallery from '@/components/landing/TrailGallery';
import HikerReviews from '@/components/landing/HikerReviews';

const features = [
  { icon: Map, title: 'Interactive Trail Map', desc: 'Real-time topographic map with offline support, GPS tracking, and trail navigation for Mount Kalisungan.' },
  { icon: Bot, title: 'AI Trail Assistant', desc: 'Get instant answers about trail conditions, weather, safety tips, and what to bring on your hike.' },
  { icon: WifiOff, title: 'Offline AI Support', desc: 'AI assistant works without internet using locally cached data — weather, trails, safety info downloaded before your hike.' },
  { icon: Navigation, title: 'Live Hiker Tracking', desc: 'Strava-like distance tracking with path deviation alerts and elevation profiles.' },
  { icon: CalendarCheck, title: 'Smart Booking', desc: 'Book your hike with capacity management, QR code passes, and group coordination.' },
  { icon: Shield, title: 'Safety First', desc: 'Emergency contacts, ranger check-ins, and real-time trail condition reports.' },
];

type LiveWeather = {
  temperature: number;
  windSpeed: number;
  weatherLabel: string;
};

function useLiveWeather(): { weather: LiveWeather | null; loading: boolean; error: string | null } {
  const [weather, setWeather] = useState<LiveWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchWeather = async () => {
      try {
        // Open-Meteo (no API key required), fixed at Mt. Kalisungan coordinates
        const url =
          'https://api.open-meteo.com/v1/forecast?latitude=14.1475&longitude=121.3454&current=temperature_2m,wind_speed_10m,weather_code';
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Weather error ${resp.status}`);
        const data = await resp.json();
        if (cancelled || !data.current) return;

        const code: number | undefined = data.current.weather_code;
        let label = 'Clear';
        if (code === 0) label = 'Clear sky';
        else if ([1, 2, 3].includes(code)) label = 'Partly cloudy';
        else if ([45, 48].includes(code)) label = 'Foggy';
        else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) label = 'Rainy';
        else if ([71, 73, 75, 77, 85, 86].includes(code)) label = 'Snow';
        else if ([95, 96, 99].includes(code)) label = 'Thunderstorm';
        else if ([56, 57, 66, 67].includes(code)) label = 'Freezing rain';

        setWeather({
          temperature: data.current.temperature_2m,
          windSpeed: data.current.wind_speed_10m,
          weatherLabel: label,
        });
        setError(null);
      } catch (e: any) {
        setError(e?.message ?? 'Could not load weather');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchWeather();
    const id = setInterval(fetchWeather, 10 * 60 * 1000); // refresh every 10 minutes
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { weather, loading, error };
}

function SummitPathOverlay() {
  return (
    <div className="hidden sm:block glass-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground/80">Summit path (preview)</div>
          <div className="text-sm font-semibold">Sample route line</div>
        </div>
        <div className="text-xs text-muted-foreground text-right">
          <div className="font-medium text-foreground/90">Start</div>
          <div>Trailhead</div>
        </div>
      </div>

      <div className="relative h-24 rounded-xl bg-background/50 border border-border/40 overflow-hidden">
        <svg viewBox="0 0 400 120" className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="pathGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
              <stop offset="55%" stopColor="rgba(255,255,255,0.65)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
            </linearGradient>
          </defs>

          <motion.path
            d="M20,90 C70,50 120,60 165,40 C220,15 250,35 290,25 C330,15 350,30 380,18"
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />

          {/* Start point */}
          <circle cx="20" cy="90" r="6" fill="rgba(34,197,94,0.9)" />
          <circle cx="20" cy="90" r="10" fill="rgba(34,197,94,0.18)" />

          {/* End point */}
          <circle cx="380" cy="18" r="6" fill="rgba(239,68,68,0.9)" />
          <circle cx="380" cy="18" r="10" fill="rgba(239,68,68,0.18)" />
        </svg>

        <div className="absolute left-3 bottom-2 text-[11px] text-muted-foreground">
          <span className="text-foreground/90 font-medium">Start</span> • Trailhead
        </div>
        <div className="absolute right-3 top-2 text-[11px] text-muted-foreground text-right">
          <div>
            <span className="text-foreground/90 font-medium">Arrive</span> • Summit
          </div>
          <div className="text-[10px]">~622 m</div>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const { weather, loading, error } = useLiveWeather();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Mount Kalisungan panoramic view showing lush green trails and dramatic sunset clouds in Calauan, Laguna, Philippines"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/10 dark:to-background" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full px-4"
        >
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-stretch gap-8 lg:gap-12 pt-20 sm:pt-24 pb-16">
            {/* Left: headline + CTAs */}
            <div className="flex-1 flex flex-col justify-center text-center lg:text-left">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full glass-card mx-auto lg:mx-0 mb-6"
              >
                <img
                  src={logo}
                  alt="Mt. Kalisungan logo"
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover bg-white/5 ring-1 ring-white/10"
                />
                <div className="leading-tight text-left">
                  <div className="text-sm sm:text-base font-semibold text-foreground">
                    Mt. Kalisungan
                  </div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground">
                    Calauan, Laguna • 622m
                  </div>
                </div>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black mb-4 leading-tight text-white drop-shadow-[0_10px_35px_rgba(0,0,0,0.55)]">
                Stunning <span className="text-gradient">High Treks</span>{' '}
                <span className="block text-white/90">On Mount Kalisungan</span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-white/75 max-w-xl mx-auto lg:mx-0 mb-8 drop-shadow-[0_8px_28px_rgba(0,0,0,0.45)]">
                Plan, book, and track every step of your Kalisungan hike with live weather, elevation
                insights, and GPS-guided navigation — built for both hikers and rangers.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Button asChild size="lg" className="text-base px-8 glow-primary">
                  <Link to="/map">
                    Start Trek <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base px-8">
                  <Link to="/booking">Book a Hike</Link>
                </Button>
              </div>

              {/* Quick stats for desktop, tucked below copy */}
              <div className="hidden sm:flex mt-8 gap-6 text-xs sm:text-sm text-white/70 drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
                <div>
                  <div className="text-xl font-semibold text-white">622 m</div>
                  <div>Summit elevation</div>
                </div>
                <div>
                  <div className="text-xl font-semibold text-white">3 trails</div>
                  <div>Summit • River • Ridge</div>
                </div>
                <div>
                  <div className="text-xl font-semibold text-white">AI</div>
                  <div>Trail assistant & offline KB</div>
                </div>
              </div>
            </div>

            {/* Right: live weather + elevation cards (stacked nicely on mobile) */}
            <div className="w-full max-w-md mx-auto lg:mx-0 flex flex-col justify-end gap-4">
              {/* Summit path sketch */}
              <SummitPathOverlay />

              <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-primary/80 mb-1">Weather now</div>
                    <div className="text-lg font-semibold">Mt. Kalisungan Conditions</div>
                    <div className="text-xs text-muted-foreground">
                      Auto-updated using local weather data for Calauan, Laguna.
                    </div>
                  </div>
                  <div className="flex flex-col items-end text-right text-xs text-muted-foreground">
                    <span>14.1475°N</span>
                    <span>121.3454°E</span>
                    <span>622 m</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <div className="inline-flex items-center gap-2 rounded-full bg-background/50 border border-border/40 px-3 py-1.5">
                    <span className="font-semibold text-foreground">
                      {loading && !weather && '—'}
                      {!loading && weather && `${Math.round(weather.temperature)}°C`}
                      {!loading && !weather && error && 'N/A'}
                    </span>
                    <span className="truncate max-w-[180px]">
                      {weather?.weatherLabel ?? (loading ? 'Checking...' : error ?? 'No data')}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-background/50 border border-border/40 px-3 py-1.5">
                    <Wind className="h-3.5 w-3.5" />
                    <span className="font-semibold text-foreground">{weather ? `${Math.round(weather.windSpeed)} km/h` : '—'}</span>
                    <span>wind</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs sm:text-sm">
                  <div className="rounded-xl bg-background/60 border border-border/40 px-3 py-2 flex flex-col justify-center">
                    <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                      <Mountain className="h-3 w-3" /> Elevation
                    </div>
                    <div className="mt-1 text-lg font-semibold text-foreground leading-tight">
                      622 m
                    </div>
                    <div className="text-[11px] text-muted-foreground">Summit height</div>
                  </div>

                  <div className="rounded-xl bg-background/60 border border-border/40 px-3 py-2 flex flex-col justify-center">
                    <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                      <Wind className="h-3 w-3" /> Weather
                    </div>
                    <div className="mt-1 text-lg font-semibold text-foreground leading-tight">
                      {loading && !weather && '—'}
                      {!loading && weather && `${Math.round(weather.temperature)}°C`}
                      {!loading && !weather && error && 'N/A'}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {weather?.weatherLabel ?? (loading ? 'Checking...' : error ?? 'No data')}
                    </div>
                  </div>

                  <div className="rounded-xl bg-background/60 border border-border/40 px-3 py-2 flex flex-col justify-center">
                    <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                      <Droplets className="h-3 w-3" /> Wind
                    </div>
                    <div className="mt-1 text-lg font-semibold text-foreground leading-tight">
                      {weather ? `${Math.round(weather.windSpeed)} km/h` : '—'}
                    </div>
                    <div className="text-[11px] text-muted-foreground">Ridge gusts</div>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent my-1" />

                <div className="flex flex-col sm:flex-row gap-3 text-[11px] sm:text-xs text-muted-foreground">
                  <div className="flex-1">
                    <div className="text-[11px] uppercase tracking-wide mb-1">Live summit window</div>
                    <div>Best start between <span className="font-medium text-foreground">05:00–07:00</span> for cooler temps and summit views.</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] uppercase tracking-wide mb-1">Safety snapshot</div>
                    <div>
                      Always register at the trailhead, bring <span className="font-medium">2L water</span>, and
                      check ranger advisories in the app.
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile stats strip (shown below cards) */}
              <div className="sm:hidden glass-card rounded-xl px-4 py-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <div>
                  <div className="text-sm font-semibold text-foreground">622 m</div>
                  <div>Summit elevation</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">3 trails</div>
                  <div>Summit • River • Ridge</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Live weather</div>
                  <div>{weather ? 'Auto-updating' : 'Checks on load'}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need for a <span className="text-gradient">Safe Hike</span></h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Advanced technology meets the beauty of nature. Every feature designed for safety, convenience, and adventure.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <TrailGallery />

      {/* Reviews */}
      <HikerReviews />

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container max-w-3xl mx-auto text-center glass-card rounded-2xl p-12 glow-primary">
          <h2 className="text-3xl font-bold mb-4">Ready to Conquer the Summit?</h2>
          <p className="text-muted-foreground mb-8">Create your account, book your hike, and let technology guide your adventure.</p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/register">Create Account</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-4">
        <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Mt. Kalisungan logo" className="h-6 w-6 rounded-full object-cover bg-white/5" />
            <span>Mt. Kalisungan</span>
          </div>
          <div>Calauan, Laguna, Philippines • Thesis Project 2026</div>
        </div>
      </footer>
    </div>
  );
}
