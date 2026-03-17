import { motion } from 'framer-motion';
import { Route, TrendingUp, Clock, BarChart2 } from 'lucide-react';

const trailStats = [
  {
    icon: Route,
    label: 'Trail Distance',
    value: '12 km',
    desc: 'Total traversable distance covering all trail segments.',
  },
  {
    icon: TrendingUp,
    label: 'Elevation Gain',
    value: '622 m',
    desc: 'Maximum point above sea level along the summit route.',
  },
  {
    icon: Clock,
    label: 'Estimated Hiking Time',
    value: '4-5 hours',
    desc: 'Estimated hiking time is 4-6 hours depending on pace.',
  },
  {
    icon: BarChart2,
    label: 'Difficulty Level',
    value: 'Moderate',
    desc: 'Difficulty spans beginner-friendly to base. Moderate overall.',
  },
];

export default function TrailOverview() {
  return (
    <section className="py-20 px-4">
      <div className="container max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold text-center mb-12"
        >
          Trail Overview
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {trailStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              className="glass-card rounded-xl p-6 hover:border-primary/25 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{stat.label}</p>
              <p className="text-2xl font-bold mb-2">{stat.value}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{stat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
