import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About & Contact — Hide & Field" },
      { name: "description", content: "The Hide & Field story: craftsmanship, materials, and how to reach us." },
    ],
  }),
  component: AboutPage,
});

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Valid email required").max(255),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(5, "Message is too short").max(1000),
});

function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-25"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1519741497674-611481863552?w=1920)" }}
        />
        <div className="mx-auto max-w-[1280px] px-4 py-24 md:px-8">
          <p className="text-sm uppercase tracking-[0.25em] text-primary-foreground/70">Our story</p>
          <h1 className="mt-3 max-w-3xl font-serif text-5xl font-bold md:text-6xl">Made by hand. Built for whatever&apos;s next.</h1>
          <p className="mt-5 max-w-2xl text-primary-foreground/80">
            Hide &amp; Field started in a small workshop with a simple idea: gear that lasts. From the tannery to the training field, every stitch is checked twice.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 px-4 py-16 md:grid-cols-3 md:px-8">
        {[
          { t: "Quality first", b: "Full-grain hides, marine-grade thread, and hardware that outlasts the seasons." },
          { t: "Built for use", b: "Whether it's a match ball or a briefcase, our gear is field-tested before it ships." },
          { t: "Zero shortcuts", b: "No corner cutting. No filler. Every product is guaranteed for life." },
        ].map(v => (
          <div key={v.t} className="rounded-xl border bg-card p-6">
            <h3 className="font-serif text-xl font-semibold">{v.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{v.b}</p>
          </div>
        ))}
      </section>

      <section id="contact" className="bg-secondary/40 py-16">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-4 md:grid-cols-2 md:px-8">
          <ContactForm />
          <div>
            <h2 className="font-serif text-3xl font-bold">Get in touch</h2>
            <p className="mt-2 text-muted-foreground">We usually reply within one business day.</p>
            <div className="mt-6 space-y-3 text-sm">
              <p className="flex items-center gap-3"><Mail className="h-4 w-4 text-accent" /> rmtanzeel@gmail.com</p>
              <p className="flex items-center gap-3"><Phone className="h-4 w-4 text-accent" /> +92 314 6495849</p>
              <p className="flex items-center gap-3"><MapPin className="h-4 w-4 text-accent" /> Lahore, Pakistan</p>
            </div>

            <h3 className="mt-10 font-serif text-2xl font-bold">FAQ</h3>
            <Accordion type="single" collapsible className="mt-3">
              <AccordionItem value="s"><AccordionTrigger>How fast is shipping?</AccordionTrigger><AccordionContent>Most orders ship within 24–48 hours with tracked delivery.</AccordionContent></AccordionItem>
              <AccordionItem value="r"><AccordionTrigger>What&apos;s your return policy?</AccordionTrigger><AccordionContent>30-day returns on unused items; lifetime warranty on stitching.</AccordionContent></AccordionItem>
              <AccordionItem value="sz"><AccordionTrigger>How do sizes run?</AccordionTrigger><AccordionContent>Jackets run true to size; belts measured from buckle to middle hole.</AccordionContent></AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert(parsed.data);
    setBusy(false);
    if (error) return toast.error(error.message);
    setForm({ name: "", email: "", subject: "", message: "" });
    toast.success("Thanks! We'll be in touch shortly.");
  };

  return (
    <form onSubmit={submit} className="rounded-xl border bg-card p-6">
      <h2 className="font-serif text-3xl font-bold">Send us a note</h2>
      <div className="mt-5 space-y-4">
        <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
        <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
        <div><Label>Subject</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
        <div><Label>Message</Label><Textarea rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required /></div>
        <Button type="submit" disabled={busy} className="w-full bg-accent text-accent-foreground hover:opacity-90">
          {busy ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
