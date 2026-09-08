import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, lte, gte } from "drizzle-orm";
import {
  ApproveBulkOrderBody,
  ApproveBulkOrderParams,
  CreateListingBody,
  CreateOrderBody,
  CreateReviewBody,
  GetFarmerDashboardResponse,
  GetFarmerParams,
  GetListingParams,
  GetMarketPriceParams,
  GetOrderParams,
  ListListingsQueryParams,
  ListOrdersQueryParams,
  MarkListingSoldOutParams,
  UpdateListingBody,
  UpdateListingParams,
  UpdateOrderStatusBody,
  UpdateOrderStatusParams,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import {
  farmersTable,
  listingsTable,
  ordersTable,
  reviewsTable,
  type OrderStage,
} from "@workspace/db";

const router: IRouter = Router();

const marketReference: Record<
  string,
  {
    marketPrice: number;
    sustainableLow: number;
    sustainableHigh: number;
    demandLevel: "high" | "steady" | "low";
    demandVolume: number;
    trend: "up" | "flat" | "down";
  }
> = {
  tomato: {
    marketPrice: 34,
    sustainableLow: 28,
    sustainableHigh: 42,
    demandLevel: "high",
    demandVolume: 184,
    trend: "up",
  },
  onion: {
    marketPrice: 31,
    sustainableLow: 26,
    sustainableHigh: 38,
    demandLevel: "steady",
    demandVolume: 126,
    trend: "flat",
  },
  rice: {
    marketPrice: 62,
    sustainableLow: 55,
    sustainableHigh: 74,
    demandLevel: "high",
    demandVolume: 98,
    trend: "up",
  },
  wheat: {
    marketPrice: 29,
    sustainableLow: 24,
    sustainableHigh: 35,
    demandLevel: "low",
    demandVolume: 62,
    trend: "down",
  },
};

const imageByCrop: Record<string, string> = {
  tomato:
    "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=85",
  onion:
    "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=900&q=85",
  rice:
    "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=900&q=85",
  wheat:
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=85",
};

const stageLabels = [
  ["order_placed", "Order Placed"],
  ["farmer_confirmed", "Farmer Confirmed"],
  ["at_collection_hub", "At Collection Hub"],
  ["out_for_delivery", "Out for Delivery"],
  ["delivered", "Delivered"],
] as const;

let seedPromise: Promise<void> | undefined;

function asNumber(value: string | number): number {
  return Number(value);
}

function stagesFor(
  status: string,
  type: string,
  includeLogistics = type === "bulk",
): OrderStage[] {
  const stages: OrderStage[] = [];
  for (const [key, label] of stageLabels) {
    if (key === "out_for_delivery" && includeLogistics) {
      stages.push({
        key: "logistics_assigned",
        label: "Logistics Partner Assigned",
        complete:
          status === "out_for_delivery" ||
          status === "delivered" ||
          status === "logistics_assigned",
        active: status === "logistics_assigned",
      });
    }
    const statusIndex = stageLabels.findIndex(([stageKey]) => stageKey === status);
    const stageIndex = stageLabels.findIndex(([stageKey]) => stageKey === key);
    stages.push({
      key,
      label,
      complete: status === "rejected" ? false : stageIndex <= statusIndex,
      active: key === status,
    });
  }
  return stages;
}

async function ensureSeeded() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const existing = await db.select({ id: farmersTable.id }).from(farmersTable).limit(1);
    if (existing.length > 0) return;

    const [firstFarmer, secondFarmer] = await db
      .insert(farmersTable)
      .values([
        {
          name: "Savitri Reddy",
          phone: "+91 98765 43210",
          location: "Keesara, Telangana",
          rating: "4.9",
          reviewCount: 38,
          bio: "Growing honest, seasonal produce with my family just outside Hyderabad.",
          initials: "SR",
        },
        {
          name: "Ramesh Kumar",
          phone: "+91 98480 11223",
          location: "Uppal, Telangana",
          rating: "4.7",
          reviewCount: 24,
          bio: "Second-generation grower focused on dependable grains and everyday staples.",
          initials: "RK",
        },
      ])
      .returning();

    const [tomato, onion, rice, wheat] = await db
      .insert(listingsTable)
      .values([
        {
          farmerId: firstFarmer.id,
          crop: "Tomato",
          variety: "Local red · pesticide-free",
          location: firstFarmer.location,
          photoUrl: imageByCrop.tomato,
          householdPrice: "36",
          householdQuantity: "120",
          bulkPrice: "31",
          bulkQuantity: "520",
          marketPrice: "34",
          demandLevel: "high",
        },
        {
          farmerId: firstFarmer.id,
          crop: "Onion",
          variety: "Nashik red · sorted",
          location: firstFarmer.location,
          photoUrl: imageByCrop.onion,
          householdPrice: "32",
          householdQuantity: "200",
          bulkPrice: "28",
          bulkQuantity: "800",
          marketPrice: "31",
          demandLevel: "steady",
        },
        {
          farmerId: secondFarmer.id,
          crop: "Rice",
          variety: "Sona masuri · new harvest",
          location: secondFarmer.location,
          photoUrl: imageByCrop.rice,
          householdPrice: "66",
          householdQuantity: "90",
          bulkPrice: "59",
          bulkQuantity: "600",
          marketPrice: "62",
          demandLevel: "high",
        },
        {
          farmerId: secondFarmer.id,
          crop: "Wheat",
          variety: "Sharbati · stone milled",
          location: secondFarmer.location,
          photoUrl: imageByCrop.wheat,
          householdPrice: "28",
          householdQuantity: "160",
          bulkPrice: "25",
          bulkQuantity: "900",
          marketPrice: "29",
          demandLevel: "low",
        },
      ])
      .returning();

    await db.insert(ordersTable).values({
      trackingId: "AT-2408-019",
      listingId: tomato.id,
      crop: tomato.crop,
      farmerName: firstFarmer.name,
      farmerLocation: firstFarmer.location,
      buyerName: "Meera's Kitchen",
      type: "household",
      quantity: "8",
      total: "288",
      hub: "Keesara Hub",
      status: "at_collection_hub",
      stages: stagesFor("at_collection_hub", "household"),
    });
  })();
  return seedPromise;
}

