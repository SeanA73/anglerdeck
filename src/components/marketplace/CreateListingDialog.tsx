import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const categories = [
  'Rods',
  'Reels',
  'Tackle',
  'Lures',
  'Line',
  'Electronics',
  'Apparel',
  'Boats & Kayaks',
  'Accessories',
  'Other'
];

const conditions = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];

const contactMethods = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'message', label: 'In-App Message' },
];

export const CreateListingDialog = () => {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: 'good',
    price: '',
    location: '',
    sellerName: '',
    contactMethod: 'email',
    contactValue: '',
  });

  const createListingMutation = useMutation({
    mutationFn: async (data: typeof formData & { imageUrls: string[] }) => {
      const { error } = await supabase.from('gear_listings').insert({
        title: data.title,
        description: data.description,
        category: data.category,
        condition: data.condition,
        price: parseFloat(data.price),
        location: data.location || null,
        seller_name: data.sellerName || 'Anonymous Seller',
        contact_method: data.contactMethod,
        contact_value: data.contactValue,
        images: data.imageUrls,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gear-listings'] });
      toast.success('Listing created successfully!');
      resetForm();
      setOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to create listing: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      condition: 'good',
      price: '',
      location: '',
      sellerName: '',
      contactMethod: 'email',
      contactValue: '',
    });
    setImages([]);
    setImagePreviewUrls([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setImages(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];

    for (const file of images) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('gear-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gear-images')
        .getPublicUrl(fileName);

      urls.push(publicUrl);
    }

    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.category || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setUploading(true);

    try {
      const imageUrls = await uploadImages();
      await createListingMutation.mutateAsync({ ...formData, imageUrls });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error('Failed to upload images: ' + errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const isSubmitting = uploading || createListingMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          List Your Gear
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Listing</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Images */}
          <div>
            <Label>Photos (up to 5)</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {imagePreviewUrls.map((url, index) => (
                <div key={index} className="relative w-20 h-20">
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="w-20 h-20 border-2 border-dashed border-border rounded-md flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Shimano Stradic 3000 Spinning Reel"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your item, including any wear or defects..."
              rows={3}
            />
          </div>

          {/* Category and Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Condition</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((cond) => (
                    <SelectItem key={cond.value} value={cond.value}>{cond.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price and Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (USD) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Miami, FL"
              />
            </div>
          </div>

          {/* Seller Info */}
          <div>
            <Label htmlFor="sellerName">Your Name</Label>
            <Input
              id="sellerName"
              value={formData.sellerName}
              onChange={(e) => setFormData(prev => ({ ...prev, sellerName: e.target.value }))}
              placeholder="Anonymous Seller"
            />
          </div>

          {/* Contact Method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Contact Method</Label>
              <Select
                value={formData.contactMethod}
                onValueChange={(value) => setFormData(prev => ({ ...prev, contactMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contactMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="contactValue">Contact Info</Label>
              <Input
                id="contactValue"
                value={formData.contactValue}
                onChange={(e) => setFormData(prev => ({ ...prev, contactValue: e.target.value }))}
                placeholder={formData.contactMethod === 'email' ? 'email@example.com' : 'Your contact'}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Listing...
              </>
            ) : (
              'Create Listing'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
