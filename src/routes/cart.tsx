import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartProvider";
import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — Hide & Field" }] }),
  component: CartPage,
});

const shippingSchema = z.object({
  full_name: z.string().min(2, "Name required"),
  address_line1: z.string().min(3, "Address required"),
  address_line2: z.string().optional(),
  city: z.string().min(2, "City required"),
  state: z.string().min(1, "State required"),
  postal_code: z.string().min(3, "Postal code required"),
  country: z.string().min(2, "Country required"),
  phone: z.string().min(6, "Phone required"),
});

function CartPage() {
  const { items, updateQty, removeItem, subtotal, clear } = useCart();
  const { user } = useAuth();
  const [checkingOut, setCheckingOut] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [payment, setPayment] = useState("cod");
  const [addr, setAddr] = useState({ full_name: "", address_line1: "", address_line2: "", city: "", state: "", postal_code: "", country: "", phone: "" });

  const shipping = subtotal > 100 ? 0 : subtotal > 0 ? 12 : 0;
  const total = subtotal + shipping;

  if (confirmedOrderId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-field text-field-foreground">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-serif text-3xl font-bold">Order confirmed!</h1>
        <p className="mt-2 text-muted-foreground">Order ID: <span className="font-mono text-sm">{confirmedOrderId.slice(0, 8)}</span></p>
        <Link to="/shop"><Button className="mt-8 bg-accent text-accent-foreground hover:opacity-90">Continue shopping</Button></Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/40" />
        <h1 className="mt-6 font-serif text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Time to find something worth carrying.</p>
        <Link to="/shop"><Button className="mt-8 bg-accent text-accent-foreground hover:opacity-90">Continue shopping</Button></Link>
      </div>
    );
  }

  const placeOrder = async () => {
    const parsed = shippingSchema.safeParse(addr);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (payment !== "cod") return toast.info("Card payments coming soon — please choose Cash on Delivery.");
    setBusy(true);
    const { data, error } = await supabase.rpc("place_order", { p_shipping_address: parsed.data, p_payment_method: payment });
    setBusy(false);
    if (error) return toast.error(error.message);
    await clear();
    setConfirmedOrderId(data as unknown as string);
    toast.success("Order placed!");
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-8">
      <h1 className="font-serif text-4xl font-bold">{checkingOut ? "Checkout" : "Your cart"}</h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {!checkingOut && items.map(it => (
            <div key={it.id} className="flex gap-4 rounded-xl border bg-card p-4">
              <img src={it.product.images?.[0]} alt={it.product.name} className="h-24 w-24 rounded-md object-cover" />
              <div className="flex-1">
                <Link to="/product/$slug" params={{ slug: it.product.slug }} className="font-serif text-lg font-semibold hover:text-accent">{it.product.name}</Link>
                {it.variant && <p className="text-xs text-muted-foreground">{it.variant.variant_type}: {it.variant.variant_value}</p>}
                <p className="mt-1 text-sm font-medium">${(Number(it.product.price) + Number(it.variant?.price_adjustment || 0)).toFixed(2)}</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="inline-flex items-center rounded-md border">
                    <button className="p-1.5 hover:bg-secondary" onClick={() => updateQty(it.id, it.quantity - 1)}><Minus className="h-3 w-3" /></button>
                    <span className="w-8 text-center text-sm">{it.quantity}</span>
                    <button className="p-1.5 hover:bg-secondary" onClick={() => updateQty(it.id, it.quantity + 1)}><Plus className="h-3 w-3" /></button>
                  </div>
                  <button className="text-sm text-muted-foreground hover:text-destructive" onClick={() => removeItem(it.id)}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="font-semibold">${((Number(it.product.price) + Number(it.variant?.price_adjustment || 0)) * it.quantity).toFixed(2)}</p>
            </div>
          ))}

          {checkingOut && (
            <div className="space-y-4 rounded-xl border bg-card p-6">
              <h2 className="font-serif text-xl font-semibold">Shipping address</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="md:col-span-2"><Label>Full name</Label><Input value={addr.full_name} onChange={e => setAddr({ ...addr, full_name: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Address line 1</Label><Input value={addr.address_line1} onChange={e => setAddr({ ...addr, address_line1: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Address line 2 (optional)</Label><Input value={addr.address_line2} onChange={e => setAddr({ ...addr, address_line2: e.target.value })} /></div>
                <div><Label>City</Label><Input value={addr.city} onChange={e => setAddr({ ...addr, city: e.target.value })} /></div>
                <div><Label>State</Label><Input value={addr.state} onChange={e => setAddr({ ...addr, state: e.target.value })} /></div>
                <div><Label>Postal code</Label><Input value={addr.postal_code} onChange={e => setAddr({ ...addr, postal_code: e.target.value })} /></div>
                <div><Label>Country</Label><Input value={addr.country} onChange={e => setAddr({ ...addr, country: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Phone</Label><Input value={addr.phone} onChange={e => setAddr({ ...addr, phone: e.target.value })} /></div>
              </div>

              <h2 className="mt-4 font-serif text-xl font-semibold">Payment method</h2>
              <RadioGroup value={payment} onValueChange={setPayment}>
                <div className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="cursor-pointer">Cash on Delivery</Label>
                </div>
                <div className="flex items-center space-x-2 rounded-md border p-3 opacity-60">
                  <RadioGroupItem value="card" id="card" disabled />
                  <Label htmlFor="card">Card (coming soon)</Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>

        <aside className="h-fit space-y-3 rounded-xl border bg-card p-6">
          <h2 className="font-serif text-xl font-semibold">Order summary</h2>
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm"><span>Shipping</span><span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span></div>
          <div className="flex justify-between border-t pt-3 text-lg font-semibold"><span>Total</span><span>${total.toFixed(2)}</span></div>
          {!checkingOut ? (
            <Button
              className="mt-4 w-full bg-accent text-accent-foreground hover:opacity-90"
              onClick={() => {
                if (!user) {
                  toast.info("Please sign in to check out");
                  window.location.href = "/auth?redirect=/cart";
                  return;
                }
                setCheckingOut(true);
              }}
            >Proceed to checkout</Button>
          ) : (
            <>
              <Button className="mt-4 w-full bg-accent text-accent-foreground hover:opacity-90" disabled={busy} onClick={placeOrder}>
                {busy ? "Placing order…" : "Place order"}
              </Button>
              <button className="w-full text-sm text-muted-foreground hover:text-accent" onClick={() => setCheckingOut(false)}>← Back to cart</button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
