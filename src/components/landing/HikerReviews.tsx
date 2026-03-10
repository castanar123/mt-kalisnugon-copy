import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, MessageSquarePlus, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  trail_name: string;
  review_text: string;
  created_at: string;
}

const fallbackReviews: Review[] = [
  { id: '1', reviewer_name: 'Maria Santos', rating: 5, trail_name: 'Summit Trail', review_text: 'The trail was absolutely breathtaking! The AI assistant helped us prepare perfectly — it even warned us about the slippery section near the summit.', created_at: '2026-02-15' },
  { id: '2', reviewer_name: 'Juan Dela Cruz', rating: 5, trail_name: 'Ridge Route', review_text: 'As a first-time hiker, the offline AI guide was a lifesaver. Even without signal on the mountain, I could ask questions and get accurate answers.', created_at: '2026-01-20' },
  { id: '3', reviewer_name: 'Angela Reyes', rating: 4, trail_name: 'Scenic Loop', review_text: 'Beautiful sunrise hike! The booking system was smooth and the QR code made check-in super fast. My family felt safe knowing the ranger tracking was active.', created_at: '2025-12-10' },
  { id: '4', reviewer_name: 'Carlos Mendoza', rating: 5, trail_name: 'Summit Trail', review_text: 'I\'ve hiked Kalisungan many times but this tracking system changed everything. Real-time elevation profile and AI chatbot with offline mode — like a personal guide!', created_at: '2026-01-05' },
  { id: '5', reviewer_name: 'Patricia Villanueva', rating: 5, trail_name: 'Ridge Route', review_text: 'Brought a group of 8 friends and the group booking feature was perfect. The system even reminded us what to bring based on the weather forecast.', created_at: '2026-02-01' },
  { id: '6', reviewer_name: 'Roberto Aquino', rating: 4, trail_name: 'Scenic Loop', review_text: 'Great trail conditions info from ranger reports. The AI assistant gave me detailed info about nearby food spots even when offline. Very impressed.', created_at: '2025-11-25' },
];

function StarRating({ rating, interactive, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 transition-colors ${
            i < rating ? 'text-primary fill-primary' : 'text-muted-foreground/30'
          } ${interactive ? 'cursor-pointer hover:text-primary' : ''}`}
          onClick={() => interactive && onChange?.(i + 1)}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const date = new Date(review.created_at);
  const formatted = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="glass-card rounded-xl p-6 flex flex-col hover:border-primary/20 transition-colors"
    >
      <Quote className="h-7 w-7 text-primary/15 mb-3" />
      <p className="text-sm text-muted-foreground flex-1 mb-4 leading-relaxed">"{review.review_text}"</p>
      <StarRating rating={review.rating} />
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
        <div>
          <p className="font-semibold text-sm">{review.reviewer_name}</p>
          <p className="text-xs text-muted-foreground">{formatted}</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{review.trail_name}</span>
      </div>
    </motion.div>
  );
}

function ReviewForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [trail, setTrail] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Please sign in to submit a review'); return; }
    if (!name.trim() || !trail || !text.trim()) { toast.error('Please fill in all fields'); return; }
    if (text.trim().length < 10) { toast.error('Review must be at least 10 characters'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      user_id: user.id,
      reviewer_name: name.trim().slice(0, 100),
      trail_name: trail,
      rating,
      review_text: text.trim().slice(0, 500),
    });

    if (error) {
      toast.error('Failed to submit review');
      console.error(error);
    } else {
      toast.success('Review submitted! It will appear after admin approval.');
      setName(''); setTrail(''); setRating(5); setText('');
      onSubmitted();
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
        <Select value={trail} onValueChange={setTrail}>
          <SelectTrigger><SelectValue placeholder="Trail hiked" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Summit Trail">Summit Trail</SelectItem>
            <SelectItem value="Ridge Route">Ridge Route</SelectItem>
            <SelectItem value="Scenic Loop">Scenic Loop</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1.5 block">Your rating</label>
        <StarRating rating={rating} interactive onChange={setRating} />
      </div>
      <Textarea
        placeholder="Share your hiking experience..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={500}
        rows={4}
      />
      <p className="text-xs text-muted-foreground">{text.length}/500 characters</p>
      <Button type="submit" disabled={submitting || !user} className="w-full">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
        {user ? 'Submit Review' : 'Sign in to Review'}
      </Button>
    </form>
  );
}

export default function HikerReviews() {
  const [reviews, setReviews] = useState<Review[]>(fallbackReviews);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, reviewer_name, rating, trail_name, review_text, created_at')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (!error && data && data.length > 0) {
      setReviews(data);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(152_60%_42%/0.04)_0%,_transparent_70%)]" />
      <div className="container max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Hikers Are <span className="text-gradient">Saying</span></h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            Real experiences from adventurers who conquered Mount Kalisungan.
          </p>
          <div className="inline-flex items-center gap-3 glass-card rounded-full px-5 py-2.5">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 text-primary fill-primary" />
              ))}
            </div>
            <span className="font-bold text-lg">{avgRating}</span>
            <span className="text-sm text-muted-foreground">from {reviews.length} reviews</span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((review, i) => (
            <ReviewCard key={review.id} review={review} index={i} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg" className="gap-2">
                <MessageSquarePlus className="h-5 w-5" />
                Share Your Experience
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
              </DialogHeader>
              <ReviewForm onSubmitted={() => { setDialogOpen(false); fetchReviews(); }} />
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </section>
  );
}
