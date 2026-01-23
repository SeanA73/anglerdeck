import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Star } from "lucide-react";
import { AffiliateProduct } from "@/data/affiliateProducts";

interface AffiliateProductCardProps {
  product: AffiliateProduct;
}

const sourceColors: Record<string, string> = {
  'amazon': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'clickbank': 'bg-green-500/20 text-green-400 border-green-500/30',
  'other': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export const AffiliateProductCard = ({ product }: AffiliateProductCardProps) => {
  const handleClick = () => {
    window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="bg-card border-border overflow-hidden group hover:border-primary/50 transition-all duration-300">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.badge && (
          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
            {product.badge}
          </Badge>
        )}
        <Badge 
          variant="outline" 
          className={`absolute top-2 right-2 ${sourceColors[product.source]}`}
        >
          {product.source}
        </Badge>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-2 mb-2 min-h-[2.5rem]">
          {product.title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {product.description}
        </p>
        
        {product.rating && (
          <div className="flex items-center gap-1 mb-3">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{product.rating}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl font-bold text-primary">{product.price}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {product.originalPrice}
            </span>
          )}
        </div>
        
        <Badge variant="secondary" className="text-xs mb-3">
          {product.category}
        </Badge>
        
        <Button 
          className="w-full mt-2"
          onClick={handleClick}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Deal
        </Button>
      </CardContent>
    </Card>
  );
};
