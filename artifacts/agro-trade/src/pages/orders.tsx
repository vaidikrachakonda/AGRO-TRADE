import { Check, ChevronRight, CircleDot, MapPin, PackageCheck, Star, Truck, X } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { getGetListingQueryKey, getGetOrderQueryKey, getListOrdersQueryKey, useCreateReview, useGetListing, useGetOrder, useListOrders, useUpdateOrderStatus } from '@workspace/api-client-react';
import type { Order, OrderStatusInputStatus } from '@workspace/api-client-react';
import { EmptyState, ErrorState, formatMoney, PageIntro } from '@/components/app-shell';

const nextStatuses: OrderStatusInputStatus[] = ['farmer_confirmed', 'at_collection_hub', 'logistics_assigned', 'out_for_delivery', 'delivered'];

export default function Orders() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<'consumer' | 'farmer'>('consumer');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showReview, setShowReview] = useState(false);
  const listQuery = useListOrders({ role });
  const detailQuery = useGetOrder(selectedId ?? 0, { query: { enabled: selectedId !== null, queryKey: getGetOrderQueryKey(selectedId ?? 0) } });
  const updateStatus = useUpdateOrderStatus();
  const createReview = useCreateReview();
  const selected = detailQuery.data;
  const listingQuery = useGetListing(selected?.listingId ?? 0, { query: { enabled: Boolean(selected), queryKey: getGetListingQueryKey(selected?.listingId ?? 0) } });

  function refresh(order: Order) {
    queryClient.setQueryData(getGetOrderQueryKey(order.id), order);
    queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey({ role }) });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <PageIntro eyebrow="the journey after checkout" title="Orders & delivery" description="One calm place to see what is moving, what needs a reply, and what has made it home." action={<div className="flex rounded-full bg-muted p-1"><button type="button" data-testid="button-role-consumer" onClick={() => { setRole('consumer'); setSelectedId(null); }} className={`rounded-full px-4 py-2 text-xs font-semibold ${role === 'consumer' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}>As a buyer</button><button type="button" data-testid="button-role-farmer" onClick={() => { setRole('farmer'); setSelectedId(null); }} className={`rounded-full px-4 py-2 text-xs font-semibold ${role === 'farmer' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}>As a farmer</button></div>} />
      <div className="mt-10 grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
        <section className="space-y-3">
          <div className="mb-4 flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">{role === 'consumer' ? 'your basket trail' : 'orders to fulfil'}</p><span className="font-mono text-xs text-muted-foreground">{listQuery.data?.length ?? 0} orders</span></div>
          {listQuery.isLoading ? <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="skeleton h-28 rounded-2xl" />)}</div> : listQuery.isError ? <ErrorState onRetry={() => void listQuery.refetch()} /> : (listQuery.data ?? []).length === 0 ? <EmptyState title="No orders here yet" description={role === 'consumer' ? 'When you choose a share, the farmer and your collection hub will appear here.' : 'Your next accepted order will give you a clear next step.'} action={<button type="button" data-testid="button-browse-from-orders" onClick={() => setLocation('/')} className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Browse the market</button>} /> : (listQuery.data ?? []).map((order) => <OrderRow key={order.id} order={order} selected={selectedId === order.id} onSelect={() => setSelectedId(order.id)} />)}
        </section>
        <section className="min-h-[30rem] rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)] sm:p-7">
          {selected ? <OrderDetail order={selected} role={role} onAdvance={(status) => updateStatus.mutate({ orderId: selected.id, data: { status } }, { onSuccess: refresh })} onReview={() => setShowReview(true)} /> : <div className="flex h-full min-h-[28rem] flex-col items-center justify-center text-center"><div className="grid size-16 place-items-center rounded-2xl bg-secondary text-primary"><Truck size={28} /></div><h2 className="mt-5 font-serif text-2xl font-semibold">Your order trail, in full</h2><p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">Select an order to see its harvest, hub, and the next handoff. Nothing gets lost between field and front door.</p></div>}
        </section>
      </div>
      {showReview && selected && <ReviewDialog order={selected} onClose={() => setShowReview(false)} onSubmit={(rating, comment) => createReview.mutate({ data: { orderId: selected.id, farmerId: listingQuery.data?.farmerId ?? selected.listingId, buyerName: selected.buyerName, rating, comment } }, { onSuccess: () => setShowReview(false) })} pending={createReview.isPending} />}
    </div>
  );
}

