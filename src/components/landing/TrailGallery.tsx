import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Camera, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

import gallerySunrise from '@/assets/gallery-sunrise.jpg';
import galleryJungle from '@/assets/gallery-jungle-trail.jpg';
import gallerySummit from '@/assets/gallery-summit-view.jpg';
import galleryWaterfall from '@/assets/gallery-waterfall.jpg';
import galleryHikers from '@/assets/gallery-hikers.jpg';
import galleryCampsite from '@/assets/gallery-campsite.jpg';

const galleryImages = [
  { src: gallerySunrise, title: 'Sunrise at the Ridge', desc: 'Golden hour breaking through the clouds above the trail' },
  { src: galleryJungle, title: 'Jungle Trail Path', desc: 'Dense tropical foliage along the lower trail sections' },
  { src: gallerySummit, title: 'Summit Panorama', desc: 'Breathtaking 360° view from the peak at 622m' },
  { src: galleryWaterfall, title: 'Hidden Waterfall', desc: 'A refreshing stop along the Scenic Loop trail' },
  { src: galleryHikers, title: 'Summit Celebration', desc: 'Hikers celebrating at the summit marker' },
  { src: galleryCampsite, title: 'Mountain Campsite', desc: 'Overnight camping under the stars on the ridge' },
];

export default function TrailGallery() {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const navigate = (dir: number) => {
    if (lightbox === null) return;
    setLightbox((lightbox + dir + galleryImages.length) % galleryImages.length);
  };

  return (
    <section className="py-24 px-4">
      <div className="container max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm mb-4">
            <Camera className="h-4 w-4" />
            Trail Gallery
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            About <span className="text-primary">Mount Kalisungan</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            Mount Kalisungan is a semi-conical dormant volcano of history, quite a cone-less and adone othece, an amevntnp was good friend,
            and the numerous communally incorporations in its flowge, dith avulturomes nlumnt, ilthe infostrction, dokawhithno favornt
            stubkbured favewop ean oagantwodwenturekimos, gwhinae documenthest folde vante, cant, catienger, the res of Itchi cabeology, cagoror //
            Mount Kalisango, and hnderlinmota: llanom demanstering mentitation arricee at the taloondar, nalooby aldth on webhllove and
            commemorative r nnreatuvns like dnscent hnem.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {galleryImages.map((img, i) => (
            <motion.div
              key={img.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`relative group cursor-pointer overflow-hidden rounded-xl ${
                i === 0 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
              onClick={() => setLightbox(i)}
            >
              <img
                src={img.src}
                alt={img.title}
                className={`w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                  i === 0 ? 'h-64 md:h-full' : 'h-48 md:h-56'
                }`}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-sm font-semibold text-foreground">{img.title}</p>
                <p className="text-xs text-muted-foreground">{img.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View Trail Map button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mt-10"
        >
          <Button asChild size="lg" className="gap-2 px-8">
            <Link to="/map">
              <Map className="h-4 w-4" />
              View Trail Map
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10"
              onClick={() => setLightbox(null)}
              aria-label="Close lightbox"
            >
              <X className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
              onClick={(e) => { e.stopPropagation(); navigate(-1); }}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
              onClick={(e) => { e.stopPropagation(); navigate(1); }}
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            <motion.div
              key={lightbox}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-4xl max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={galleryImages[lightbox].src}
                alt={galleryImages[lightbox].title}
                className="max-h-[75vh] w-auto rounded-xl object-contain"
              />
              <div className="mt-4 text-center">
                <p className="font-semibold text-lg">{galleryImages[lightbox].title}</p>
                <p className="text-sm text-muted-foreground">{galleryImages[lightbox].desc}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
