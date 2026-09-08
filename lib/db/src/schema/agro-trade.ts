import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const farmersTable = pgTable("agro_farmers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  location: text("location").notNull(),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  bio: text("bio").notNull().default(""),
  initials: text("initials").notNull(),
});

export const listingsTable = pgTable("agro_listings", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id")
    .notNull()
    .references(() => farmersTable.id),
  crop: text("crop").notNull(),
  variety: text("variety").notNull(),
  location: text("location").notNull(),
  photoUrl: text("photo_url").notNull(),
  householdPrice: numeric("household_price", { precision: 10, scale: 2 }).notNull(),
  householdQuantity: numeric("household_quantity", { precision: 10, scale: 2 }).notNull(),
  bulkPrice: numeric("bulk_price", { precision: 10, scale: 2 }).notNull(),
  bulkQuantity: numeric("bulk_quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull().default("kg"),
  marketPrice: numeric("market_price", { precision: 10, scale: 2 }).notNull(),
  demandLevel: text("demand_level").notNull().default("steady"),
  soldOut: boolean("sold_out").notNull().default(false),
});

export const ordersTable = pgTable("agro_orders", {
  id: serial("id").primaryKey(),
  trackingId: text("tracking_id").notNull().unique(),
  listingId: integer("listing_id")
    .notNull()
    .references(() => listingsTable.id),
  crop: text("crop").notNull(),
  farmerName: text("farmer_name").notNull(),
  farmerLocation: text("farmer_location").notNull(),
  buyerName: text("buyer_name").notNull(),
  type: text("type").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  hub: text("hub").notNull(),
  status: text("status").notNull().default("order_placed"),
  stages: jsonb("stages").notNull().$type<OrderStage[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reviewsTable = pgTable("agro_reviews", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => ordersTable.id),
  farmerId: integer("farmer_id")
    .notNull()
    .references(() => farmersTable.id),
  buyerName: text("buyer_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OrderStage = {
  key: string;
  label: string;
  complete: boolean;
  active: boolean;
};

export const insertFarmerSchema = createInsertSchema(farmersTable).omit({ id: true });
export const insertListingSchema = createInsertSchema(listingsTable).omit({ id: true });
export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true });

export type Farmer = typeof farmersTable.$inferSelect;
export type Listing = typeof listingsTable.$inferSelect;
export type Order = typeof ordersTable.$inferSelect;
export type Review = typeof reviewsTable.$inferSelect;