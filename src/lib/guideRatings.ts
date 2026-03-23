export interface GuideReview {
  rating: number;
  comment: string;
  hikerName: string;
  date: string;
}

export interface GuideRating {
  guideId: string;
  guideName: string;
  trail: string;
  totalRating: number;
  reviewCount: number;
  avgRating: number;
  recentReviews: GuideReview[];
}

const GUIDE_RATINGS_KEY = 'kalisungan_guide_ratings_v1';

const SEED_RATINGS: GuideRating[] = [
  {
    guideId: 'g1',
    guideName: 'Rodel Manalansan',
    trail: 'Summit Trail',
    totalRating: 230.4,
    reviewCount: 48,
    avgRating: 4.8,
    recentReviews: [
      { rating: 5, comment: 'Very knowledgeable and patient. Best guide!', hikerName: 'Maria S.', date: '2026-03-15' },
      { rating: 5, comment: 'Made the summit hike so much easier.', hikerName: 'Jun R.', date: '2026-03-08' },
    ],
  },
  {
    guideId: 'g2',
    guideName: 'Bong Villarosa',
    trail: 'Ridge Route',
    totalRating: 285.2,
    reviewCount: 62,
    avgRating: 4.6,
    recentReviews: [
      { rating: 5, comment: 'Excellent, very professional and safe.', hikerName: 'Ana P.', date: '2026-03-18' },
      { rating: 4, comment: 'Knew the trail perfectly. Highly recommend.', hikerName: 'Carlo M.', date: '2026-03-12' },
    ],
  },
  {
    guideId: 'g3',
    guideName: 'Nilo Santos',
    trail: 'Scenic Loop',
    totalRating: 157.5,
    reviewCount: 35,
    avgRating: 4.5,
    recentReviews: [
      { rating: 5, comment: 'Great experience! Nilo was very helpful.', hikerName: 'Patricia V.', date: '2026-03-01' },
      { rating: 4, comment: 'Friendly and informative throughout the hike.', hikerName: 'Roberto A.', date: '2026-02-22' },
    ],
  },
  {
    guideId: 'g4',
    guideName: 'Allan Reyes',
    trail: 'Summit Trail',
    totalRating: 116.1,
    reviewCount: 27,
    avgRating: 4.3,
    recentReviews: [
      { rating: 4, comment: 'Good guide, knows the area well.', hikerName: 'Diego C.', date: '2026-02-20' },
    ],
  },
];

export function loadGuideRatings(): GuideRating[] {
  try {
    const stored = localStorage.getItem(GUIDE_RATINGS_KEY);
    if (stored) return JSON.parse(stored) as GuideRating[];
  } catch { /* fallthrough */ }
  localStorage.setItem(GUIDE_RATINGS_KEY, JSON.stringify(SEED_RATINGS));
  return SEED_RATINGS;
}

export function getTop3Guides(): GuideRating[] {
  return [...loadGuideRatings()]
    .sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount)
    .slice(0, 3);
}

export function addGuideRating(
  guideId: string,
  guideName: string,
  trail: string,
  rating: number,
  comment: string,
  hikerName: string,
): void {
  const ratings = loadGuideRatings();
  const guide = ratings.find((g) => g.guideId === guideId);
  if (guide) {
    guide.totalRating += rating;
    guide.reviewCount += 1;
    guide.avgRating = parseFloat((guide.totalRating / guide.reviewCount).toFixed(2));
    guide.recentReviews.unshift({ rating, comment, hikerName, date: new Date().toISOString().split('T')[0] });
    guide.recentReviews = guide.recentReviews.slice(0, 5);
  } else {
    ratings.push({
      guideId,
      guideName,
      trail,
      totalRating: rating,
      reviewCount: 1,
      avgRating: rating,
      recentReviews: [{ rating, comment, hikerName, date: new Date().toISOString().split('T')[0] }],
    });
  }
  localStorage.setItem(GUIDE_RATINGS_KEY, JSON.stringify(ratings));
}

export function renderStars(avg: number): string {
  return '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
}
