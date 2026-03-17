import { motion } from 'framer-motion';

const steps = [
  {
    number: 1,
    title: 'Reserve a Hiking Slot',
    desc: 'Register via Prayerbundok in your application.',
  },
  {
    number: 2,
    title: 'Wait for Reservation Confirmation',
    desc: 'Approved reservation needed to proceed.',
  },
  {
    number: 3,
    title: 'Register at Barangay Lamot II',
    desc: 'Pay fees, leave ID, attend briefing for the hike.',
  },
  {
    number: 4,
    title: 'Start the Hike with a Guide',
    desc: 'Proceed to drop-off point with your guide.',
  },
  {
    number: 5,
    title: 'Check Out After the Hike',
    desc: 'Return to registration for checkout.',
  },
];

function StepCard({ step, delay }: { step: (typeof steps)[number]; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.45 }}
      className="flex gap-4"
    >
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
          {step.number}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
      </div>
    </motion.div>
  );
}

export default function ReservingGuide() {
  return (
    <section className="py-20 px-4">
      <div className="container max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl md:text-3xl font-bold leading-snug">
            Simple Guide to{' '}
            <span className="text-primary">Reserving</span>{' '}
            and{' '}
            <span className="text-accent">Completing Your Hike Safely</span>
          </h2>
        </motion.div>

        {/* Top row — 3 steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
          {steps.slice(0, 3).map((step, i) => (
            <StepCard key={step.number} step={step} delay={i * 0.1} />
          ))}
        </div>

        {/* Bottom row — 2 steps centered */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:max-w-2xl mx-auto">
          {steps.slice(3).map((step, i) => (
            <StepCard key={step.number} step={step} delay={(i + 3) * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}