async function listingPayload(listing: typeof listingsTable.$inferSelect) {
  const [farmer] = await db
    .select()
    .from(farmersTable)
    .where(eq(farmersTable.id, listing.farmerId))
    .limit(1);
  const reference = marketReference[listing.crop.toLowerCase()];
  const householdPrice = asNumber(listing.householdPrice);
  return {
    id: listing.id,
    farmerId: listing.farmerId,
    farmerName: farmer?.name ?? "Local farmer",
    crop: listing.crop,
    variety: listing.variety,
    location: listing.location,
    photoUrl: listing.photoUrl,
    householdPrice,
    householdQuantity: asNumber(listing.householdQuantity),
    bulkPrice: asNumber(listing.bulkPrice),
    bulkQuantity: asNumber(listing.bulkQuantity),
    unit: listing.unit,
    marketPrice: reference?.marketPrice ?? asNumber(listing.marketPrice),
    demandLevel: listing.demandLevel,
    soldOut: listing.soldOut,
    fairPrice:
      householdPrice >= (reference?.sustainableLow ?? 0) &&
      householdPrice <= (reference?.sustainableHigh ?? Number.POSITIVE_INFINITY),
  };
}

async function orderPayload(order: typeof ordersTable.$inferSelect) {
  return {
    ...order,
    quantity: asNumber(order.quantity),
    total: asNumber(order.total),
    createdAt: order.createdAt.toISOString(),
  };
}

function smartRecommendation(crop: string, price?: number) {
  const reference = marketReference[crop.toLowerCase()] ?? marketReference.tomato;
  if (price === undefined) {
    return reference.demandLevel === "high"
      ? `Demand is strong this week. Stay near ₹${reference.sustainableHigh}/kg to protect your margin.`
      : `Keep close to the market range of ₹${reference.sustainableLow}–₹${reference.sustainableHigh}/kg to stay competitive.`;
  }
  if (price > reference.sustainableHigh) {
    return `This is ₹${Math.round(price - reference.marketPrice)}/kg above the mandi reference. Consider ₹${reference.sustainableHigh}/kg so buyers keep coming back.`;
  }
  if (price < reference.sustainableLow) {
    return `This is below a sustainable range. Try at least ₹${reference.sustainableLow}/kg to protect your work.`;
  }
  if (reference.demandLevel === "high" && price < reference.marketPrice) {
    return `Demand is high right now. You could move closer to ₹${reference.marketPrice}/kg without losing value for buyers.`;
  }
  if (reference.demandLevel === "low" && price > reference.marketPrice) {
    return `This crop is moving slowly. A small nudge toward ₹${reference.marketPrice}/kg may help it sell faster.`;
  }
  return "This price sits in a healthy range for you and your buyers.";
}

