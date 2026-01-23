import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type ItemType = "spot" | "listing" | "product";

interface SavedItem {
  id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  created_at: string;
}

export const useSavedItems = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedItems = [], isLoading } = useQuery({
    queryKey: ["saved-items", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("saved_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SavedItem[];
    },
    enabled: !!user,
  });

  const toggleSaveMutation = useMutation({
    mutationFn: async ({ itemType, itemId }: { itemType: ItemType; itemId: string }) => {
      if (!user) throw new Error("Must be logged in to save items");

      // Check if already saved
      const { data: existing } = await supabase
        .from("saved_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .single();

      if (existing) {
        // Remove from saved
        const { error } = await supabase
          .from("saved_items")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
        return { action: "removed" };
      } else {
        // Add to saved
        const { error } = await supabase.from("saved_items").insert({
          user_id: user.id,
          item_type: itemType,
          item_id: itemId,
        });
        if (error) throw error;
        return { action: "saved" };
      }
    },
    onSuccess: (result, { itemType }) => {
      queryClient.invalidateQueries({ queryKey: ["saved-items"] });
      const itemName = itemType === "spot" ? "spot" : itemType === "listing" ? "listing" : "product";
      toast({
        title: result.action === "saved" ? "Saved!" : "Removed",
        description:
          result.action === "saved"
            ? `${itemName.charAt(0).toUpperCase() + itemName.slice(1)} added to your favorites.`
            : `${itemName.charAt(0).toUpperCase() + itemName.slice(1)} removed from favorites.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isSaved = (itemType: ItemType, itemId: string) => {
    return savedItems.some(
      (item) => item.item_type === itemType && item.item_id === itemId
    );
  };

  const toggleSave = (itemType: ItemType, itemId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save items to your favorites.",
        variant: "destructive",
      });
      return;
    }
    toggleSaveMutation.mutate({ itemType, itemId });
  };

  const getSavedByType = (itemType: ItemType) => {
    return savedItems.filter((item) => item.item_type === itemType);
  };

  return {
    savedItems,
    isLoading,
    isSaved,
    toggleSave,
    getSavedByType,
    isToggling: toggleSaveMutation.isPending,
  };
};
