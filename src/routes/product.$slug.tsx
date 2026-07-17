import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartProvider";
import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Star, Minus, Plus } from "lucide-react";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug} — Hide & Field` }] }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [busy, setBusy] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*,category:categories(name,slug),variants:product_variants(*)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as any;
    },
  });

  const { data: reviews, refetch: refetchReviews } = useQuery({
    queryKey: ["reviews", product?.id],
    queryFn: async () => {
      if (!product) return [];
      const { data } = await supabase
        .from("reviews")
        .select("*,profile:profiles(full_name)")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!product,
  });

  const { data: related } = useQuery({
    queryKey: ["related", product?.category_id, product?.id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      const { data } = await supabase.from("products").select("id,name,slug,price,images,avg_rating").eq("category_id", product.category_id).neq("id", product.id).limit(4);
      return data ?? [];
    },
    enabled: !!product,
  });

  const { data: isFav, refetch: refetchFav } = useQuery({
    queryKey: ["wishlist", product?.id, user?.id],
    queryFn: async () => {
      if (!user || !product) return false;
      const { data } = await supabase.from("wishlists").select("id").eq("product_id", product.id).eq("user_id", user.id).maybeSingle();
      return !!data;
    },
    enabled: !!user && !!product,
  });

  if (isLoading) {
    return <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-8"><Skeleton className="h-96 w-full rounded-xl" /></div>;
  }
  if (!product) return null;

  const variant = product.variants?.find((v: any) => v.id === selectedVariant);
  const effectivePrice = Number(product.price) + Number(variant?.price_adjustment || 0);
  const effectiveStock = variant ? variant.stock_quantity : product.stock_quantity;
  const stockLabel = effectiveStock === 0 ? { text: "Out of stock", cls: "bg-destructive text-destructive-foreground" }
    : effectiveStock < 10 ? { text: "Low stock", cls: "bg-accent text-accent-foreground" }
    : { text: "In stock", cls: "bg-field text-field-foreground" };

  const toggleFav = async () => {
    if (!user) { toast.info("Please sign in to save favourites"); return; }
    if (isFav) await supabase.from("wishlists").delete().eq("product_id", product.id).eq("user_id", user.id);
    else await supabase.from("wishlists").insert({ product_id: product.id, user_id: user.id });
    await refetchFav();
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-8">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-accent">Home</Link> / <Link to="/shop" className="hover:text-accent">Shop</Link> / <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-xl bg-muted">
            {product.images?.[imgIndex] && <img src={product.images[imgIndex]} alt={product.name} className="h-full w-full object-cover" />}
          </div>
          {product.images?.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((im: string, i: number) => (
                <button key={i} onClick={() => setImgIndex(i)} className={`aspect-square w-20 overflow-hidden rounded-md border-2 ${i === imgIndex ? "border-accent" : "border-transparent"}`}>
                  <img src={im} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="font-serif text-4xl font-bold">{product.name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => <Star key={i} size={16} className={i <= Math.round(Number(product.avg_rating)) ? "fill-accent text-accent" : "text-muted-foreground/40"} />)}
            </div>
            <a href="#reviews" className="text-sm text-muted-foreground hover:text-accent">({product.review_count} reviews)</a>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <span className="text-3xl font-semibold">${effectivePrice.toFixed(2)}</span>
            {product.compare_at_price && <span className="text-lg text-muted-foreground line-through">${Number(product.compare_at_price).toFixed(2)}</span>}
            <Badge className={stockLabel.cls}>{stockLabel.text}</Badge>
          </div>

          <p className="mt-5 text-muted-foreground">{product.description}</p>

          {product.variants?.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">{product.variants[0].variant_type}</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: any) => (
                  <button key={v.id} onClick={() => setSelectedVariant(v.id)}
                    className={`rounded-md border px-4 py-2 text-sm transition ${selectedVariant === v.id ? "border-accent bg-accent text-accent-foreground" : "hover:border-accent"}`}>
                    {v.variant_value}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="inline-flex items-center rounded-md border">
              <button className="p-2 hover:bg-secondary" onClick={() => setQty(q => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button className="p-2 hover:bg-secondary" onClick={() => setQty(q => q + 1)}><Plus className="h-4 w-4" /></button>
            </div>
            <Button
              size="lg"
              className="flex-1 bg-accent text-accent-foreground hover:opacity-90"
              disabled={busy || effectiveStock === 0}
              onClick={async () => {
                setBusy(true);
                try { await addToCart(product.id, selectedVariant, qty); toast.success("Added to cart"); }
                catch { toast.error("Could not add"); }
                finally { setBusy(false); }
              }}
            >
              {effectiveStock === 0 ? "Out of stock" : busy ? "Adding…" : "Add to cart"}
            </Button>
            <Button size="lg" variant="outline" onClick={toggleFav} aria-label="Wishlist">
              <Heart className={`h-5 w-5 ${isFav ? "fill-accent text-accent" : ""}`} />
            </Button>
          </div>

          <Tabs defaultValue="description" className="mt-10">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="material">Materials &amp; Care</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="pt-4 text-sm text-muted-foreground">{product.description}</TabsContent>
            <TabsContent value="material" className="pt-4 text-sm text-muted-foreground">
              <p><strong>Material:</strong> {product.material}</p>
              <p className="mt-2">Wipe clean with a dry cloth. Condition leather every 3–6 months.</p>
            </TabsContent>
            <TabsContent value="reviews" className="pt-4" id="reviews">
              <ReviewsPanel productId={product.id} reviews={reviews || []} onSubmitted={refetchReviews} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {(related?.length ?? 0) > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl font-bold">You may also like</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {related?.map(r => (
              <Link key={r.id} to="/product/$slug" params={{ slug: r.slug }} className="group rounded-xl border bg-card p-3 hover:shadow-md">
                <div className="aspect-square overflow-hidden rounded-md bg-muted">
                  {r.images?.[0] && <img src={r.images[0]} className="h-full w-full object-cover transition group-hover:scale-105" alt={r.name} />}
                </div>
                <p className="mt-2 line-clamp-1 font-serif font-semibold">{r.name}</p>
                <p className="text-sm font-medium">${Number(r.price).toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ReviewsPanel({ productId, reviews, onSubmitted }: { productId: string; reviews: any[]; onSubmitted: () => void }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return toast.info("Sign in to leave a review");
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({ product_id: productId, user_id: user.id, rating, comment });
    setBusy(false);
    if (error) return toast.error(error.message);
    setComment("");
    toast.success("Thanks for your review!");
    onSubmitted();
  };

  return (
    <div>
      {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>}
      <div className="space-y-4">
        {reviews.map(r => (
          <div key={r.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <p className="font-medium">{r.profile?.full_name || "Customer"}</p>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => <Star key={i} size={13} className={i <= r.rating ? "fill-accent text-accent" : "text-muted-foreground/40"} />)}
              </div>
              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
          </div>
        ))}
      </div>

      {user && (
        <div className="mt-6 rounded-lg border bg-card p-4">
          <p className="font-medium">Write a review</p>
          <div className="mt-2 flex gap-1">
            {[1,2,3,4,5].map(i => (
              <button key={i} onClick={() => setRating(i)}><Star size={20} className={i <= rating ? "fill-accent text-accent" : "text-muted-foreground/40"} /></button>
            ))}
          </div>
          <Textarea className="mt-3" value={comment} onChange={e => setComment(e.target.value)} placeholder="Tell us what you think…" />
          <Button className="mt-3 bg-accent text-accent-foreground hover:opacity-90" disabled={busy} onClick={submit}>{busy ? "…" : "Submit review"}</Button>
        </div>
      )}
    </div>
  );
}
