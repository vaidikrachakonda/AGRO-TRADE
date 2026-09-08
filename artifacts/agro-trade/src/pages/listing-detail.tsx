import { ArrowLeft, Check, ChevronDown, Clock3, MapPin, Package, ShieldCheck, ShoppingBasket, Truck } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useParams } from 'wouter';
import { getListOrdersQueryKey, useCreateOrder, useGetListing } from '@workspace/api-client-react';
import type { OrderInputType } from '@workspace/api-client-react';
import { cropTone, ErrorState, formatMoney, VoiceAssistButton } from '@/components/app-shell';

export default function ListingDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const listingQuery = useGetListing(id);
  const createOrder = useCreateOrder();
  const listing = listingQuery.data;
  const [orderType, setOrderType] = useState<OrderInputType>('household');
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState('');
  const [hub, setHub] = useState('');
  const [showOrder, setShowOrder] = useState(false);

  if (listingQuery.isLoading) return <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><div className="grid gap-8 lg:grid-cols-2"><div className="skeleton h-[30rem] rounded-[2rem]" /><div className="space-y-4"><div className="skeleton h-5 w-28 rounded" /><div className="skeleton h-14 w-4/5 rounded" /><div className="skeleton h-24 w-full rounded" /></div></div></div>;
  if (listingQuery.isError || !listing) return <div className="mx-auto max-w-3xl px-4 py-20"><ErrorState onRetry={() => void listingQuery.refetch()} /></div>;
  const unitPrice = orderType === 'bulk' ? listing.bulkPrice : listing.householdPrice;
  const availableQuantity = orderType === 'bulk' ? listing.bulkQuantity : Math.min(listing.householdQuantity, 15);
  const minimumQuantity = orderType === 'bulk' ? Math.min(25, listing.bulkQuantity) : 1;
  const total = unitPrice * quantity;
  const hubs = listing.location.toLowerCase().includes('keesara')
    ? ['Keesara Hub', 'Uppal Hub', 'Ghatkesar Farmers Point']
    : listing.location.toLowerCase().includes('uppal')
      ? ['Uppal Hub', 'Keesara Hub', 'Ramanthapur Collection Point']
      : [`${listing.location.split(',')[0]} Hub`, 'Keesara Hub', 'Uppal Hub'];

  function placeOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createOrder.mutate({ data: { listingId: listing!.id, buyerName, type: orderType, quantity, hub } }, {
      onSuccess: (order) => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        setLocation(`/orders?order=${order.id}`);
      },
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <Link href="/" data-testid="link-back-market" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> Back to the market</Link>
      <div className="grid gap-8 lg:grid-cols-[1.08fr_.92fr] lg:items-start">
        <div className="animate-rise">
          <div className={`relative aspect-[1.08] overflow-hidden rounded-[2rem] bg-gradient-to-br ${cropTone(listing.crop)} shadow-[var(--shadow)]`}>
            {listing.photoUrl && <img src={listing.photoUrl} alt={`${listing.variety} ${listing.crop}`} className="absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-80" />}
            <div className="absolute left-6 top-6 flex flex-wrap gap-2"><span className="rounded-full bg-card/90 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide backdrop-blur">{listing.demandLevel} demand</span>{listing.fairPrice && <span className="flex items-center gap-1 rounded-full bg-[#f5d573] px-3 py-1.5 font-mono text-[10px] text-[#4d3d16]"><Check size={12} /> fair price</span>}</div>
            <div className="absolute bottom-7 left-7 text-card"><p className="font-mono text-[10px] uppercase tracking-[.22em] text-card/75">harvested near {listing.location}</p><h1 className="mt-2 font-serif text-5xl font-semibold tracking-tight">{listing.variety} {listing.crop}</h1></div>
          </div>
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-secondary font-mono text-xs font-semibold text-primary">{listing.farmerName.split(' ').map((word) => word[0]).join('').slice(0, 2)}</span><div><p className="font-semibold">{listing.farmerName}</p><p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={12} /> {listing.location}</p></div></div>
            <Link href={`/farmer?farmer=${listing.farmerId}`} data-testid="link-farmer-profile" className="text-sm font-semibold text-primary">Farm profile <ArrowLeft size={14} className="ml-1 inline rotate-180" /></Link>
          </div>
        </div>
        <div className="animate-rise delay-1">
          <p className="font-mono text-[10px] uppercase tracking-[.22em] text-accent">one good harvest</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight">From their field<br />to your table.</h2>
          <p className="mt-5 text-sm leading-7 text-muted-foreground">Every listing tells you exactly what you are buying. Your order helps a local farmer plan the next planting with confidence.</p>
          <div className="mt-6 grid grid-cols-3 gap-2"><div className="rounded-xl bg-secondary/60 p-3"><Package size={17} className="text-primary" /><p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">unit</p><p className="mt-1 text-sm font-semibold">{listing.householdQuantity} {listing.unit}</p></div><div className="rounded-xl bg-secondary/60 p-3"><Clock3 size={17} className="text-primary" /><p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">picked</p><p className="mt-1 text-sm font-semibold">This week</p></div><div className="rounded-xl bg-secondary/60 p-3"><Truck size={17} className="text-primary" /><p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">collect at</p><p className="mt-1 text-sm font-semibold">Your hub</p></div></div>
          <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between"><div><p className="text-sm font-semibold">Choose your share</p><p className="mt-1 text-xs text-muted-foreground">Pricing stays the same from farm to hub.</p></div><div className="flex rounded-full bg-muted p-1"><button type="button" data-testid="button-order-household" onClick={() => { setOrderType('household'); setQuantity(1); }} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${orderType === 'household' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}>Household</button><button type="button" data-testid="button-order-bulk" onClick={() => { setOrderType('bulk'); setQuantity(Math.min(25, listing.bulkQuantity)); }} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${orderType === 'bulk' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}>Bulk</button></div></div>
            <div className="mt-5 flex items-end justify-between border-b border-border pb-5"><div><p className="font-serif text-3xl font-semibold text-primary">{formatMoney(unitPrice)}</p><p className="mt-1 text-xs text-muted-foreground">per {listing.unit} · {orderType === 'bulk' ? 'bulk order' : 'household order (up to 15 kg)'}</p></div><div className="text-right"><p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">market reference</p><p className="mt-1 text-sm font-semibold text-muted-foreground line-through">{formatMoney(listing.marketPrice)}</p></div></div>
            <div className="mt-5 flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Quantity ({listing.unit})</p><div className="mt-2 flex items-center gap-3"><button type="button" data-testid="button-decrease-quantity" onClick={() => setQuantity((value) => Math.max(minimumQuantity, value - 1))} className="grid size-8 place-items-center rounded-full border border-border text-lg hover:bg-muted">−</button><span data-testid="text-quantity" className="w-12 text-center font-semibold">{quantity} kg</span><button type="button" data-testid="button-increase-quantity" onClick={() => setQuantity((value) => Math.min(availableQuantity, value + 1))} className="grid size-8 place-items-center rounded-full border border-border text-lg hover:bg-muted">+</button></div></div><div className="text-right"><p className="text-xs text-muted-foreground">Estimated total</p><p data-testid="text-order-total" className="mt-1 font-serif text-2xl font-semibold">{formatMoney(total)}</p></div></div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>{availableQuantity} {listing.unit} available</span><span>{orderType === 'bulk' ? 'Bulk orders need farmer approval' : 'Household orders confirm instantly'}</span></div>
            <div className="mt-5 flex items-center gap-2"><button type="button" data-testid="button-start-order" disabled={listing.soldOut} onClick={() => setShowOrder(true)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"><ShoppingBasket size={17} /> {listing.soldOut ? 'Harvest sold out' : 'Continue to order'}</button><VoiceAssistButton label="Hear order options" text={`${listing.crop} is ${formatMoney(unitPrice)} per kilogram. ${orderType === 'bulk' ? 'Bulk orders need farmer approval.' : 'Household orders confirm instantly.'}`} /></div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground"><ShieldCheck size={14} className="text-primary" /> No hidden fees. Farmer gets a clear price.</p>
          </div>
        </div>
      </div>
      {showOrder && <div className="fixed inset-0 z-50 grid place-items-center bg-primary/35 p-4 backdrop-blur-sm"><form onSubmit={placeOrder} className="relative w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-lg)]"><button type="button" data-testid="button-close-order" onClick={() => setShowOrder(false)} className="absolute right-5 top-5 text-muted-foreground hover:text-foreground"><ChevronDown className="rotate-180" size={20} /></button><p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">last step</p><h3 className="mt-2 font-serif text-3xl font-semibold">Where should we send it?</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">We will hold your share while the farmer confirms the harvest.</p><label className="mt-6 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your name<input required data-testid="input-buyer-name" value={buyerName} onChange={(event) => setBuyerName(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. Asha Mehta" /></label><label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Collection hub<select required data-testid="select-hub" value={hub} onChange={(event) => setHub(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"><option value="">Choose a nearby hub</option>{hubs.map((hubName) => <option key={hubName} value={hubName}>{hubName}</option>)}</select></label><div className="mt-5 flex items-center justify-between rounded-xl bg-secondary/60 p-4 text-sm"><span>{quantity} kg · {orderType} order</span><strong>{formatMoney(total)}</strong></div><button type="submit" data-testid="button-place-order" disabled={createOrder.isPending} className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-60">{createOrder.isPending ? 'Saving your share…' : 'Place my order'}</button>{createOrder.isError && <p className="mt-3 text-center text-xs text-destructive">We could not place that order. Please try once more.</p>}</form></div>}
    </div>
  );
}