router.get("/listings", async (req, res) => {
  await ensureSeeded();
  const query = ListListingsQueryParams.parse(req.query);
  const conditions = [];
  if (query.crop) conditions.push(ilike(listingsTable.crop, `%${query.crop}%`));
  if (query.location) conditions.push(ilike(listingsTable.location, `%${query.location}%`));
  if (query.minPrice !== undefined) conditions.push(gte(listingsTable.householdPrice, String(query.minPrice)));
  if (query.maxPrice !== undefined) conditions.push(lte(listingsTable.householdPrice, String(query.maxPrice)));
  const listings = await db
    .select()
    .from(listingsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(listingsTable.id));
  res.json(await Promise.all(listings.map(listingPayload)));
});

router.post("/listings", async (req, res) => {
  const input = CreateListingBody.parse(req.body);
  const reference = marketReference[input.crop.toLowerCase()] ?? marketReference.tomato;
  const [listing] = await db
    .insert(listingsTable)
    .values({
      ...input,
      photoUrl: input.photoUrl || imageByCrop[input.crop.toLowerCase()] || imageByCrop.tomato,
      marketPrice: String(reference.marketPrice),
      demandLevel: reference.demandLevel,
      householdPrice: String(input.householdPrice),
      householdQuantity: String(input.householdQuantity),
      bulkPrice: String(input.bulkPrice),
      bulkQuantity: String(input.bulkQuantity),
    })
    .returning();
  res.status(201).json(await listingPayload(listing));
});

router.get("/listings/:listingId", async (req, res) => {
  await ensureSeeded();
  const { listingId } = GetListingParams.parse(req.params);
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, listingId));
  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }
  res.json(await listingPayload(listing));
});

router.patch("/listings/:listingId", async (req, res) => {
  const { listingId } = UpdateListingParams.parse(req.params);
  const input = UpdateListingBody.parse(req.body);
  const [listing] = await db
    .update(listingsTable)
    .set({
      ...input,
      householdPrice:
        input.householdPrice === undefined ? undefined : String(input.householdPrice),
      householdQuantity:
        input.householdQuantity === undefined ? undefined : String(input.householdQuantity),
      bulkPrice: input.bulkPrice === undefined ? undefined : String(input.bulkPrice),
      bulkQuantity: input.bulkQuantity === undefined ? undefined : String(input.bulkQuantity),
    })
    .where(eq(listingsTable.id, listingId))
    .returning();
  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }
  res.json(await listingPayload(listing));
});

router.post("/listings/:listingId/sold-out", async (req, res) => {
  const { listingId } = MarkListingSoldOutParams.parse(req.params);
  const [listing] = await db
    .update(listingsTable)
    .set({ soldOut: true })
    .where(eq(listingsTable.id, listingId))
    .returning();
  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }
  res.json(await listingPayload(listing));
});

router.get("/farmers", async (_req, res) => {
  await ensureSeeded();
  const farmers = await db.select().from(farmersTable).orderBy(asc(farmersTable.name));
  res.json(
    farmers.map((farmer) => ({
      ...farmer,
      rating: asNumber(farmer.rating),
    })),
  );
});

router.get("/farmers/:farmerId", async (req, res) => {
  await ensureSeeded();
  const { farmerId } = GetFarmerParams.parse(req.params);
  const [farmer] = await db.select().from(farmersTable).where(eq(farmersTable.id, farmerId));
  if (!farmer) {
    res.status(404).json({ error: "Farmer not found" });
    return;
  }
  res.json({ ...farmer, rating: asNumber(farmer.rating) });
});

router.get("/farmers/:farmerId/listings", async (req, res) => {
  await ensureSeeded();
  const { farmerId } = GetFarmerParams.parse(req.params);
  const listings = await db.select().from(listingsTable).where(eq(listingsTable.farmerId, farmerId));
  res.json(await Promise.all(listings.map(listingPayload)));
});

router.get("/orders", async (req, res) => {
  await ensureSeeded();
  const query = ListOrdersQueryParams.parse(req.query);
  const conditions = [];
  if (query.role === "farmer") conditions.push(eq(ordersTable.farmerName, "Savitri Reddy"));
  if (query.status) conditions.push(eq(ordersTable.status, query.status));
  const orders = await db
    .select()
    .from(ordersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(ordersTable.createdAt));
  res.json(await Promise.all(orders.map(orderPayload)));
});

