import { ArrowRight, Check, Filter, MapPin, Search, ShieldCheck, Star, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { getGetFarmerQueryKey, getListFarmerListingsQueryKey, useGetFarmer, useListFarmerListings, useListFarmers, useListListings } from '@workspace/api-client-react';
import type { Farmer, ListListingsParams, Listing } from '@workspace/api-client-react';
import { cropTone, EmptyState, ErrorState, formatMoney, SkeletonCards } from '@/components/app-shell';

function ListingCard({ listing, onFarmer }: { listing: Listing; onFarmer: (id: number) => void }) {
  return (
    <article data-testid={`card-listing-${listing.id}`} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow)]">
      <Link href={`/listing/${listing.id}`} data-testid={`link-listing-${listing.id}`} className="block">
        <div className={`relative h-52 overflow-hidden bg-gradient-to-br ${cropTone(listing.crop)}`}>
          {listing.photoUrl && <img src={listing.photoUrl} alt={`${listing.variety} ${listing.crop}`} className="absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-80 transition duration-500 group-hover:scale-105" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span className="rounded-full bg-card/90 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide text-foreground backdrop-blur">{listing.demandLevel} demand</span>
            {listing.fairPrice && <span className="flex items-center gap-1 rounded-full bg-[#f5d573] px-2.5 py-1 font-mono text-[10px] font-medium text-[#4d3d16]"><Check size={11} /> fair price</span>}
          </div>
          <div className="absolute bottom-4 left-4 text-card"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-card/75">{listing.location}</p><h2 className="mt-1 font-serif text-2xl font-semibold">{listing.variety} {listing.crop}</h2></div>
        </div>
      </Link>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <button type="button" data-testid={`button-farmer-${listing.farmerId}`} onClick={() => onFarmer(listing.farmerId)} className="flex min-w-0 items-center gap-2 text-left group/farmer">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary font-mono text-[10px] font-semibold text-primary">{listing.farmerName.split(' ').map((word) => word[0]).join('').slice(0, 2)}</span>
            <span className="truncate text-sm font-semibold group-hover/farmer:text-primary">{listing.farmerName}</span>
          </button>
          <div className="text-right"><p className="font-serif text-xl font-semibold text-primary">{formatMoney(listing.householdPrice)}</p><p className="font-mono text-[10px] text-muted-foreground">/{listing.unit}</p></div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span>Household · {listing.householdQuantity} {listing.unit}</span>
          {listing.soldOut ? <span className="font-semibold text-destructive">Sold out</span> : <span className="flex items-center gap-1 font-semibold text-primary">View harvest <ArrowRight size={13} /></span>}
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ListListingsParams>({});
  const [profileId, setProfileId] = useState<number | null>(null);
  const listingsQuery = useListListings(filters);
  const farmersQuery = useListFarmers();
  const profileQuery = useGetFarmer(profileId ?? 0, { query: { enabled: profileId !== null, queryKey: getGetFarmerQueryKey(profileId ?? 0) } });
  const profileListingsQuery = useListFarmerListings(profileId ?? 0, { query: { enabled: profileId !== null, queryKey: getListFarmerListingsQueryKey(profileId ?? 0) } });
  const listings = (listingsQuery.data ?? []).filter((listing) => {
    const needle = search.trim().toLowerCase();
    return !needle || `${listing.crop} ${listing.variety} ${listing.location} ${listing.farmerName}`.toLowerCase().includes(needle);
  });

  function applyFilter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const location = String(form.get('location') ?? '');
    const crop = String(form.get('crop') ?? '');
    setFilters({ ...(location ? { location } : {}), ...(crop ? { crop } : {}) });
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-[#dfe8d5]">
        <div className="leaf-grid absolute inset-0 opacity-40" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8">
          <div className="animate-rise">
            <p className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[.25em] text-primary"><span className="size-2 rounded-full bg-accent" /> direct from nearby farms</p>
            <h1 className="max-w-2xl font-serif text-[clamp(3.2rem,8vw,6.6rem)] font-semibold leading-[.93] tracking-[-.055em] text-primary">Good food<br /><em className="font-normal text-accent">knows its way</em><br />home.</h1>
            <p className="mt-7 max-w-md text-base leading-7 text-primary/75">A quieter way to buy what is growing around you. Meet the farmer, see the fair price, choose a collection hub, and enjoy the season at its best.</p>
            <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-semibold text-primary">
              <span className="flex items-center gap-2"><ShieldCheck size={17} /> verified farms</span><span className="h-4 w-px bg-primary/20" /><span>transparent pricing</span>
            </div>
          </div>
          <div className="animate-rise delay-2 relative mx-auto w-full max-w-md">
            <div className="relative aspect-[1.05] overflow-hidden rounded-[2.5rem] border-[10px] border-card/75 bg-gradient-to-br from-[#f3c790] via-[#c77955] to-[#456b55] shadow-[var(--shadow-lg)]">
              <div className="absolute -right-4 -top-8 size-44 rounded-full border-[24px] border-[#f4da94]/80" />
              <div className="absolute bottom-[-15%] left-[-8%] h-[65%] w-[80%] rotate-[-14deg] rounded-[55%] bg-[#65845d]" />
              <div className="absolute bottom-[14%] right-[3%] h-[46%] w-[55%] rotate-[18deg] rounded-[45%] bg-[#9dbb77]" />
              <div className="absolute bottom-[18%] left-[35%] h-28 w-20 rotate-[-25deg] rounded-[60%] bg-[#f1c56e] shadow-[-30px_22px_0_#dd9f54,28px_12px_0_#eaa965]" />
              <div className="absolute bottom-7 left-7 rounded-xl bg-card/90 px-4 py-3 backdrop-blur"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-muted-foreground">harvest note</p><p className="mt-1 font-serif text-lg font-semibold text-primary">Picked this morning.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="font-mono text-[10px] uppercase tracking-[.24em] text-accent">the nearby market</p><h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">What's good this week</h2></div>
          <p className="max-w-xs text-sm leading-6 text-muted-foreground">Small harvests, honest quantities. Listings change as the fields do.</p>
        </div>
        <form onSubmit={applyFilter} className="mt-8 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-sm)] sm:flex-row">
          <label className="flex flex-1 items-center gap-3 rounded-xl bg-muted/60 px-4"><Search size={18} className="text-muted-foreground" /><input data-testid="input-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search a crop, farmer, or place" className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" /></label>
          <label className="flex items-center gap-2 rounded-xl border border-transparent bg-muted/60 px-3"><Filter size={16} className="text-muted-foreground" /><select data-testid="select-crop" name="crop" className="h-12 bg-transparent pr-8 text-sm outline-none"><option value="">All crops</option><option value="tomato">Tomato</option><option value="wheat">Wheat</option><option value="rice">Rice</option><option value="onion">Onion</option></select></label>
          <label className="flex items-center gap-2 rounded-xl border border-transparent bg-muted/60 px-3"><MapPin size={16} className="text-muted-foreground" /><select data-testid="select-location" name="location" className="h-12 bg-transparent pr-8 text-sm outline-none"><option value="">Everywhere</option><option value="Keesara">Keesara</option><option value="Uppal">Uppal</option></select></label>
          <button type="submit" data-testid="button-filter" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">Find harvest <ArrowRight size={16} /></button>
        </form>
        <div className="mt-8">
          {listingsQuery.isLoading ? <SkeletonCards count={6} /> : listingsQuery.isError ? <ErrorState onRetry={() => void listingsQuery.refetch()} /> : listings.length === 0 ? <EmptyState title="Nothing in that patch yet" description="Try a wider search or check back after the next harvest window." action={<button type="button" data-testid="button-clear-filters" onClick={() => { setSearch(''); setFilters({}); }} className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Clear the search</button>} /> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{listings.map((listing, index) => <div key={listing.id} className={`animate-rise delay-${Math.min(index + 1, 3)}`}><ListingCard listing={listing} onFarmer={setProfileId} /></div>)}</div>}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/35">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[.24em] text-accent">people behind the produce</p><h2 className="mt-2 font-serif text-3xl font-semibold">Know your farmer</h2></div><span className="hidden text-sm text-muted-foreground sm:block">Trust grows face to face.</span></div>
          {farmersQuery.isLoading ? <div className="mt-7 grid gap-4 sm:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="skeleton h-28 rounded-2xl" />)}</div> : <div className="mt-7 grid gap-4 sm:grid-cols-3">{(farmersQuery.data ?? []).slice(0, 3).map((farmer: Farmer) => <button type="button" data-testid={`button-profile-${farmer.id}`} key={farmer.id} onClick={() => setProfileId(farmer.id)} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"><span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary font-serif text-lg text-primary-foreground">{farmer.initials}</span><span className="min-w-0"><span className="block truncate font-semibold">{farmer.name}</span><span className="mt-1 block text-xs text-muted-foreground">{farmer.location}</span><span className="mt-1 flex items-center gap-1 text-xs font-semibold text-accent"><Star size={12} fill="currentColor" /> {farmer.rating.toFixed(1)} <span className="font-normal text-muted-foreground">({farmer.reviewCount} reviews)</span></span></span><ArrowRight className="ml-auto shrink-0 text-muted-foreground" size={16} /></button>)}</div>}
        </div>
      </section>

      {profileId !== null && <div className="fixed inset-0 z-50 grid place-items-center bg-primary/35 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
        <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-lg)]">
          <button type="button" data-testid="button-close-profile" onClick={() => setProfileId(null)} className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground"><X size={17} /></button>
          {profileQuery.isLoading ? <div className="space-y-4"><div className="skeleton size-16 rounded-full" /><div className="skeleton h-7 w-44 rounded" /><div className="skeleton h-20 w-full rounded" /></div> : profileQuery.data ? <><div className="flex items-center gap-4"><span className="grid size-16 place-items-center rounded-full bg-primary font-serif text-xl text-primary-foreground">{profileQuery.data.initials}</span><div><p className="font-serif text-2xl font-semibold">{profileQuery.data.name}</p><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin size={14} /> {profileQuery.data.location}</p></div></div><p className="mt-6 text-sm leading-7 text-muted-foreground">{profileQuery.data.bio}</p><div className="mt-5"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-accent">also growing</p><div className="mt-2 flex flex-wrap gap-2">{profileListingsQuery.isLoading ? <span className="text-xs text-muted-foreground">Loading crops…</span> : (profileListingsQuery.data ?? []).map((crop) => <span key={crop.id} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold">{crop.crop}</span>)}</div></div><div className="mt-6 flex items-center justify-between rounded-2xl bg-secondary/60 p-4"><div><p className="text-xs text-muted-foreground">community rating</p><p className="mt-1 flex items-center gap-1 font-semibold"><Star size={14} fill="currentColor" className="text-accent" /> {profileQuery.data.rating.toFixed(1)} / 5</p></div><Link href={`/farmer?farmer=${profileQuery.data.id}`} data-testid="link-view-farmer" onClick={() => setProfileId(null)} className="flex items-center gap-1 text-sm font-semibold text-primary">View farm <ArrowRight size={15} /></Link></div></> : <p className="text-sm text-muted-foreground">Farmer details are unavailable right now.</p>}
        </div>
      </div>}
    </div>
  );
}
