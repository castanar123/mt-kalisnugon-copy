import { motion } from 'framer-motion';
import { UserPlus, ClipboardCheck, MapPin, Footprints, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    number: 1,
    icon: UserPlus,
    title: 'Reserve a Hiking Slot',
    desc: 'Register via Prayerbundok in your application.',
    color: 'from-emerald-500 to-green-600',
  },
  {
    number: 2,
    icon: ClipboardCheck,
    title: 'Wait for Reservation Confirmation',
    desc: 'Approved reservation needed to proceed.',
    color: 'from-sky-500 to-blue-600',
  },
  {
    number: 3,
    icon: MapPin,
    title: 'Register at Barangay Lamot II',
    desc: 'Pay fees, leave ID, attend briefing for the hike.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    number: 4,
    icon: Footprints,
    title: 'Start the Hike with a Guide',
    desc: 'Proceed to drop-off point with your guide.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    number: 5,
    icon: CheckCircle2,
    title: 'Check Out After the Hike',
    desc: 'Return to registration for checkout.',
    color: 'from-rose-500 to-pink-600',
  },
];

function StepCard({ step, delay, isLast }: { step: (typeof steps)[number]; delay: number; isLast: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.45 }}
      className={`flex gap-5 relative ${!isLast ? 'timeline-connector' : ''}`}
    >
      <div className="flex-shrink-0 mt-0.5 relative z-10">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
          <step.icon className="h-4.5 w-4.5 text-white" />
        </div>
      </div>
      <div className="cinematic-card p-4 flex-1 card-gradient-border">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-bold text-primary/70 uppercase tracking-wider">Step {step.number}</span>
        </div>
        <h3 className="font-bold text-base md:text-lg mb-1">{step.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
      </div>
    </motion.div>
  );
}

export default function ReservingGuide() {
  return (
    <section className="py-24 px-4 relative overflow-hidden section-grain">
      {/* Decorative mountain silhouette */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-[0.03] pointer-events-none">
        <svg viewBox="0 0 1440 320" className="w-full h-full" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,128C960,128,1056,192,1152,208C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
      </div>

      <div className="container max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl md:text-4xl font-bold leading-snug tracking-tight">
            Simple Guide to{' '}
            <span className="text-gradient">Reserving</span>{' '}
            and{' '}
            <span className="text-gradient">Completing Your Hike Safely</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Follow these five simple steps to book and complete your Mt. Kalisungan adventure.
          </p>
        </motion.div>

        {/* Top row — 3 steps as timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
          {steps.slice(0, 3).map((step, i) => (
            <StepCard key={step.number} step={step} delay={i * 0.1} isLast={false} />
          ))}
        </div>

        {/* Bottom row — 2 steps centered */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:max-w-2xl mx-auto">
          {steps.slice(3).map((step, i) => (
            <StepCard key={step.number} step={step} delay={(i + 3) * 0.1} isLast={i === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
