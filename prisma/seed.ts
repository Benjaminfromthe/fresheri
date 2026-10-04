// ─────────────────────────────────────────────────────────────
// Fresheri DB Seed — creates a demo seller + 6 produce listings
// that match the frontend mock-listings.ts exactly.
//
// IDs are fixed so the frontend can reference them directly.
// Run: npx ts-node prisma/seed.ts
// Or:  curl -X POST https://fresheri-v6kz.vercel.app/seed?secret=SEED_SECRET
// ─────────────────────────────────────────────────────────────

import { PrismaClient, UserRole, UserStatus, ListingStatus, DeliveryOption } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── Fixed seller ID — consistent across re-seeds ─────────────
const SEED_SELLER_ID    = "00000000-0000-0000-0000-000000000010";
const SEED_CATEGORY_VEG = "00000000-0000-0000-0000-000000000100";
const SEED_CATEGORY_TUB = "00000000-0000-0000-0000-000000000101";
const SEED_CATEGORY_FRU = "00000000-0000-0000-0000-000000000102";
const SEED_CATEGORY_GRA = "00000000-0000-0000-0000-000000000103";

async function seed() {
  console.log("🌱 Seeding Fresheri database...");

  // ── 1. Upsert produce categories ──────────────────────────
  await prisma.$executeRaw`
    INSERT INTO "ProduceCategory" (id, name, slug, "createdAt", "updatedAt")
    VALUES
      (${SEED_CATEGORY_VEG}, 'Vegetables', 'vegetables', NOW(), NOW()),
      (${SEED_CATEGORY_TUB}, 'Tubers',     'tubers',     NOW(), NOW()),
      (${SEED_CATEGORY_FRU}, 'Fruits',     'fruits',     NOW(), NOW()),
      (${SEED_CATEGORY_GRA}, 'Grains',     'grains',     NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
  `;
  console.log("✅ Categories upserted");

  // ── 2. Upsert demo cooperative seller ─────────────────────
  const passwordHash = await bcrypt.hash("demo-seller-2024", 10);
  await prisma.$executeRaw`
    INSERT INTO "User" (id, phone, email, "passwordHash", "firstName", "lastName", role, status, "isVerified", "createdAt", "updatedAt")
    VALUES (
      ${SEED_SELLER_ID},
      '+250788000001',
      'demo-coop@fresheri.rw',
      ${passwordHash},
      'Demo',
      'Cooperative',
      'COOPERATIVE'::"UserRole",
      'ACTIVE'::"UserStatus",
      true,
      NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `;

  // Upsert cooperative profile
  await prisma.$executeRaw`
    INSERT INTO "CooperativeProfile" (id, "userId", "cooperativeName", "registrationNumber", "districtOfOperation", "createdAt", "updatedAt")
    VALUES (
      '00000000-0000-0000-0000-000000000011',
      ${SEED_SELLER_ID},
      'Verified Cooperative Member',
      'COOP-RW-2024-001',
      'Rwamagana',
      NOW(), NOW()
    )
    ON CONFLICT ("userId") DO UPDATE SET "cooperativeName" = EXCLUDED."cooperativeName"
  `;
  console.log("✅ Demo seller upserted");

  // ── 3. Upsert 6 produce listings matching frontend mock data ─

  type ListingSeed = {
    id: string;
    categoryId: string;
    title: string;
    produceName: string;
    variety: string | null;
    totalQuantity: number;
    availableQuantity: number;
    minimumOrderQty: number;
    unitPrice: number;
    harvestDate: string;
    farmLocation: string;
    deliveryOptions: string;
    deliveryRadiusKm: number | null;
    isOrganic: boolean;
    status: string;
    imageUrls: string;
  };

  const listings: ListingSeed[] = [
    {
      id: "00000000-0000-0000-0001-000000000001",
      categoryId: SEED_CATEGORY_VEG,
      title: "Fresh Tomatoes — Sukari F1",
      produceName: "Tomatoes",
      variety: "Sukari F1",
      totalQuantity: 2000,
      availableQuantity: 1500,
      minimumOrderQty: 50,
      unitPrice: 450,
      harvestDate: "2026-09-01",
      farmLocation: "Rwamagana, Eastern Province",
      deliveryOptions: `'{SELF_PICKUP,DELIVERED}'::"DeliveryOption"[]`,
      deliveryRadiusKm: 80,
      isOrganic: false,
      status: "PARTIALLY_SOLD",
      imageUrls: `'{"/images/assets/products/tomatoes.jpg"}'`,
    },
    {
      id: "00000000-0000-0000-0001-000000000002",
      categoryId: SEED_CATEGORY_TUB,
      title: "Irish Potatoes — Kinigi Variety",
      produceName: "Irish Potatoes",
      variety: "Kinigi",
      totalQuantity: 10000,
      availableQuantity: 10000,
      minimumOrderQty: 100,
      unitPrice: 380,
      harvestDate: "2026-08-28",
      farmLocation: "Musanze, Northern Province",
      deliveryOptions: `'{SELF_PICKUP,DELIVERED}'::"DeliveryOption"[]`,
      deliveryRadiusKm: 60,
      isOrganic: false,
      status: "ACTIVE",
      imageUrls: `'{"/images/assets/products/irish-potatoes.jpg"}'`,
    },
    {
      id: "00000000-0000-0000-0001-000000000003",
      categoryId: SEED_CATEGORY_VEG,
      title: "Cabbage — Gloria F1",
      produceName: "Cabbage",
      variety: "Gloria F1",
      totalQuantity: 5000,
      availableQuantity: 5000,
      minimumOrderQty: 50,
      unitPrice: 250,
      harvestDate: "2026-09-02",
      farmLocation: "Nyabihu, Western Province",
      deliveryOptions: `'{SELF_PICKUP,DELIVERED}'::"DeliveryOption"[]`,
      deliveryRadiusKm: 70,
      isOrganic: false,
      status: "ACTIVE",
      imageUrls: `'{"/images/assets/products/cabbage.jpg"}'`,
    },
    {
      id: "00000000-0000-0000-0001-000000000004",
      categoryId: SEED_CATEGORY_VEG,
      title: "Organic Peppers — California Wonder",
      produceName: "Peppers",
      variety: "California Wonder",
      totalQuantity: 800,
      availableQuantity: 800,
      minimumOrderQty: 20,
      unitPrice: 1200,
      harvestDate: "2026-09-04",
      farmLocation: "Rubavu, Western Province",
      deliveryOptions: `'{SELF_PICKUP,DELIVERED}'::"DeliveryOption"[]`,
      deliveryRadiusKm: null,
      isOrganic: true,
      status: "ACTIVE",
      imageUrls: `'{"/images/assets/products/peppers.jpg"}'`,
    },
    {
      id: "00000000-0000-0000-0001-000000000005",
      categoryId: SEED_CATEGORY_FRU,
      title: "Green Bananas — Bulk",
      produceName: "Green Bananas",
      variety: null,
      totalQuantity: 2000,
      availableQuantity: 2000,
      minimumOrderQty: 100,
      unitPrice: 350,
      harvestDate: "2026-09-01",
      farmLocation: "Kayonza, Eastern Province",
      deliveryOptions: `'{DELIVERED}'::"DeliveryOption"[]`,
      deliveryRadiusKm: 150,
      isOrganic: false,
      status: "ACTIVE",
      imageUrls: `'{"/images/assets/products/green-bananas.jpg"}'`,
    },
    {
      id: "00000000-0000-0000-0001-000000000006",
      categoryId: SEED_CATEGORY_VEG,
      title: "Organic African Eggplant",
      produceName: "African Eggplant",
      variety: null,
      totalQuantity: 300,
      availableQuantity: 300,
      minimumOrderQty: 10,
      unitPrice: 900,
      harvestDate: "2026-09-05",
      farmLocation: "Bugesera, Eastern Province",
      deliveryOptions: `'{SELF_PICKUP}'::"DeliveryOption"[]`,
      deliveryRadiusKm: null,
      isOrganic: true,
      status: "ACTIVE",
      imageUrls: `'{"/images/assets/products/eggplant.jpg"}'`,
    },
  ];

  for (const l of listings) {
    const drKm = l.deliveryRadiusKm !== null ? `${l.deliveryRadiusKm}` : "NULL";
    const variety = l.variety !== null ? `'${l.variety}'` : "NULL";

    await prisma.$executeRawUnsafe(`
      INSERT INTO "ProduceListing" (
        id, "sellerId", "categoryId", title, "produceName", variety,
        "totalQuantity", "availableQuantity", "minimumOrderQty",
        "unitPrice", currency, "harvestDate",
        "farmLocation", "deliveryOptions", "deliveryRadiusKm",
        "isOrganic", status, "imageUrls",
        "createdAt", "updatedAt"
      )
      VALUES (
        '${l.id}',
        '${SEED_SELLER_ID}',
        '${l.categoryId}',
        '${l.title}',
        '${l.produceName}',
        ${variety},
        ${l.totalQuantity}, ${l.availableQuantity}, ${l.minimumOrderQty},
        ${l.unitPrice}, 'RWF',
        '${l.harvestDate}'::timestamp,
        '${l.farmLocation}',
        ${l.deliveryOptions},
        ${drKm},
        ${l.isOrganic},
        '${l.status}'::"ListingStatus",
        ${l.imageUrls},
        NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        "availableQuantity" = EXCLUDED."availableQuantity",
        status              = EXCLUDED.status,
        "updatedAt"         = NOW()
    `);
    console.log(`  ✅ ${l.produceName} (${l.id})`);
  }

  console.log("🎉 Seed complete!");
}

seed()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
