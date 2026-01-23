import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoLightboxProps {
  photos: string[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PhotoLightbox = ({ 
  photos, 
  initialIndex = 0, 
  open, 
  onOpenChange 
}: PhotoLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
    }
  }, [open, initialIndex]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    setIsZoomed(false);
  }, [photos.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    setIsZoomed(false);
  }, [photos.length]);

  const toggleZoom = useCallback(() => {
    setIsZoomed((prev) => !prev);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'Escape':
          onOpenChange(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, goToPrevious, goToNext, onOpenChange]);

  if (photos.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none overflow-hidden">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 text-white/80 hover:text-white hover:bg-white/10"
          onClick={() => onOpenChange(false)}
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Zoom button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-16 z-50 text-white/80 hover:text-white hover:bg-white/10"
          onClick={toggleZoom}
        >
          {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
        </Button>

        {/* Main image container */}
        <div className="relative w-full h-full flex items-center justify-center p-8">
          <div 
            className={cn(
              "relative transition-transform duration-300 ease-out",
              isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
            )}
            onClick={toggleZoom}
          >
            <img
              src={photos[currentIndex]}
              alt={`Photo ${currentIndex + 1} of ${photos.length}`}
              className={cn(
                "max-w-full max-h-[80vh] object-contain animate-fade-in transition-transform duration-300",
                isZoomed && "scale-150"
              )}
            />
          </div>
        </div>

        {/* Navigation arrows */}
        {photos.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
              onClick={goToPrevious}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
              onClick={goToNext}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </>
        )}

        {/* Thumbnail strip */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsZoomed(false);
                }}
                className={cn(
                  "w-12 h-12 rounded-md overflow-hidden border-2 transition-all duration-200 hover-scale",
                  currentIndex === index
                    ? "border-primary ring-2 ring-primary/50"
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <img
                  src={photo}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Photo counter */}
        <div className="absolute top-4 left-4 z-50 text-white/80 text-sm bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
          {currentIndex + 1} / {photos.length}
        </div>
      </DialogContent>
    </Dialog>
  );
};
