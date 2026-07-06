import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";

const Licenses = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Open Source Licenses"
        description="Attribution and licenses for the open source software that powers AnglerDeck."
        canonicalPath="/licenses"
      />
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <article className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-2">Open Source Licenses</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: 6 July 2026</p>

          <p className="text-muted-foreground mb-6">
            AnglerDeck is built on the shoulders of many open source projects. We are
            grateful to the maintainers and contributors of the following libraries. Each
            is used under its respective open source licence.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">Core framework</h2>
          <ul className="text-muted-foreground mb-6 list-disc pl-6 space-y-1">
            <li><strong>React</strong> (MIT) — facebook.github.io/react</li>
            <li><strong>Vite</strong> (MIT) — vitejs.dev</li>
            <li><strong>TypeScript</strong> (Apache 2.0) — typescriptlang.org</li>
            <li><strong>React Router</strong> (MIT) — reactrouter.com</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">UI and styling</h2>
          <ul className="text-muted-foreground mb-6 list-disc pl-6 space-y-1">
            <li><strong>Tailwind CSS</strong> (MIT) — tailwindcss.com</li>
            <li><strong>shadcn/ui</strong> (MIT) — ui.shadcn.com</li>
            <li><strong>Radix UI</strong> (MIT) — radix-ui.com</li>
            <li><strong>Lucide Icons</strong> (ISC) — lucide.dev</li>
            <li><strong>Framer Motion</strong> (MIT) — framer.com/motion</li>
            <li><strong>Sonner</strong> (MIT) — sonner.emilkowal.ski</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">Data and networking</h2>
          <ul className="text-muted-foreground mb-6 list-disc pl-6 space-y-1">
            <li><strong>Supabase JS Client</strong> (MIT) — supabase.com</li>
            <li><strong>TanStack Query</strong> (MIT) — tanstack.com/query</li>
            <li><strong>Zod</strong> (MIT) — zod.dev</li>
            <li><strong>date-fns</strong> (MIT) — date-fns.org</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">Maps</h2>
          <ul className="text-muted-foreground mb-6 list-disc pl-6 space-y-1">
            <li><strong>Leaflet</strong> (BSD-2-Clause) — leafletjs.com</li>
            <li><strong>React Leaflet</strong> (Hippocratic) — react-leaflet.js.org</li>
            <li><strong>OpenStreetMap tile data</strong> (ODbL) — openstreetmap.org/copyright</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">Payments and services</h2>
          <ul className="text-muted-foreground mb-6 list-disc pl-6 space-y-1">
            <li><strong>Stripe JS SDK</strong> (MIT) — stripe.com</li>
            <li><strong>react-helmet-async</strong> (Apache 2.0)</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">Full attribution</h2>
          <p className="text-muted-foreground mb-6">
            The Service depends on many additional transitive libraries. Full licence
            information is available in our repository at github.com/SeanA73/anglerdeck.
            If you believe your project should be credited here or is not being properly
            attributed, please contact legal@anglerdeck.com.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default Licenses;