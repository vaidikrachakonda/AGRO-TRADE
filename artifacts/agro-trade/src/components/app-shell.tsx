import { Bell, ChevronRight, ClipboardList, Languages, LayoutDashboard, Mic, Search, Sprout, Store, UserRound } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useState, type ReactNode } from 'react';

type Language = 'en' | 'hi' | 'te';

const translations: Record<Language, { market: string; orders: string; farmDesk: string; account: string }> = {
  en: { market: 'Market', orders: 'Orders', farmDesk: 'Farm desk', account: 'Account' },
  hi: { market: 'बाज़ार', orders: 'ऑर्डर', farmDesk: 'खेत डेस्क', account: 'खाता' },
  te: { market: 'మార్కెట్', orders: 'ఆర్డర్లు', farmDesk: 'పంట డెస్క్', account: 'ఖాతా' },
};

const nav = [
  { href: '/', key: 'market' as const, icon: Store },
  { href: '/orders', key: 'orders' as const, icon: ClipboardList },
  { href: '/farmer', key: 'farmDesk' as const, icon: LayoutDashboard },
];

export function speak(text: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }
}

export function VoiceAssistButton({ label = 'Hear this action', text = label }: { label?: string; text?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => speak(text)}
      className="grid size-9 place-items-center rounded-full border border-primary/20 bg-primary/5 text-primary transition hover:bg-primary/10"
    >
      <Mic size={15} />
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isAuth = location === '/login';
  const [language, setLanguage] = useState<Language>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('agro-language') : null;
    return saved === 'hi' || saved === 'te' ? saved : 'en';
  });
  const copy = translations[language];
  return (
    <div className="grain min-h-[100dvh] bg-background text-foreground">
      {!isAuth && (
        <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
          <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" data-testid="link-brand" className="group flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:-rotate-3">
                <Sprout size={20} strokeWidth={2.5} />
              </span>
              <span className="leading-none">
                <span className="block font-serif text-[1.35rem] font-semibold tracking-tight">AGRO TRADE</span>
                <span className="mt-1 block font-mono text-[9px] uppercase tracking-[.22em] text-muted-foreground">grown close · shared fairly</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {nav.map(({ href, key, icon: Icon }) => (
                <Link key={href} href={href} data-testid={`link-nav-${key}`} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${location === href ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                  <Icon size={16} /> {copy[key]}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-2 text-xs font-semibold text-muted-foreground">
                <Languages size={14} />
                <span className="sr-only">Language</span>
                <select
                  aria-label="Language"
                  value={language}
                  onChange={(event) => {
                    const nextLanguage = event.target.value as Language;
                    setLanguage(nextLanguage);
                    window.localStorage.setItem('agro-language', nextLanguage);
                  }}
                  className="bg-transparent outline-none"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी</option>
                  <option value="te">తెలుగు</option>
                </select>
              </label>
              <VoiceAssistButton label="Voice assist" text="Welcome to Agro Trade. Choose a market, orders, or farm desk." />
              <button type="button" data-testid="button-notifications" className="hidden size-10 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted sm:grid">
                <Bell size={17} />
              </button>
              <Link href="/login" data-testid="link-account" className="flex items-center gap-2 rounded-full bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">
                <UserRound size={16} /> <span className="hidden sm:inline">{copy.account}</span>
              </Link>
            </div>
          </div>
        </header>
      )}
      <main>{children}</main>
      {!isAuth && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-card/95 px-3 py-2 backdrop-blur-lg md:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-around">
            {nav.map(({ href, key, icon: Icon }) => (
              <Link key={href} href={href} data-testid={`link-mobile-${key}`} className={`flex min-w-[4.4rem] flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-semibold ${location === href ? 'text-primary' : 'text-muted-foreground'}`}>
                <Icon size={19} strokeWidth={location === href ? 2.5 : 1.8} />{copy[key]}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

export function PageIntro({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[.22em] text-accent">{eyebrow}</p>}
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="leaf-grid flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-secondary/35 p-8 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-card text-primary shadow-sm"><Search size={20} /></span>
      <h3 className="font-serif text-xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
      <h3 className="font-serif text-xl font-semibold">The market is taking a breath</h3>
      <p className="mt-2 text-sm text-muted-foreground">We could not load this section. Your place in line is safe.</p>
      <button type="button" data-testid="button-retry" onClick={onRetry} className="mt-5 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Try again <ChevronRight size={15} /></button>
    </div>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: count }).map((_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-border bg-card"><div className="skeleton h-48" /><div className="space-y-3 p-5"><div className="skeleton h-3 w-24 rounded" /><div className="skeleton h-6 w-40 rounded" /><div className="skeleton h-4 w-28 rounded" /></div></div>)}</div>;
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

export function cropTone(crop: string) {
  const tones: Record<string, string> = { tomato: 'from-[#f0b78c] via-[#e77f58] to-[#8f3f38]', wheat: 'from-[#eed58c] via-[#c7a34f] to-[#896f38]', rice: 'from-[#dce6cf] via-[#9eb68a] to-[#526b4b]', onion: 'from-[#dcc2d2] via-[#9d718d] to-[#5b4156]', potato: 'from-[#e4c39b] via-[#b48455] to-[#64452f]' };
  return tones[crop.toLowerCase()] ?? 'from-[#d6d6a8] via-[#8eaa78] to-[#3c6652]';
}
