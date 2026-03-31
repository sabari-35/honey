export default function ProductDetail() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="aspect-square glass-panel flex items-center justify-center">
          <p className="text-text-muted">Image Gallery</p>
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="font-display text-4xl text-gold-primary mb-4">Product Name</h1>
          <p className="text-2xl text-text-primary mb-6">₹1,999</p>
          <p className="text-text-secondary leading-relaxed mb-8">Product description goes here...</p>
          <button className="bg-gold-primary text-obsidian py-4 rounded-lg font-medium hover:bg-gold-light transition-colors">
            Add to Vault
          </button>
        </div>
      </div>
    </div>
  );
}
