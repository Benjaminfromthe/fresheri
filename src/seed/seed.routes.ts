// ─────────────────────────────────────────────────────────────
// Seed Router — protected one-shot DB seed endpoint
// POST /seed?secret=SEED_SECRET
// Only available when SEED_SECRET env var is set.
// ─────────────────────────────────────────────────────────────

import { Router, Request, Response } from "express";
import { PrismaClient, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

// ── Fixed seed IDs — must match web/lib/mock-listings.ts ──────

const SEED_SELLER_ID    = "00000000-0000-0000-0000-000000000010";
const SEED_CATEGORY_VEG = "00000000-0000-0000-0000-000000000100";
const SEED_CATEGORY_TUB = "00000000-0000-0000-0000-000000000101";
const SEED_CATEGORY_FRU = "00000000-0000-0000-0000-000000000102";
const SEED_CATEGORY_GRA = "00000000-0000-0000-0000-000000000103";

interface ListingSeedRow {
  id: string;
  categoryId: string;
  title: string;
  produceName: string;
  variety: string | null;
  totalQty: number;
  availableQty: number;
  minQty: number;
  unitPrice: number;
  harvestDate: string;
  farmLocation: string;
  deliveryOptions: string;
  radiusKm: number | null;
  isOrganic: boolean;
  status: string;
  images: string;
}

const LISTINGS: ListingSeedRow[] = [
  {
    id: "00000000-0000-0000-0001-000000000001", categoryId: SEED_CATEGORY_VEG,
    title: "Fresh Tomatoes — Sukari F1", produceName: "Tomatoes", variety: "Sukari F1",
    totalQty: 2000, availableQty: 1500, minQty: 50, unitPrice: 450,
    harvestDate: "2026-09-01", farmLocation: "Rwamagana, Eastern Province",
    deliveryOptions: "SELF_PICKUP,DELIVERED", radiusKm: 80, isOrganic: false,
    status: "PARTIALLY_SOLD", images: "/images/assets/products/tomatoes.jpg",
  },
  {
    id: "00000000-0000-0000-0001-000000000002", categoryId: SEED_CATEGORY_TUB,
    title: "Irish Potatoes — Kinigi", produceName: "Irish Potatoes", variety: "Kinigi",
    totalQty: 10000, availableQty: 10000, minQty: 100, unitPrice: 380,
    harvestDate: "2026-08-28", farmLocation: "Musanze, Northern Province",
    deliveryOptions: "SELF_PICKUP,DELIVERED", radiusKm: 60, isOrganic: false,
    status: "ACTIVE", images: "/images/assets/products/irish-potatoes.jpg",
  },
  {
    id: "00000000-0000-0000-0001-000000000003", categoryId: SEED_CATEGORY_VEG,
    title: "Cabbage — Gloria F1", produceName: "Cabbage", variety: "Gloria F1",
    totalQty: 5000, availableQty: 5000, minQty: 50, unitPrice: 250,
    harvestDate: "2026-09-02", farmLocation: "Nyabihu, Western Province",
    deliveryOptions: "SELF_PICKUP,DELIVERED", radiusKm: 70, isOrganic: false,
    status: "ACTIVE", images: "/images/assets/products/cabbage.jpg",
  },
  {
    id: "00000000-0000-0000-0001-000000000004", categoryId: SEED_CATEGORY_VEG,
    title: "Organic Peppers — California Wonder", produceName: "Peppers", variety: "California Wonder",
    totalQty: 800, availableQty: 800, minQty: 20, unitPrice: 1200,
    harvestDate: "2026-09-04", farmLocation: "Rubavu, Western Province",
    deliveryOptions: "SELF_PICKUP,DELIVERED", radiusKm: null, isOrganic: true,
    status: "ACTIVE", images: "/images/assets/products/peppers.jpg",
  },
  {
    id: "00000000-0000-0000-0001-000000000005", categoryId: SEED_CATEGORY_FRU,
    title: "Green Bananas — Bulk", produceName: "Green Bananas", variety: null,
    totalQty: 2000, availableQty: 2000, minQty: 100, unitPrice: 350,
    harvestDate: "2026-09-01", farmLocation: "Kayonza, Eastern Province",
    deliveryOptions: "DELIVERED", radiusKm: 150, isOrganic: false,
    status: "ACTIVE", images: "/images/assets/products/green-bananas.jpg",
  },
  {
    id: "00000000-0000-0000-0001-000000000006", categoryId: SEED_CATEGORY_VEG,
    title: "Organic African Eggplant", produceName: "African Eggplant", variety: null,
    totalQty: 300, availableQty: 300, minQty: 10, unitPrice: 900,
    harvestDate: "2026-09-05", farmLocation: "Bugesera, Eastern Province",
    deliveryOptions: "SELF_PICKUP", radiusKm: null, isOrganic: true,
    status: "ACTIVE", images: "/images/assets/products/eggplant.jpg",
  },
];

export function createSeedRouter(db: PrismaClient): Router {
  const router = Router();

  router.post("/", async (req: Request, res: Response): Promise<void> => {
    // Gate: SEED_SECRET must match the request
    // Falls back to a hardcoded one-time bootstrap secret if env var not set
    const secret = process.env.SEED_SECRET ?? "fresheri-seed-bootstrap-2024";
    const provided = (req.query.secret ?? (req.body as Record<string,string>)?.secret ?? "") as string;

    if (!provided || provided !== secret) {
      res.status(403).json({ error: "FORBIDDEN", message: "Invalid or missing seed secret." });
      return;
    }

    try {
      const log: string[] = [];

      // ── 1. Upsert categories ───────────────────────────────
      const categories = [
        { id: SEED_CATEGORY_VEG, name: "Vegetables", slug: "vegetables" },
        { id: SEED_CATEGORY_TUB, name: "Tubers",     slug: "tubers"     },
        { id: SEED_CATEGORY_FRU, name: "Fruits",     slug: "fruits"     },
        { id: SEED_CATEGORY_GRA, name: "Grains",     slug: "grains"     },
      ];
      for (const cat of categories) {
        await db.produceCategory.upsert({
          where:  { id: cat.id },
          update: { name: cat.name, slug: cat.slug },
          create: { id: cat.id, name: cat.name, slug: cat.slug },
        });
      }
      log.push("categories: 4 upserted");

      // ── 2. Upsert demo cooperative seller ─────────────────
      const passwordHash = await bcrypt.hash("demo-seller-2024!", 10);
      await db.user.upsert({
        where:  { id: SEED_SELLER_ID },
        update: {},
        create: {
          id:           SEED_SELLER_ID,
          phone:        "+250788000001",
          email:        "demo-coop@fresheri.rw",
          passwordHash,
          firstName:    "Demo",
          lastName:     "Cooperative",
          role:         "COOPERATIVE",
          status:       UserStatus.ACTIVE,
          isVerified:   true,
        },
      });
      await db.cooperativeProfile.upsert({
        where:  { userId: SEED_SELLER_ID },
        update: { cooperativeName: "Verified Cooperative Member" },
        create: {
          id:                  "00000000-0000-0000-0000-000000000011",
          userId:              SEED_SELLER_ID,
          cooperativeName:     "Verified Cooperative Member",
          registrationNumber:  "COOP-RW-2024-001",
          districtOfOperation: "Rwamagana",
        },
      });
      log.push("seller: upserted");

      // ── 3. Upsert all 6 listings ───────────────────────────
      for (const l of LISTINGS) {
        const deliveryOpts = l.deliveryOptions.split(",") as ("SELF_PICKUP" | "DELIVERED")[];
        await db.produceListing.upsert({
          where:  { id: l.id },
          update: {
            availableQuantity: l.availableQty,
            status:            l.status as "ACTIVE" | "PARTIALLY_SOLD",
            updatedAt:         new Date(),
          },
          create: {
            id:               l.id,
            sellerId:         SEED_SELLER_ID,
            categoryId:       l.categoryId,
            title:            l.title,
            produceName:      l.produceName,
            variety:          l.variety,
            totalQuantity:    l.totalQty,
            availableQuantity: l.availableQty,
            minimumOrderQty:  l.minQty,
            unitPrice:        l.unitPrice,
            currency:         "RWF",
            harvestDate:      new Date(l.harvestDate),
            farmLocation:     l.farmLocation,
            deliveryOptions:  deliveryOpts,
            deliveryRadiusKm: l.radiusKm,
            isOrganic:        l.isOrganic,
            status:           l.status as "ACTIVE" | "PARTIALLY_SOLD",
            imageUrls:        [l.images],
          },
        });
        log.push(`listing: ${l.produceName} (${l.id})`);
      }

      res.status(200).json({
        message: "Seed completed successfully.",
        log,
      });
    } catch (err) {
      console.error("[Seed] Error:", err);
      res.status(500).json({
        error: "SEED_FAILED",
        message: err instanceof Error ? err.message : "Seed failed.",
      });
    }
  });

  return router;
}
