import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Fish,
  Plus,
  MapPin,
  Calendar,
  Scale,
  Ruler,
  Camera,
  Trash2,
  Edit2,
  Lock,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSpots } from "@/hooks/useSpots";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { UsageMeter } from "@/components/UsageMeter";
import { SUBSCRIPTION_TIERS } from "@/lib/stripe";
import { useAuth } from "@/contexts/AuthContext";
import { SEO } from "@/components/SEO";

interface CatchLog {
  id: string;
  species: string;
  weight: number | null;
  weight_unit: string;
  length: number | null;
  length_unit: string;
  photo_url: string | null;
  notes: string | null;
  caught_at: string;
  location_name: string | null;
  spot_id: number | null;
  created_at: string;
}

const speciesOptions = [
  "Bass",
  "Trout",
  "Salmon",
  "Walleye",
  "Pike",
  "Catfish",
  "Perch",
  "Carp",
  "Tuna",
  "Marlin",
  "Snapper",
  "Other",
];

const CatchLog = () => {
  const { data: spots = [] } = useSpots();
  const getSpotById = (id: number) => spots.find((s) => s.id === id);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCatch, setEditingCatch] = useState<CatchLog | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { subscription, usageStats, hasReachedLimit, getRemainingUsage } = useSubscription();

  const catchesLimit = subscription
    ? SUBSCRIPTION_TIERS[subscription.tier].limits.catchesPerMonth
    : 5;

  const [formData, setFormData] = useState({
    species: "",
    weight: "",
    weight_unit: "lbs",
    length: "",
    length_unit: "in",
    notes: "",
    location_name: "",
    spot_id: "",
    caught_at: new Date().toISOString().split("T")[0],
  });

  // Fetch catches
  const { data: catches = [], isLoading, error, refetch } = useQuery({
    queryKey: ["catches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catch_logs")
        .select("*")
        .order("caught_at", { ascending: false });

      if (error) throw error;
      return data as CatchLog[];
    },
  });

  // Handle opening the dialog - check limits first
  const handleOpenDialog = () => {
    if (!editingCatch && hasReachedLimit('catches')) {
      setShowUpgradePrompt(true);
      return;
    }
    setIsDialogOpen(true);
  };

  // Upload photo
  const uploadPhoto = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `catches/${fileName}`;

    const { error } = await supabase.storage
      .from("catch-photos")
      .upload(filePath, file);

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("catch-photos")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  // Create/Update catch mutation
  const saveCatchMutation = useMutation({
    mutationFn: async (data: typeof formData & { photo_url?: string | null }) => {
      let photoUrl = editingCatch?.photo_url || null;

      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile);
      }

      const catchData = {
        species: data.species,
        weight: data.weight ? parseFloat(data.weight) : null,
        weight_unit: data.weight_unit,
        length: data.length ? parseFloat(data.length) : null,
        length_unit: data.length_unit,
        notes: data.notes || null,
        location_name: data.location_name || null,
        spot_id: data.spot_id ? parseInt(data.spot_id) : null,
        caught_at: data.caught_at,
        photo_url: photoUrl,
      };

      if (editingCatch) {
        const { error } = await supabase
          .from("catch_logs")
          .update(catchData)
          .eq("id", editingCatch.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("catch_logs").insert(catchData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catches"] });
      queryClient.invalidateQueries({ queryKey: ["usage-stats"] });
      toast.success(editingCatch ? "Catch updated!" : "Catch logged!");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to save catch");
      console.error(error);
    },
  });

  // Delete catch mutation
  const deleteCatchMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("catch_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catches"] });
      toast.success("Catch deleted");
    },
    onError: () => {
      toast.error("Failed to delete catch");
    },
  });

  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // ... (keep existing hooks and mutations)

  const resetForm = () => {
    setFormData({
      species: "",
      weight: "",
      weight_unit: "lbs",
      length: "",
      length_unit: "in",
      notes: "",
      location_name: "",
      spot_id: "",
      caught_at: new Date().toISOString().split("T")[0],
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setEditingCatch(null);
    setStep(1);
  };

  const handleEdit = (catch_: CatchLog) => {
    setEditingCatch(catch_);
    setFormData({
      species: catch_.species,
      weight: catch_.weight?.toString() || "",
      weight_unit: catch_.weight_unit || "lbs",
      length: catch_.length?.toString() || "",
      length_unit: catch_.length_unit || "in",
      notes: catch_.notes || "",
      location_name: catch_.location_name || "",
      spot_id: catch_.spot_id?.toString() || "",
      caught_at: catch_.caught_at.split("T")[0],
    });
    setPhotoPreview(catch_.photo_url);
    setIsDialogOpen(true);
    setStep(1);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.species) {
      toast.error("Please select a species");
      return;
    }
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < totalSteps) {
      nextStep();
      return;
    }
    saveCatchMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="My Catches" description="Log your catches, track your fishing history, and analyze what's working. A private catch journal for AnglerDeck subscribers." canonicalPath="/catches" noIndex />
      <Header />

      {/* ... (Upgrade Prompt kept same) ... */}
      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        type="limit_reached"
        limitType="catches"
        currentUsage={usageStats?.catchesLoggedThisMonth || 0}
        limit={catchesLimit === Infinity ? 999 : catchesLimit}
      />

      <main className="flex-1 container mx-auto px-4 pb-8 pt-24">
        {/* ... (Header section kept same) ... */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Fish className="w-8 h-8 text-primary" />
                Catch Log
              </h1>
              <p className="text-muted-foreground mt-1">
                Record and track all your fishing catches
              </p>
              {/* Usage meter for free users */}
              {user && subscription?.tier === 'free' && (
                <div className="mt-3 max-w-xs">
                  <UsageMeter
                    type="catches"
                    current={usageStats?.catchesLoggedThisMonth || 0}
                    limit={catchesLimit}
                  />
                </div>
              )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              if (open && !editingCatch && hasReachedLimit('catches')) {
                setShowUpgradePrompt(true);
                return;
              }
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="lg" className="relative">
                  {hasReachedLimit('catches') && !editingCatch && (
                    <Lock className="w-4 h-4 mr-2" />
                  )}
                  <Plus className="w-5 h-5 mr-2" /> Log a Catch
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCatch ? "Edit Catch" : "Log New Catch"} - Step {step} of {totalSteps}
                  </DialogTitle>
                </DialogHeader>

                {/* Progress Bar */}
                <div className="w-full bg-muted h-2 rounded-full mb-4">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(step / totalSteps) * 100}%` }}
                  />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Step 1: Photo & Species */}
                  {step === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div>
                        <Label>Photo</Label>
                        <div className="mt-2">
                          {photoPreview ? (
                            <div className="relative">
                              <img
                                src={photoPreview}
                                alt="Catch preview"
                                className="w-full h-40 object-cover rounded-lg"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="absolute top-2 right-2"
                                onClick={() => {
                                  setPhotoFile(null);
                                  setPhotoPreview(null);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                              <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                              <span className="text-sm text-muted-foreground">
                                Click to upload photo
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePhotoChange}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label>Species *</Label>
                        <Select
                          value={formData.species}
                          onValueChange={(value) =>
                            setFormData({ ...formData, species: value })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select species" />
                          </SelectTrigger>
                          <SelectContent>
                            {speciesOptions.map((species) => (
                              <SelectItem key={species} value={species}>
                                {species}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Weight, Length, Date */}
                  {step === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <Label>Weight</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Weight"
                            value={formData.weight}
                            onChange={(e) =>
                              setFormData({ ...formData, weight: e.target.value })
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Unit</Label>
                          <Select
                            value={formData.weight_unit}
                            onValueChange={(value) =>
                              setFormData({ ...formData, weight_unit: value })
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lbs">lbs</SelectItem>
                              <SelectItem value="kg">kg</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <Label>Length</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Length"
                            value={formData.length}
                            onChange={(e) =>
                              setFormData({ ...formData, length: e.target.value })
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Unit</Label>
                          <Select
                            value={formData.length_unit}
                            onValueChange={(value) =>
                              setFormData({ ...formData, length_unit: value })
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in">in</SelectItem>
                              <SelectItem value="cm">cm</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Date Caught</Label>
                        <Input
                          type="date"
                          value={formData.caught_at}
                          onChange={(e) =>
                            setFormData({ ...formData, caught_at: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Location & Notes */}
                  {step === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div>
                        <Label>Location</Label>
                        <Select
                          value={formData.spot_id || "custom"}
                          onValueChange={(value) =>
                            setFormData({ ...formData, spot_id: value === "custom" ? "" : value })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select a spot (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom">Custom Location</SelectItem>
                            {spots.map((spot) => (
                              <SelectItem key={spot.id} value={spot.id.toString()}>
                                {spot.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {!formData.spot_id && (
                        <div>
                          <Label>Custom Location Name</Label>
                          <Input
                            placeholder="e.g., My secret fishing hole"
                            value={formData.location_name}
                            onChange={(e) =>
                              setFormData({ ...formData, location_name: e.target.value })
                            }
                            className="mt-1"
                          />
                        </div>
                      )}

                      <div>
                        <Label>Notes</Label>
                        <Textarea
                          placeholder="Weather conditions, bait used, etc."
                          value={formData.notes}
                          onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="flex gap-3 pt-4">
                    {step > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        className="flex-1"
                      >
                        Back
                      </Button>
                    )}
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={saveCatchMutation.isPending}
                    >
                      {saveCatchMutation.isPending
                        ? "Saving..."
                        : step === totalSteps
                          ? (editingCatch ? "Update Catch" : "Log Catch")
                          : "Next"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Catches Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-6 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="p-12 text-center">
            <Fish className="w-16 h-16 mx-auto text-destructive/60 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Couldn't load your catches
            </h3>
            <p className="text-muted-foreground mb-4">
              Something went wrong on our end. Please try again.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Retry
            </Button>
          </Card>
        ) : catches.length === 0 ? (
          <Card className="p-12 text-center">
            <Fish className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No catches logged yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Start recording your fishing adventures!
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Log Your First Catch
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catches.map((catch_, index) => {
              const spot = catch_.spot_id ? getSpotById(catch_.spot_id) : null;

              return (
                <motion.div
                  key={catch_.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden group">
                    {catch_.photo_url ? (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={catch_.photo_url}
                          alt={catch_.species}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <Badge className="absolute top-3 left-3">
                          {catch_.species}
                        </Badge>
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Fish className="w-16 h-16 text-primary/50" />
                        <Badge className="absolute top-3 left-3">
                          {catch_.species}
                        </Badge>
                      </div>
                    )}

                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-foreground">
                          {catch_.species}
                        </h3>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(catch_)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteCatchMutation.mutate(catch_.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {(catch_.weight || catch_.length) && (
                          <div className="flex gap-4">
                            {catch_.weight && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Scale className="w-4 h-4" />
                                {catch_.weight} {catch_.weight_unit}
                              </span>
                            )}
                            {catch_.length && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Ruler className="w-4 h-4" />
                                {catch_.length} {catch_.length_unit}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {spot ? spot.title : catch_.location_name || "Unknown location"}
                        </div>

                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(catch_.caught_at), "MMM d, yyyy")}
                        </div>

                        {catch_.notes && (
                          <p className="text-muted-foreground italic line-clamp-2">
                            "{catch_.notes}"
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CatchLog;
