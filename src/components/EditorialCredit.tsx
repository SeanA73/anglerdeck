import { Link } from "react-router-dom";

export default function EditorialCredit() {
  return (
    <p className="text-sm text-muted-foreground">
      Published by AnglerDeck · Research-based guide ·{" "}
      <Link className="text-accent underline" to="/about">How we research and correct our guides</Link>
    </p>
  );
}
