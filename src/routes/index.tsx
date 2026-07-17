import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ShieldCheck, Truck, Award } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hide & Field — Leather Goods & Sports Equipment" },
      { name: "description", content: "Handcrafted leather wallets, belts, bags & match-ready sports gear built to last." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedCategories />
      <FeaturedProducts />
      <WhyUs />
      <Newsletter />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url(https://images.unsplash.com/photo-1520975954732-35dd22299614?w=1920&q=80)" }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/30" />
      <div className="mx-auto flex min-h-[560px] max-w-[1280px] flex-col justify-center px-4 py-24 md:px-8">
        <p className="text-sm uppercase tracking-[0.25em] text-primary-foreground/80">Craftsmanship · Performance</p>
        <h1 className="mt-4 max-w-3xl font-serif text-5xl font-bold leading-tight text-primary-foreground md:text-7xl">
          Built for the trail. Made for the field.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-primary-foreground/85">
          Full-grain leather goods and match-ready sports equipment — engineered to outlast the seasons.
        </p>
        <div className="mt-8 flex gap-3">
          <Link to="/shop"><Button size="lg" className="bg-accent text-accent-foreground hover:opacity-90">Shop Now</Button></Link>
          <Link to="/about"><Button size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">Our story</Button></Link>
        </div>
      </div>
    </section>
  );
}

function FeaturedCategories() {
  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-16 md:px-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-serif text-3xl font-bold md:text-4xl">Shop by category</h2>
          <p className="mt-2 text-muted-foreground">From wallets to willow bats.</p>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {isLoading && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-xl" />)}
        {data?.map(c => (
          <Link key={c.id} to="/shop" search={{ category: c.slug }} className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md">
            <div className="aspect-[4/5] overflow-hidden">
              {c.image_url && <img src={c.image_url} alt={c.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/90 to-transparent p-4">
              <p className="font-serif text-lg font-semibold text-primary-foreground">{c.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function StarRating({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} className={i <= Math.round(value) ? "fill-accent text-accent" : "text-muted-foreground/40"} />
      ))}
    </div>
  );
}

function FeaturedProducts() {
  const { addToCart } = useCart();
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id,name,slug,price,compare_at_price,images,avg_rating,stock_quantity").eq("is_featured", true).limit(8);
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="bg-secondary/40 py-16">
      <div className="mx-auto max-w-[1280px] px-4 md:px-8">
        <h2 className="font-serif text-3xl font-bold md:text-4xl">Featured</h2>
        <p className="mt-2 text-muted-foreground">Fan-favourite picks, ready to ship.</p>

        <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {isLoading && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
          {data?.map(p => (
            <div key={p.id} className="group rounded-xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <Link to="/product/$slug" params={{ slug: p.slug }} className="block overflow-hidden rounded-t-xl">
                <div className="aspect-square overflow-hidden bg-muted">
                  {p.images?.[0] && <img src={p.images[0]} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                </div>
              </Link>
              <div className="space-y-2 p-4">
                <Link to="/product/$slug" params={{ slug: p.slug }} className="line-clamp-1 font-serif text-lg font-semibold hover:text-accent">{p.name}</Link>
                <StarRating value={Number(p.avg_rating)} />
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">${Number(p.price).toFixed(2)}</span>
                  {p.compare_at_price && <span className="text-sm text-muted-foreground line-through">${Number(p.compare_at_price).toFixed(2)}</span>}
                </div>
                <Button
                  className="w-full bg-accent text-accent-foreground hover:opacity-90"
                  disabled={busyId === p.id || p.stock_quantity === 0}
                  onClick={async () => {
                    setBusyId(p.id);
                    try { await addToCart(p.id); toast.success("Added to cart"); }
                    catch { toast.error("Could not add"); }
                    finally { setBusyId(null); }
                  }}
                >
                  {p.stock_quantity === 0 ? "Out of stock" : busyId === p.id ? "Adding…" : "Add to cart"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyUs() {
  const items = [
    { icon: Award, title: "Full-grain materials", body: "Every hide is hand-selected for character and durability." },
    { icon: Truck, title: "Fast worldwide shipping", body: "Tracked delivery on every order, guaranteed." },
    { icon: ShieldCheck, title: "Lifetime warranty", body: "We stand behind our stitching for the long haul." },
  ];
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-16 md:px-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {items.map(it => (
          <div key={it.title} className="rounded-xl border bg-card p-6">
            <it.icon className="h-8 w-8 text-accent" />
            <h3 className="mt-4 font-serif text-xl font-semibold">{it.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().email().safeParse(email);
    if (!parsed.success) return toast.error("Please enter a valid email");
    setBusy(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email });
    setBusy(false);
    if (error) {
      if (error.code === "23505") toast.info("You're already subscribed");
      else toast.error(error.message);
      return;
    }
    setEmail("");
    toast.success("Thanks for subscribing!");
  };
  return (
    <section className="bg-field text-field-foreground">
      <div className="mx-auto max-w-[1280px] px-4 py-14 md:px-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h3 className="font-serif text-3xl font-bold">Join the field notes.</h3>
            <p className="mt-2 text-field-foreground/80">Get restock alerts and 10% off your first order.</p>
          </div>
          <form onSubmit={submit} className="flex w-full max-w-md gap-2">
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" className="bg-background text-foreground" />
            <Button type="submit" disabled={busy} className="bg-accent text-accent-foreground hover:opacity-90">{busy ? "…" : "Subscribe"}</Button>
          </form>
        </div>
      </div>
    </section>
  );
}