router.post("/orders", async (req, res) => {
  await ensureSeeded();
  const input = CreateOrderBody.parse(req.body);
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, input.listingId));
  if (!listing || listing.soldOut) {
    res.status(400).json({ error: "This listing is no longer available." });
    return;
  }
  const maxQuantity = input.type === "bulk" ? asNumber(listing.bulkQuantity) : Math.min(asNumber(listing.householdQuantity), 15);
  const minimumQuantity = input.type === "bulk" ? 25 : 1;
  if (input.quantity < minimumQuantity || input.quantity > maxQuantity) {
    res.status(400).json({
      error:
        input.type === "bulk"
          ? `Bulk orders must be between ${minimumQuantity} kg and ${maxQuantity} kg.`
          : `Household orders are capped at ${maxQuantity} kg.`,
    });
    return;
  }
  const [farmer] = await db.select().from(farmersTable).where(eq(farmersTable.id, listing.farmerId));
  const unitPrice = input.type === "bulk" ? asNumber(listing.bulkPrice) : asNumber(listing.householdPrice);
  const status = input.type === "bulk" ? "order_placed" : "farmer_confirmed";
  const trackingId = `AT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  const [order] = await db
    .insert(ordersTable)
    .values({
      ...input,
      trackingId,
      crop: listing.crop,
      farmerName: farmer?.name ?? "Local farmer",
      farmerLocation: listing.location,
      quantity: String(input.quantity),
      total: String(unitPrice * input.quantity),
      status,
      stages: stagesFor(status, input.type),
    })
    .returning();
  res.status(201).json(await orderPayload(order));
});

router.get("/orders/:orderId", async (req, res) => {
  const { orderId } = GetOrderParams.parse(req.params);
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(await orderPayload(order));
});

router.patch("/orders/:orderId/approval", async (req, res) => {
  const { orderId } = ApproveBulkOrderParams.parse(req.params);
  const { decision } = ApproveBulkOrderBody.parse(req.body);
  const status = decision === "accepted" ? "farmer_confirmed" : "rejected";
  const [current] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!current) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const [order] = await db
    .update(ordersTable)
    .set({ status, stages: stagesFor(status, current.type) })
    .where(eq(ordersTable.id, orderId))
    .returning();
  res.json(await orderPayload(order));
});

router.patch("/orders/:orderId/status", async (req, res) => {
  const { orderId } = UpdateOrderStatusParams.parse(req.params);
  const { status } = UpdateOrderStatusBody.parse(req.body);
  const [current] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!current) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const [order] = await db
    .update(ordersTable)
    .set({ status, stages: stagesFor(status, current.type) })
    .where(eq(ordersTable.id, orderId))
    .returning();
  res.json(await orderPayload(order));
});

router.post("/reviews", async (req, res) => {
  const input = CreateReviewBody.parse(req.body);
  const [review] = await db.insert(reviewsTable).values(input).returning();
  const [farmer] = await db.select().from(farmersTable).where(eq(farmersTable.id, input.farmerId));
  if (farmer) {
    const reviewCount = farmer.reviewCount + 1;
    const nextRating =
      (asNumber(farmer.rating) * farmer.reviewCount + input.rating) / reviewCount;
    await db
      .update(farmersTable)
      .set({ reviewCount, rating: nextRating.toFixed(2) })
      .where(eq(farmersTable.id, input.farmerId));
  }
  res.status(201).json({
    ...review,
    createdAt: review.createdAt.toISOString(),
  });
});

router.get("/farmer/dashboard", async (_req, res) => {
  await ensureSeeded();
  const orders = await db.select().from(ordersTable);
  const totalSales = orders
    .filter((order) => order.status !== "rejected")
    .reduce((sum, order) => sum + asNumber(order.total), 0);
  const chart = [
    { label: "Mar 04", value: 6200 },
    { label: "Mar 11", value: 7800 },
    { label: "Mar 18", value: 7100 },
    { label: "Mar 25", value: 9640 },
    { label: "Apr 01", value: Math.round(totalSales + 8400) },
  ];
  res.json(
    GetFarmerDashboardResponse.parse({
      totalSales: Math.round(totalSales + 28640),
      totalProfit: Math.round(totalSales * 0.31 + 8920),
      bestSellingCrop: "Tomato",
      pendingApprovals: orders.filter(
        (order) => order.type === "bulk" && order.status === "order_placed",
      ).length,
      chart,
    }),
  );
});

router.get("/farmer/recommendations", async (_req, res) => {
  res.json([
    {
      crop: "Tomato",
      demand: "High",
      reason: "Household orders are up 24% this month",
      score: 94,
    },
    {
      crop: "Green chilli",
      demand: "Rising",
      reason: "Restaurants near Uppal are buying more every week",
      score: 86,
    },
    {
      crop: "Tur dal",
      demand: "Steady",
      reason: "Reliable repeat demand from local households",
      score: 74,
    },
  ]);
});

router.get("/market-prices/:crop", async (req, res) => {
  const { crop } = GetMarketPriceParams.parse(req.params);
  const reference = marketReference[crop.toLowerCase()] ?? marketReference.tomato;
  res.json({
    crop,
    ...reference,
    recommendation: smartRecommendation(crop),
  });
});

export default router;