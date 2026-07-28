import { Car, Anchor, Footprints, Info, ExternalLink, Waves } from "lucide-react";
import type { SpotAccess } from "@/data/spots";

/**
 * Renders verified access details. Returns null when nothing has been verified,
 * so an empty card never appears — a blank section is better than implying we
 * know something we don't.
 */
export const hasAccessDetails = (access?: SpotAccess): boolean => {
  if (!access) return false;
  return Boolean(
    access.shore !== undefined ||
      access.boat !== undefined ||
      access.ramp ||
      access.parking ||
      access.walkIn ||
      access.facilities?.length ||
      access.notes
  );
};

const Row = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Car;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-3">
    <Icon className="w-4 h-4 text-accent shrink-0 mt-1" />
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  </div>
);

export const SpotAccessCard = ({ access }: { access?: SpotAccess }) => {
  if (!hasAccessDetails(access) || !access) return null;

  const fishingFrom = [
    access.shore ? "Land-based" : null,
    access.boat ? "Boat" : null,
  ].filter(Boolean);

  return (
    <div className="bg-card rounded-2xl p-6 border border-border/50">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Waves className="w-5 h-5 text-accent" />
        Getting There & Access
      </h2>

      <div className="grid sm:grid-cols-2 gap-4">
        {fishingFrom.length > 0 && (
          <Row icon={Waves} label="Fish from" value={fishingFrom.join(" or ")} />
        )}
        {access.ramp && <Row icon={Anchor} label="Boat ramp" value={access.ramp} />}
        {access.parking && <Row icon={Car} label="Parking" value={access.parking} />}
        {access.walkIn && (
          <Row icon={Footprints} label="Walk in" value={access.walkIn} />
        )}
      </div>

      {access.facilities && access.facilities.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {access.facilities.map((f) => (
            <span
              key={f}
              className="px-2.5 py-1 rounded-full bg-muted text-xs text-foreground"
            >
              {f}
            </span>
          ))}
        </div>
      )}

      {access.notes && (
        <div className="mt-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">{access.notes}</p>
        </div>
      )}

      {access.sourceUrl && (
        <a
          href={access.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground underline"
        >
          Access information source
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};

export default SpotAccessCard;