function OrderRow({ order, selected, onSelect }: { order: Order; selected: boolean; onSelect: () => void }) {
  return <button type="button" data-testid={`button-order-${order.id}`} onClick={onSelect} className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] ${selected ? 'border-primary bg-secondary/55' : 'border-border bg-card'}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{order.crop} · {order.quantity} kg</p><p className="mt-1 text-xs text-muted-foreground">{order.farmerName} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p></div><span className="rounded-full bg-muted px-2.5 py-1 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">{order.type}</span></div><div className="mt-4 flex items-center justify-between"><span className="flex items-center gap-1.5 text-xs font-semibold text-primary"><CircleDot size={13} /> {order.status.replaceAll('_', ' ')}</span><span className="flex items-center gap-1 font-serif text-lg font-semibold">{formatMoney(order.total)} <ChevronRight size={15} className="text-muted-foreground" /></span></div></button>;
}

function OrderDetail({ order, role, onAdvance, onReview }: { order: Order; role: 'consumer' | 'farmer'; onAdvance: (status: OrderStatusInputStatus) => void; onReview: () => void }) {
  const currentIndex = order.stages.findIndex((stage) => stage.active);
  const next = role === 'farmer' ? nextStatuses[Math.min(currentIndex + 1, nextStatuses.length - 1)] : undefined;
  return <div><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">tracking {order.trackingId}</p><h2 className="mt-2 font-serif text-3xl font-semibold">{order.crop} order</h2></div><span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary"><PackageCheck size={21} /></span></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-muted/60 p-4"><p className="text-xs text-muted-foreground">from</p><p className="mt-1 text-sm font-semibold">{order.farmerName}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={12} /> {order.farmerLocation}</p></div><div className="rounded-xl bg-muted/60 p-4"><p className="text-xs text-muted-foreground">collection hub</p><p className="mt-1 text-sm font-semibold">{order.hub}</p><p className="mt-1 text-xs text-muted-foreground">{order.quantity} kg · {formatMoney(order.total)}</p></div></div><div className="mt-8">{order.stages.map((stage, index) => <div key={stage.key} className="flex gap-4"><div className="flex flex-col items-center"><span className={`grid size-8 place-items-center rounded-full ${stage.complete || stage.active ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground'}`}>{stage.complete ? <Check size={15} /> : <span className="font-mono text-xs">{index + 1}</span>}</span>{index < order.stages.length - 1 && <span className={`my-1 h-9 w-px ${stage.complete ? 'bg-primary' : 'bg-border'}`} />}</div><div className="pb-6"><p className={`text-sm font-semibold ${stage.active ? 'text-primary' : ''}`}>{stage.label}</p><p className="mt-1 text-xs text-muted-foreground">{stage.active ? 'Current handoff' : stage.complete ? 'Completed' : 'Coming up'}</p></div></div>)}</div><div className="mt-2 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">{role === 'farmer' && next && order.status !== 'delivered' && order.status !== 'rejected' && <button type="button" data-testid="button-advance-order" onClick={() => onAdvance(next)} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground">Advance to {next.replaceAll('_', ' ')} <ChevronRight size={15} /></button>}{role === 'consumer' && order.status === 'delivered' && <button type="button" data-testid="button-review-farmer" onClick={onReview} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"><Star size={16} /> Review this farmer</button>}<span className="flex h-11 items-center justify-center rounded-xl border border-border px-4 text-xs font-semibold text-muted-foreground">Last updated just now</span></div></div>;
}

function ReviewDialog({ order, onClose, onSubmit, pending }: { order: Order; onClose: () => void; onSubmit: (rating: number, comment: string) => void; pending: boolean }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  return <div className="fixed inset-0 z-50 grid place-items-center bg-primary/35 p-4 backdrop-blur-sm"><div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-lg)]"><button type="button" data-testid="button-close-review" onClick={onClose} className="absolute right-5 top-5 text-muted-foreground"><X size={18} /></button><p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">a note for the farm</p><h3 className="mt-2 font-serif text-3xl font-semibold">How did it feel?</h3><p className="mt-2 text-sm text-muted-foreground">Your clear feedback helps this farmer plan the next season.</p><div className="mt-7 flex gap-2">{[1, 2, 3, 4, 5].map((value) => <button type="button" data-testid={`button-rating-${value}`} key={value} onClick={() => setRating(value)} className={value <= rating ? 'text-accent' : 'text-muted'}><Star size={25} fill="currentColor" /></button>)}</div><textarea data-testid="textarea-review" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="What should they know?" className="mt-6 min-h-28 w-full resize-none rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" /><button type="button" data-testid="button-submit-review" disabled={pending || comment.trim().length < 3} onClick={() => onSubmit(rating, comment)} className="mt-4 h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-50">{pending ? 'Sending…' : `Send to ${order.farmerName}`}</button></div></div>;
}
