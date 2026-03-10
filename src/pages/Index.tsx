import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mountain, Map, Bot, CalendarCheck, Shield, Navigation, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import heroImage from '@/assets/mt-kalisungan-hero.jpg';
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

export default function Index() {
  return (
    <div className="min-h-screen">
      {/* Hero with Image */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Mount Kalisungan panoramic view showing lush green trails and dramatic sunset clouds in Calauan, Laguna, Philippines"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
          >
            <Mountain className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Mount Kalisungan Tourist Tracking System</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Explore <span className="text-gradient">Mount Kalisungan</span> <br />
            Like Never Before
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Advanced trail navigation, AI-powered assistance, and real-time tracking for hikers,
            rangers, and administrators. Built for Mount Kalisungan in Calauan, Laguna, Philippines.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-base px-8 glow-primary">
              <Link to="/register">Start Your Adventure</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8">
              <Link to="/map">Explore Trail Map</Link>
            </Button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-muted-foreground text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">622m</div>
              <div>Elevation</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">3</div>
              <div>Trail Routes</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">AI</div>
              <div>Powered</div>
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
            <Mountain className="h-5 w-5 text-primary" />
            <span>Mt. Kalisungan Tourist Tracking System</span>
          </div>
          <div>Calauan, Laguna, Philippines • Thesis Project 2026</div>
        </div>
      </footer>
    </div>
  );
}
