import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, MessageCircle, Eye } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GearListing {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  price: number;
  currency: string;
  location: string | null;
  images: string[];
  is_sold: boolean;
  seller_name: string;
  contact_method: string | null;
  contact_value: string | null;
  created_at: string;
}

interface GearListingCardProps {
  listing: GearListing;
}

const conditionColors: Record<string, string> = {
  'new': 'bg-green-500/20 text-green-400 border-green-500/30',
  'like-new': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'excellent': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'good': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'fair': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

export const GearListingCard = ({ listing }: GearListingCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const mainImage = listing.images?.[0] || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop';

  return (
    <>
      <Card className="bg-card border-border overflow-hidden group hover:border-primary/50 transition-all duration-300">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={mainImage}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {listing.is_sold && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge variant="destructive" className="text-lg px-4 py-2">SOLD</Badge>
            </div>
          )}
          <Badge 
            variant="outline" 
            className={`absolute top-2 left-2 ${conditionColors[listing.condition] || conditionColors['good']}`}
          >
            {listing.condition.replace('-', ' ')}
          </Badge>
          <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-muted-foreground">
            {formatDate(listing.created_at)}
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="font-semibold text-foreground line-clamp-1 flex-1">
              {listing.title}
            </h3>
            <span className="text-primary font-bold whitespace-nowrap">
              {formatPrice(listing.price, listing.currency)}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {listing.description || 'No description provided'}
          </p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs">
              {listing.category}
            </Badge>
            {listing.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {listing.location}
              </span>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowDetails(true)}
            disabled={listing.is_sold}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{listing.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Image Gallery */}
            <div className="space-y-2">
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={listing.images?.[selectedImage] || mainImage}
                  alt={listing.title}
                  className="w-full h-full object-contain"
                />
              </div>
              {listing.images && listing.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {listing.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${
                        selectedImage === idx ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Price</span>
                <p className="text-2xl font-bold text-primary">
                  {formatPrice(listing.price, listing.currency)}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Condition</span>
                <Badge 
                  variant="outline" 
                  className={`mt-1 ${conditionColors[listing.condition] || conditionColors['good']}`}
                >
                  {listing.condition.replace('-', ' ')}
                </Badge>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Category</span>
                <p className="font-medium">{listing.category}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Location</span>
                <p className="font-medium">{listing.location || 'Not specified'}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <span className="text-sm text-muted-foreground">Description</span>
              <p className="mt-1 text-foreground whitespace-pre-wrap">
                {listing.description || 'No description provided'}
              </p>
            </div>

            {/* Seller Info */}
            <div className="border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Seller</span>
              <p className="font-medium">{listing.seller_name}</p>
              
              {listing.contact_method && listing.contact_value && (
                <Button className="w-full mt-3" disabled={listing.is_sold}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact via {listing.contact_method}: {listing.contact_value}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
