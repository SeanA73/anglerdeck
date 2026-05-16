export interface FishingGuide {
  id: string;
  name: string;
  location: string;
  country: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  priceRange: string;
  image: string;
  bio: string;
  contactUrl?: string;
  featured?: boolean;
}

export const guides: FishingGuide[] = [
  {
    id: 'guide-1',
    name: 'Mike Thompson',
    location: 'Colorado Rockies',
    country: 'US',
    specialties: ['Trout', 'Fly Fishing'],
    rating: 4.9,
    reviewCount: 127,
    priceRange: '$350–$500/day',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop',
    bio: '25 years guiding on Colorado mountain streams. Specializes in rainbow and brown trout on fly.',
    featured: true,
  },
  {
    id: 'guide-2',
    name: 'Sarah Chen',
    location: 'Florida Keys',
    country: 'US',
    specialties: ['Tarpon', 'Bonefish', 'Saltwater'],
    rating: 4.8,
    reviewCount: 89,
    priceRange: '$400–$650/day',
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=400&fit=crop',
    bio: 'USCG licensed captain. Light tackle and fly fishing in the Keys flats.',
    featured: true,
  },
  {
    id: 'guide-3',
    name: 'James O\'Brien',
    location: 'Queensland Coast',
    country: 'AU',
    specialties: ['Barramundi', 'Reef Fishing'],
    rating: 4.7,
    reviewCount: 64,
    priceRange: 'AUD $300–$450/day',
    image: 'https://images.unsplash.com/photo-1545816250-e12bedba42ba?w=400&h=400&fit=crop',
    bio: 'Local expert for tropical estuaries and offshore reef trips.',
  },
  {
    id: 'guide-4',
    name: 'Elena Rossi',
    location: 'Lake Como',
    country: 'IT',
    specialties: ['Pike', 'Perch', 'Freshwater'],
    rating: 4.9,
    reviewCount: 42,
    priceRange: '€250–€400/day',
    image: 'https://images.unsplash.com/photo-1534438097545-a2c22c57f2ad?w=400&h=400&fit=crop',
    bio: 'European freshwater specialist. Boat and shore fishing on alpine lakes.',
  },
];
