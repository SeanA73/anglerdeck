import { useQuery } from "@tanstack/react-query";
import { Fish, Calendar, MapPin, Scale, Ruler } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const CatchHistoryList = () => {
  const { user } = useAuth();

  const { data: catches = [], isLoading } = useQuery({
    queryKey: ["user-catches", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("catch_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("caught_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse flex gap-4">
                <div className="w-20 h-20 bg-muted rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-muted rounded w-1/3"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (catches.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Fish className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">No Catches Yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Start logging your catches to track your fishing adventures.
          </p>
          <Button asChild variant="outline">
            <Link to="/catches">Log Your First Catch</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {catches.map((catchItem) => (
        <Card key={catchItem.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="flex gap-4">
              {catchItem.photo_url ? (
                <div className="w-24 h-24 shrink-0">
                  <img
                    src={catchItem.photo_url}
                    alt={catchItem.species}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 shrink-0 bg-muted flex items-center justify-center">
                  <Fish className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 py-3 pr-4">
                <h4 className="font-semibold text-foreground">{catchItem.species}</h4>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(catchItem.caught_at), "MMM d, yyyy")}
                  </div>
                  {catchItem.location_name && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {catchItem.location_name}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  {catchItem.weight && (
                    <div className="flex items-center gap-1 text-foreground">
                      <Scale className="w-3.5 h-3.5 text-muted-foreground" />
                      {catchItem.weight} {catchItem.weight_unit || "lbs"}
                    </div>
                  )}
                  {catchItem.length && (
                    <div className="flex items-center gap-1 text-foreground">
                      <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                      {catchItem.length} {catchItem.length_unit || "in"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {catches.length >= 10 && (
        <div className="text-center">
          <Button asChild variant="outline">
            <Link to="/catches">View All Catches</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default CatchHistoryList;
