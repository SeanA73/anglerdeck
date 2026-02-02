import { useState } from 'react';
import { Sparkles, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type Tone = 'casual' | 'proud' | 'humorous' | 'educational';

interface MagicWriteButtonProps {
  postType: 'catch' | 'story' | 'tip';
  details?: {
    species?: string;
    weight?: number;
    weightUnit?: string;
    location?: string;
    topic?: string;
  };
  onGenerated: (content: string) => void;
  disabled?: boolean;
}

const TONE_LABELS: Record<Tone, { label: string; emoji: string }> = {
  casual: { label: 'Casual', emoji: '😊' },
  proud: { label: 'Proud', emoji: '🏆' },
  humorous: { label: 'Funny', emoji: '😄' },
  educational: { label: 'Tips', emoji: '📚' },
};

export const MagicWriteButton = ({
  postType,
  details,
  onGenerated,
  disabled,
}: MagicWriteButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTone, setSelectedTone] = useState<Tone>('casual');
  const { toast } = useToast();

  const generateStory = async (tone: Tone) => {
    setIsLoading(true);
    setSelectedTone(tone);

    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-story', {
        body: { postType, tone, details },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate content');
      }

      if (data?.content) {
        onGenerated(data.content);
        toast({
          title: 'Content generated!',
          description: 'Feel free to edit it before posting.',
        });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Magic write error:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => generateStory(selectedTone)}
        disabled={disabled || isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 text-amber-500" />
        )}
        Magic Write
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isLoading}
            className="px-2"
          >
            <span className="mr-1">{TONE_LABELS[selectedTone].emoji}</span>
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(Object.entries(TONE_LABELS) as [Tone, { label: string; emoji: string }][]).map(
            ([tone, { label, emoji }]) => (
              <DropdownMenuItem
                key={tone}
                onClick={() => generateStory(tone)}
                className="gap-2"
              >
                <span>{emoji}</span>
                {label}
              </DropdownMenuItem>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MagicWriteButton;
