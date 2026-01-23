export interface AffiliateProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  image: string;
  affiliateUrl: string;
  source: 'amazon' | 'clickbank' | 'other';
  category: string;
  rating?: number;
  badge?: string;
}

// Sample affiliate products - Replace URLs with your actual affiliate links
export const affiliateProducts: AffiliateProduct[] = [
  {
    id: 'af-1',
    title: 'Shimano Stradic FL Spinning Reel',
    description: 'Premium spinning reel with Hagane body and X-Protect water resistance',
    price: '$249.99',
    originalPrice: '$299.99',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300&h=300&fit=crop',
    affiliateUrl: 'https://amazon.com/dp/example1?tag=YOUR_AFFILIATE_ID',
    source: 'amazon',
    category: 'Reels',
    rating: 4.8,
    badge: 'Best Seller'
  },
  {
    id: 'af-2',
    title: 'G. Loomis E6X Casting Rod',
    description: 'High-performance casting rod with Multi-Taper Design technology',
    price: '$199.99',
    image: 'https://images.unsplash.com/photo-1500463959177-e0869687df26?w=300&h=300&fit=crop',
    affiliateUrl: 'https://amazon.com/dp/example2?tag=YOUR_AFFILIATE_ID',
    source: 'amazon',
    category: 'Rods',
    rating: 4.7
  },
  {
    id: 'af-3',
    title: 'Plano Guide Series Tackle Bag',
    description: 'Large capacity tackle bag with 5 utility boxes included',
    price: '$89.99',
    originalPrice: '$119.99',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
    affiliateUrl: 'https://amazon.com/dp/example3?tag=YOUR_AFFILIATE_ID',
    source: 'amazon',
    category: 'Tackle Boxes',
    rating: 4.5,
    badge: 'Deal'
  },
  {
    id: 'af-4',
    title: 'Complete Bass Fishing Mastery Course',
    description: 'Learn pro techniques for catching more bass - 40+ video lessons',
    price: '$47.00',
    originalPrice: '$97.00',
    image: 'https://images.unsplash.com/photo-1545816250-e12bedba42ba?w=300&h=300&fit=crop',
    affiliateUrl: 'https://clickbank.com/example-course?hop=YOUR_AFFILIATE_ID',
    source: 'clickbank',
    category: 'Courses',
    badge: '52% Off'
  },
  {
    id: 'af-5',
    title: 'PowerPro Braided Fishing Line 300yd',
    description: 'Ultra-strong braided line with enhanced sensitivity',
    price: '$24.99',
    image: 'https://images.unsplash.com/photo-1516962126636-27ad087061cc?w=300&h=300&fit=crop',
    affiliateUrl: 'https://amazon.com/dp/example4?tag=YOUR_AFFILIATE_ID',
    source: 'amazon',
    category: 'Line',
    rating: 4.6
  },
  {
    id: 'af-6',
    title: 'Humminbird Helix 7 Fish Finder',
    description: 'GPS fishfinder with CHIRP sonar and down imaging',
    price: '$449.99',
    originalPrice: '$549.99',
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=300&h=300&fit=crop',
    affiliateUrl: 'https://amazon.com/dp/example5?tag=YOUR_AFFILIATE_ID',
    source: 'amazon',
    category: 'Electronics',
    rating: 4.4,
    badge: 'Top Rated'
  },
  {
    id: 'af-7',
    title: 'Ultimate Fly Tying Guide eBook',
    description: 'Step-by-step patterns for 100+ proven flies',
    price: '$19.99',
    originalPrice: '$39.99',
    image: 'https://images.unsplash.com/photo-1534438097545-a2c22c57f2ad?w=300&h=300&fit=crop',
    affiliateUrl: 'https://clickbank.com/flytying?hop=YOUR_AFFILIATE_ID',
    source: 'clickbank',
    category: 'eBooks',
    badge: '50% Off'
  },
  {
    id: 'af-8',
    title: 'Costa Del Mar Fantail Sunglasses',
    description: 'Polarized sunglasses with 580G glass lenses for fishing',
    price: '$269.00',
    image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=300&h=300&fit=crop',
    affiliateUrl: 'https://amazon.com/dp/example6?tag=YOUR_AFFILIATE_ID',
    source: 'amazon',
    category: 'Apparel',
    rating: 4.9
  }
];

export const affiliateCategories = [
  'All',
  'Reels',
  'Rods',
  'Tackle Boxes',
  'Line',
  'Electronics',
  'Apparel',
  'Courses',
  'eBooks'
];
