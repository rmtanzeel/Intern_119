import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";

export interface CartLine {
  id: string;             // cart row id OR guest key
  product_id: string;
  variant_id: string | null;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    stock_quantity: number;
  };
  variant?: { id: string; variant_type: string; variant_value: string; price_adjustment: number } | null;
}

interface CartCtx {
  items: CartLine[];
  loading: boolean;
  addToCart: (productId: string, variantId?: string | null, qty?: number) => Promise<void>;
  updateQty: (lineId: string, qty: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
  subtotal: number;
  count: number;
}

const Ctx = createContext<CartCtx | undefined>(undefined);
const GUEST_KEY = "hf_guest_cart";

type GuestLine = { product_id: string; variant_id: string | null; quantity: number };
const readGuest = (): GuestLine[] => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(GUEST_KEY) || "[]"); } catch { return []; }
};
const writeGuest = (l: GuestLine[]) => localStorage.setItem(GUEST_KEY, JSON.stringify(l));

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(false);

  const hydrateGuest = useCallback(async () => {
    const g = readGuest();
    if (g.length === 0) { setItems([]); return; }
    const productIds = [...new Set(g.map(x => x.product_id))];
    const { data: products } = await supabase.from("products").select("id,name,slug,price,images,stock_quantity").in("id", productIds);
    const variantIds = g.map(x => x.variant_id).filter(Boolean) as string[];
    const { data: variants } = variantIds.length
      ? await supabase.from("product_variants").select("id,variant_type,variant_value,price_adjustment").in("id", variantIds)
      : { data: [] as any[] };
    const lines: CartLine[] = g.map((x, i) => {
      const p = (products || []).find(pp => pp.id === x.product_id);
      const v = x.variant_id ? (variants || []).find(vv => vv.id === x.variant_id) : null;
      if (!p) return null as any;
      return {
        id: `guest-${i}`,
        product_id: x.product_id,
        variant_id: x.variant_id,
        quantity: x.quantity,
        product: p as any,
        variant: v as any,
      };
    }).filter(Boolean);
    setItems(lines);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (!user) { await hydrateGuest(); return; }
      const { data } = await supabase
        .from("cart_items")
        .select("id,product_id,variant_id,quantity,product:products(id,name,slug,price,images,stock_quantity),variant:product_variants(id,variant_type,variant_value,price_adjustment)")
        .order("created_at");
      setItems((data as any) || []);
    } finally { setLoading(false); }
  }, [user, hydrateGuest]);

  // On login: merge guest cart to server
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (user) {
        const guest = readGuest();
        if (guest.length) {
          for (const g of guest) {
            await mergeAdd(user.id, g.product_id, g.variant_id, g.quantity);
          }
          writeGuest([]);
        }
      }
      if (mounted) await refresh();
    })();
    return () => { mounted = false; };
  }, [user, refresh]);

  const mergeAdd = async (uid: string, product_id: string, variant_id: string | null, qty: number) => {
    const q = supabase.from("cart_items").select("id,quantity").eq("user_id", uid).eq("product_id", product_id);
    const { data: existing } = variant_id ? await q.eq("variant_id", variant_id) : await q.is("variant_id", null);
    if (existing && existing.length) {
      await supabase.from("cart_items").update({ quantity: existing[0].quantity + qty }).eq("id", existing[0].id);
    } else {
      await supabase.from("cart_items").insert({ user_id: uid, product_id, variant_id, quantity: qty });
    }
  };

  const addToCart: CartCtx["addToCart"] = async (product_id, variant_id = null, qty = 1) => {
    if (user) {
      await mergeAdd(user.id, product_id, variant_id, qty);
    } else {
      const g = readGuest();
      const idx = g.findIndex(x => x.product_id === product_id && (x.variant_id || null) === (variant_id || null));
      if (idx >= 0) g[idx].quantity += qty;
      else g.push({ product_id, variant_id: variant_id || null, quantity: qty });
      writeGuest(g);
    }
    await refresh();
  };

  const updateQty: CartCtx["updateQty"] = async (lineId, qty) => {
    if (qty < 1) return removeItem(lineId);
    if (user) {
      await supabase.from("cart_items").update({ quantity: qty }).eq("id", lineId);
    } else {
      const g = readGuest();
      const i = parseInt(lineId.replace("guest-", ""));
      if (g[i]) { g[i].quantity = qty; writeGuest(g); }
    }
    await refresh();
  };

  const removeItem: CartCtx["removeItem"] = async (lineId) => {
    if (user) {
      await supabase.from("cart_items").delete().eq("id", lineId);
    } else {
      const g = readGuest();
      const i = parseInt(lineId.replace("guest-", ""));
      g.splice(i, 1); writeGuest(g);
    }
    await refresh();
  };

  const clear = async () => {
    if (user) await supabase.from("cart_items").delete().eq("user_id", user.id);
    else writeGuest([]);
    await refresh();
  };

  const subtotal = items.reduce((s, it) => s + (Number(it.product.price) + Number(it.variant?.price_adjustment || 0)) * it.quantity, 0);
  const count = items.reduce((s, it) => s + it.quantity, 0);

  return (
    <Ctx.Provider value={{ items, loading, addToCart, updateQty, removeItem, clear, refresh, subtotal, count }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
