export default function Footer() {
  return (
    <footer className="border-t border-glass-border bg-obsidian py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <hr className="text-gold-primary"/><br />
        <h2 className="font-display text-2xl text-gold-primary mb-4 tracking-widest uppercase">HONEY HUB</h2>
        <p className="text-text-secondary mb-8 text-sm">Liquid Gold in the Dark. Pure, raw, cold-pressed honey.</p>
        <div className="text-text-muted text-xs">
          &copy; {new Date().getFullYear()} HONEY HUB. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
