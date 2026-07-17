import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartProvider";
import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Star } from "lucide-react";

interface ShopSearch {
  category?: string;
  search?: string;
  sort?: "newest" | "price-asc" | "price-desc" | "rating";
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): ShopSearch => ({
    category: (s.category as string) || undefined,
    search: (s.search as string) || undefined,
    sort: (s.sort as ShopSearch["sort"]) || "newest",
    minPrice: s.minPrice ? Number(s.minPrice) : undefined,
    maxPrice: s.maxPrice ? Number(s.maxPrice) : undefined,
    inStock: s.inStock === true || s.inStock === "true",
  }),
  head: () => ({ meta: [{ title: "Shop — Hide & Field" }, { name: "description", content: "Browse leather goods and sports gear." }] }),
  component: ShopPage,
});

function ShopPage() {
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  const updateSearch = (patch: Partial<ShopSearch>) => nav({ search: { ...search, ...patch } as any });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [],
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: async () => {
      const sel = (s: string): string => s;
      let q = supabase.from("products").select(sel("id,name,slug,price,compare_at_price,images,avg_rating,stock_quantity,material,category_id,categories(slug)"));
      if (search.category) {
        const cat = categories?.find(c => c.slug === search.category);
        if (cat) q = q.eq("category_id", cat.id);
      }
      if (search.search) q = q.ilike("name", `%${search.search}%`);
      if (search.minPrice !== undefined) q = q.gte("price", search.minPrice);
      if (search.maxPrice !== undefined) q = q.lte("price", search.maxPrice);
      if (search.inStock) q = q.gt("stock_quantity", 0);
      switch (search.sort) {
        case "price-asc": q = q.order("price", { ascending: true }); break;
        case "price-desc": q = q.order("price", { ascending: false }); break;
        case "rating": q = q.order("avg_rating", { ascending: false }); break;
        default: q = q.order("created_at", { ascending: false });
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
    enabled: !!categories,
  });

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="font-serif text-4xl font-bold">Shop</h1>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search products…"
            defaultValue={search.search || ""}
            onChange={(e) => updateSearch({ search: e.target.value || undefined })}
            className="w-full md:w-64"
          />
          <Select value={search.sort} onValueChange={(v) => updateSearch({ sort: v as any })}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low → High</SelectItem>
              <SelectItem value="price-desc">Price: High → Low</SelectItem>
              <SelectItem value="rating">Top rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[240px_1fr]">
        <aside className="space-y-6">
          <div>
            <h3 className="mb-3 font-serif text-lg font-semibold">Categories</h3>
            <div className="space-y-2 text-sm">
              <button className={`block w-full text-left ${!search.category ? "text-accent font-medium" : ""}`} onClick={() => updateSearch({ category: undefined })}>All products</button>
              {categories?.map(c => (
                <button key={c.id} className={`block w-full text-left hover:text-accent ${search.category === c.slug ? "text-accent font-medium" : ""}`} onClick={() => updateSearch({ category: c.slug })}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-3 font-serif text-lg font-semibold">Price</h3>
            <Slider min={0} max={800} step={10}
              value={[search.minPrice ?? 0, search.maxPrice ?? 800]}
              onValueChange={(v) => updateSearch({ minPrice: v[0], maxPrice: v[1] })}
            />
            <div className="mt-2 text-xs text-muted-foreground">${search.minPrice ?? 0} — ${search.maxPrice ?? 800}</div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="inStock" checked={!!search.inStock} onCheckedChange={(v) => updateSearch({ inStock: !!v })} />
            <label htmlFor="inStock" className="text-sm">In stock only</label>
          </div>
        </aside>

        <div>
          {isLoading && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
            </div>
          )}
          {!isLoading && (products?.length ?? 0) === 0 && (
            <div className="rounded-xl border border-dashed p-16 text-center text-muted-foreground">
              No products match your filters.
            </div>
          )}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products?.map(p => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ p }: { p: any }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const nav = Route.useNavigate();
  const [busy, setBusy] = useState(false);

  const { data: isFav, refetch } = useQuery({
    queryKey: ["wishlist", p.id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.from("wishlists").select("id").eq("product_id", p.id).eq("user_id", user.id).maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { toast.info("Please sign in to save favourites"); nav({ to: "/auth", search: { redirect: "/shop" } }); return; }
    if (isFav) await supabase.from("wishlists").delete().eq("product_id", p.id).eq("user_id", user.id);
    else await supabase.from("wishlists").insert({ product_id: p.id, user_id: user.id });
    await refetch();
  };

  return (
    <div className="group relative rounded-xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <button onClick={toggleFav} aria-label="Wishlist" className="absolute right-3 top-3 z-10 rounded-full bg-background/85 p-2 backdrop-blur transition hover:bg-background">
        <Heart className={`h-4 w-4 ${isFav ? "fill-accent text-accent" : ""}`} />
      </button>
      <Link to="/product/$slug" params={{ slug: p.slug }} className="block overflow-hidden rounded-t-xl">
        <div className="aspect-square overflow-hidden bg-muted">
          {p.images?.[0] && <img src={p.images[0]} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
        </div>
      </Link>
      <div className="space-y-2 p-4">
        <Link to="/product/$slug" params={{ slug: p.slug }} className="line-clamp-1 font-serif text-lg font-semibold hover:text-accent">{p.name}</Link>
        <div className="flex items-center gap-1">
          {[1,2,3,4,5].map(i => <Star key={i} size={13} className={i <= Math.round(p.avg_rating) ? "fill-accent text-accent" : "text-muted-foreground/40"} />)}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">${Number(p.price).toFixed(2)}</span>
          {p.compare_at_price && <span className="text-sm text-muted-foreground line-through">${Number(p.compare_at_price).toFixed(2)}</span>}
        </div>
        <Button
          className="w-full bg-accent text-accent-foreground hover:opacity-90"
          disabled={busy || p.stock_quantity === 0}
          onClick={async () => {
            setBusy(true);
            try { await addToCart(p.id); toast.success("Added to cart"); }
            catch { toast.error("Could not add"); }
            finally { setBusy(false); }
          }}
        >
          {p.stock_quantity === 0 ? "Out of stock" : busy ? "Adding…" : "Add to cart"}
        </Button>
      </div>
    </div>
  );
}
