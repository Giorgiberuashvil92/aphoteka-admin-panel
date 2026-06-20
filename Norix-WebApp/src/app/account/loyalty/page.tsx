function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <section className="rounded-2xl border border-norix-border bg-white p-8">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="mt-3 text-[15px] leading-7 text-norix-gray-600">{description}</p>
    </section>
  );
}

export default function LoyaltyPage() {
  return (
    <PlaceholderPage
      title="ლოიალობის ბარათები"
      description="ლოიალობის ბარათები და ქულები აქ გამოჩნდება."
    />
  );
}
