import { MapPin, Heart, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSavedItems } from "@/hooks/useSavedItems";
import { useAllSpots, useSpots } from "@/hooks/useSpots";

const SavedSpotsList = () => {
  const { getSavedByType, toggleSave, isLoading } = useSavedItems();
  // A spot the user saved may since have fallen out of publication — a review
  // was rejected, or it was published from data that has since been corrected.
  // Resolving against every spot keeps their list intact: dropping the row would
  // read as "we lost your data", and dropping it silently is worse. The card
  // still says the spot is unavailable and stops linking to a page that no
  // longer exists, so nothing unpublished is presented as browsable content.
  const { data: allSpots = [] } = useAllSpots();
  const { data: publishedSpots = [] } = useSpots();
  const publishedIds = new Set(publishedSpots.map((s) => s.id));

  const savedSpots = getSavedByType("spot");

  // Saved items store the spot slug (older rows may store the numeric id)
  const spotDetails = savedSpots
    .map((saved) => {
      const spot = allSpots.find(
        (s) => s.slug === saved.item_id || String(s.id) === saved.item_id
      );
      if (!spot) return null;
      return {
        ...spot,
        savedAt: saved.created_at,
        isPublished: publishedIds.has(spot.id),
        // The exact value the row is keyed by. toggleSave matches item_id
        // literally, so passing spot.id here inserted a second row keyed by the
        // numeric id instead of removing the slug-keyed one — Remove appeared to
        // do nothing. It matters more now that Remove is the only action an
        // unpublished saved spot offers.
        savedItemId: saved.item_id,
      };
    })
    .filter(Boolean);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse flex gap-4">
                <div className="w-24 h-24 bg-muted rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (spotDetails.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Heart className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">No Saved Spots</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Start exploring and save your favorite fishing spots to find them here.
          </p>
          <Button asChild variant="outline">
            <Link to="/spots">Explore Spots</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {spotDetails.map((spot) => {
        if (!spot) return null;
        return (
          <Card key={spot.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="flex gap-4">
                <div className="w-28 h-28 shrink-0">
                  <img
                    src={spot.image}
                    alt={spot.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 py-3 pr-4">
                  <div className="flex items-start justify-between">
                    <div>
                      {spot.isPublished ? (
                        <Link
                          to={`/spot/${spot.slug}`}
                          className="font-semibold text-foreground hover:text-accent transition-colors"
                        >
                          {spot.title}
                        </Link>
                      ) : (
                        <span className="font-semibold text-foreground">
                          {spot.title}
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {spot.location}
                      </div>
                      {!spot.isPublished && (
                        <p className="text-sm text-muted-foreground mt-2">
                          This spot's page is offline while we verify its access
                          details and local rules. It stays in your saved list,
                          and comes back as soon as the page does.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSave("spot", spot.savedItemId)}
                      className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                    >
                      <Heart className="w-4 h-4 mr-1 fill-current" />
                      Remove
                    </Button>
                    {spot.isPublished && (
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/spot/${spot.slug}`}>
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SavedSpotsList;
