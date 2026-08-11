import { NavLink, Outlet, Link } from "react-router-dom";
import { MapPin, ShoppingBag, CreditCard, Users, ShieldAlert, Megaphone, Activity, ArrowLeft, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin", label: "Spots", icon: MapPin, end: true },
  { to: "/admin/affiliate", label: "Affiliate", icon: ShoppingBag, end: false },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard, end: false },
  { to: "/admin/users", label: "Users", icon: Users, end: false },
  { to: "/admin/moderation", label: "Moderation", icon: ShieldAlert, end: false },
  { to: "/admin/marketing", label: "Marketing", icon: Megaphone, end: false },
  { to: "/admin/ops", label: "Ops", icon: Activity, end: false },
];

const AdminLayout = () => (
  <div className="min-h-screen bg-background">
    <header className="border-b bg-card sticky top-0 z-40">
      <div className="container mx-auto px-4 h-14 flex items-center gap-6">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="w-5 h-5 text-accent" />
          AnglerDeck Admin
        </div>
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to site
        </Link>
      </div>
    </header>
    <main id="main-content" className="container mx-auto px-4 py-6">
      <Outlet />
    </main>
  </div>
);

export default AdminLayout;
