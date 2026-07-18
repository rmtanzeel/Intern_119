import { Link } from "@tanstack/react-router";
import { Mail, Linkedin, Github, Instagram, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t bg-primary text-primary-foreground">
      <div className="mx-auto max-w-[1280px] px-4 py-14 md:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <h3 className="font-serif text-2xl font-bold">Hide &amp; Field</h3>
            <p className="mt-3 text-sm text-primary-foreground/75">Rugged leather craftsmanship meets sport-ready performance.</p>
            <div className="mt-4 flex gap-3">
              <a href="#" aria-label="Instagram" className="rounded-full border border-primary-foreground/20 p-2 transition hover:border-accent hover:text-accent"><Instagram className="h-4 w-4" /></a>
              <a href="#" aria-label="Facebook" className="rounded-full border border-primary-foreground/20 p-2 transition hover:border-accent hover:text-accent"><Facebook className="h-4 w-4" /></a>
            </div>
          </div>
          <div>
            <h4 className="font-serif text-lg font-semibold">Shop</h4>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/80">
              <li><Link to="/" className="hover:text-accent">Home</Link></li>
              <li><Link to="/shop" className="hover:text-accent">Shop</Link></li>
              <li><Link to="/about" className="hover:text-accent">About</Link></li>
              <li><Link to="/about" className="hover:text-accent">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-lg font-semibold">Support</h4>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/80">
              <li><Link to="/about" className="hover:text-accent">FAQ</Link></li>
              <li><a className="hover:text-accent" href="#">Shipping &amp; Returns</a></li>
              <li><a className="hover:text-accent" href="#">Privacy Policy</a></li>
              <li><a className="hover:text-accent" href="#">Terms</a></li>
            </ul>
          </div>

          <div className="rounded-xl border border-primary-foreground/25 bg-primary-foreground/5 p-5">
            <p className="text-xs uppercase tracking-widest text-primary-foreground/60">Created by</p>
            <p className="mt-1 font-serif text-lg font-semibold">Muhammad Tanzeel</p>
            <div className="mt-4 flex items-center gap-4">
              <a
                href="mailto:rmtanzeel@gmail.com"
                aria-label="Email"
                className="text-primary-foreground/80 transition-all duration-200 hover:scale-110 hover:text-accent"
              >
                <Mail className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/muhammad-tanzeel-ur-rehman-a857b5356"
                target="_blank" rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-primary-foreground/80 transition-all duration-200 hover:scale-110 hover:text-accent"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://github.com/rmtanzeel"
                target="_blank" rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-primary-foreground/80 transition-all duration-200 hover:scale-110 hover:text-accent"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-primary-foreground/15 pt-6 text-center text-xs text-primary-foreground/60">
          © 2026 Hide &amp; Field. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
