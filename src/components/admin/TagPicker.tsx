import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface TagVocabulary {
  waterTypes: string[];
  species: string[];
}

interface TagPickerProps {
  value: string[];
  onChange: (tags: string[]) => void;
  vocabulary: TagVocabulary;
  loading?: boolean;
}

const canonical = (tag: string) => tag.trim().toLowerCase();

/**
 * Tag editor for affiliate products.
 *
 * Tags used to be a comma-separated free-text field, and that is what broke
 * contextual matching: an admin would type "trout" while the spots carry
 * "rainbow trout", and the mismatch failed silently — no error, just a product
 * that never surfaced where it should. Offering the actual `spots.type` and
 * `spots.species` values makes a matching tag the path of least resistance.
 *
 * Free entry stays, because the vocabulary cannot cover everything (a tag for a
 * technique, a brand, a region) and blocking it would push people back to
 * guessing. Anything typed is lowercased so it at least matches consistently.
 */
export const TagPicker = ({ value, onChange, vocabulary, loading }: TagPickerProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(() => new Set(value.map(canonical)), [value]);

  const toggle = (tag: string) => {
    const t = canonical(tag);
    if (!t) return;
    onChange(selected.has(t) ? value.filter((v) => canonical(v) !== t) : [...value, t]);
  };

  const trimmedQuery = canonical(query);
  const known = new Set([
    ...vocabulary.waterTypes.map(canonical),
    ...vocabulary.species.map(canonical),
  ]);
  const canAddFreeText = trimmedQuery.length > 1 && !known.has(trimmedQuery) && !selected.has(trimmedQuery);

  // Tags already on the product that are not in the vocabulary — surfaced so
  // they can be removed rather than quietly persisting.
  const custom = value.filter((v) => !known.has(canonical(v)));

  const renderGroup = (heading: string, options: string[]) => {
    if (!options.length) return null;
    return (
      <CommandGroup heading={heading}>
        {options.map((option) => {
          const isOn = selected.has(canonical(option));
          return (
            <CommandItem key={option} value={option} onSelect={() => toggle(option)}>
              <Check className={`mr-2 h-4 w-4 ${isOn ? "opacity-100" : "opacity-0"}`} />
              {option}
            </CommandItem>
          );
        })}
      </CommandGroup>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[1.75rem]">
        {value.length === 0 && (
          <span className="text-xs text-muted-foreground">
            No tags — this product will only ever rank as a fallback.
          </span>
        )}
        {value.map((tag) => (
          <Badge
            key={tag}
            variant={known.has(canonical(tag)) ? "secondary" : "outline"}
            className="gap-1"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => toggle(tag)}
              className="hover:text-destructive"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={loading}
          >
            {loading ? "Loading spot vocabulary…" : "Add tags from spots…"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search water types and species…"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList className="max-h-72">
              <CommandEmpty>
                {canAddFreeText ? "Not a spot value — you can still add it below." : "No match."}
              </CommandEmpty>
              {canAddFreeText && (
                <CommandGroup heading="Custom">
                  <CommandItem
                    value={`__add__${trimmedQuery}`}
                    onSelect={() => {
                      toggle(trimmedQuery);
                      setQuery("");
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add “{trimmedQuery}”
                  </CommandItem>
                </CommandGroup>
              )}
              {renderGroup("Water type", vocabulary.waterTypes)}
              {renderGroup("Species", vocabulary.species)}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {custom.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {custom.length} tag{custom.length === 1 ? "" : "s"} not found in any spot
          ({custom.join(", ")}) — harmless, but they cannot match a spot.
        </p>
      )}
    </div>
  );
};

export default TagPicker;
