import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  FuelType,
  Transmission,
  UserRole,
} from '../src/generated/prisma/client';
import { slugify } from '../src/common/utils/slug.util';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PASSWORD_HASH_ROUNDS = 10;

// Matches the categories named in the product spec, in display order.
// Trimmed to 5 (2026-08-30, PO request) — Auto-rickshaws/Pickups/Trucks/Other
// Vehicles removed; the two sample listings that used to sit under
// Pickups/Trucks below now use Commercial Vehicles instead.
const CATEGORIES = [
  'Cars',
  'Bikes',
  'Scooters',
  'Tractors',
  'Commercial Vehicles',
];

// Major Chhattisgarh districts with approximate headquarters coordinates,
// used for nearest-district detection. The newest districts created in the
// 2022 reorganization (small subdivisions of these) are intentionally
// omitted for now — adding them later is just more rows, no schema change.
const DISTRICTS: Array<{
  district: string;
  latitude: number;
  longitude: number;
}> = [
  { district: 'Raipur', latitude: 21.2514, longitude: 81.6296 },
  { district: 'Durg', latitude: 21.1904, longitude: 81.2849 },
  { district: 'Bilaspur', latitude: 22.0797, longitude: 82.1391 },
  { district: 'Korba', latitude: 22.3595, longitude: 82.7501 },
  { district: 'Raigarh', latitude: 21.8974, longitude: 83.395 },
  { district: 'Jagdalpur', latitude: 19.0748, longitude: 82.0198 },
  { district: 'Ambikapur', latitude: 23.1198, longitude: 83.1958 },
  { district: 'Rajnandgaon', latitude: 21.0974, longitude: 81.0388 },
  { district: 'Dhamtari', latitude: 20.7072, longitude: 81.5497 },
  { district: 'Mahasamund', latitude: 21.1094, longitude: 82.0985 },
  { district: 'Kanker', latitude: 20.2705, longitude: 81.4924 },
  { district: 'Kondagaon', latitude: 19.594, longitude: 81.664 },
  { district: 'Narayanpur', latitude: 19.718, longitude: 81.247 },
  { district: 'Bijapur', latitude: 18.8386, longitude: 80.7476 },
  { district: 'Dantewada', latitude: 18.8938, longitude: 81.3509 },
  { district: 'Sukma', latitude: 18.3901, longitude: 81.6626 },
  { district: 'Balod', latitude: 20.7314, longitude: 81.2016 },
  { district: 'Bemetara', latitude: 21.7163, longitude: 81.5346 },
  { district: 'Baloda Bazar', latitude: 21.6588, longitude: 82.159 },
  { district: 'Gariaband', latitude: 20.6367, longitude: 82.0619 },
  { district: 'Mungeli', latitude: 22.0658, longitude: 81.687 },
  { district: 'Janjgir-Champa', latitude: 22.0091, longitude: 82.5798 },
  { district: 'Koriya', latitude: 23.25, longitude: 82.5667 },
  { district: 'Surajpur', latitude: 23.2202, longitude: 82.8672 },
  { district: 'Balrampur', latitude: 23.6103, longitude: 83.6031 },
  { district: 'Jashpur', latitude: 22.8886, longitude: 84.14 },
  { district: 'Kabirdham', latitude: 22.0089, longitude: 81.234 },
];

interface SeedVehicle {
  categoryName: string;
  districtName: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  kmDriven: number;
  fuelType: FuelType;
  transmission: Transmission;
  sellerPhone: string;
  sellerName: string;
  status: 'live' | 'submitted';
  /** Real-world-realistic technical specs for this exact model (2026-09-03)
   *  — see apps/web's features/vehicles/spec-fields.ts for which of these
   *  a given category actually displays. Optional: not every seed vehicle
   *  needs every field. */
  specs?: Record<string, number | string>;
}

const SAMPLE_VEHICLES: SeedVehicle[] = [
  {
    categoryName: 'Commercial Vehicles',
    districtName: 'Rajnandgaon',
    title: 'Mahindra Bolero B4',
    brand: 'Mahindra',
    model: 'Bolero B4',
    year: 2022,
    price: 785000,
    kmDriven: 62000,
    fuelType: FuelType.diesel,
    transmission: Transmission.manual,
    sellerPhone: '+919111100001',
    sellerName: 'Sanjay Verma',
    status: 'live',
    specs: {
      engineCc: 2523,
      powerBhp: 75,
      seatingCapacity: 7,
      numberOfGears: '5-speed',
    },
  },
  {
    categoryName: 'Cars',
    districtName: 'Raipur',
    title: 'Maruti Suzuki Swift VXI',
    brand: 'Maruti Suzuki',
    model: 'Swift VXI',
    year: 2020,
    price: 545000,
    kmDriven: 41000,
    fuelType: FuelType.petrol,
    transmission: Transmission.manual,
    sellerPhone: '+919111100002',
    sellerName: 'Priya Sahu',
    status: 'live',
    specs: {
      powerBhp: 88,
      mileageKmpl: 21.2,
      engineCc: 1197,
      seatingCapacity: 5,
      groundClearanceMm: 163,
      fuelTankCapacityL: 37,
    },
  },
  {
    categoryName: 'Bikes',
    districtName: 'Durg',
    title: 'Royal Enfield Classic 350',
    brand: 'Royal Enfield',
    model: 'Classic 350',
    year: 2021,
    price: 148000,
    kmDriven: 18000,
    fuelType: FuelType.petrol,
    transmission: Transmission.manual,
    sellerPhone: '+919111100003',
    sellerName: 'Ankit Yadav',
    status: 'live',
    specs: {
      mileageKmpl: 36.5,
      powerBhp: 20.2,
      engineCc: 349,
      fuelTankCapacityL: 13,
    },
  },
  {
    categoryName: 'Scooters',
    districtName: 'Bilaspur',
    title: 'Honda Activa 6G',
    brand: 'Honda',
    model: 'Activa 6G',
    year: 2022,
    price: 68000,
    kmDriven: 9500,
    fuelType: FuelType.petrol,
    transmission: Transmission.automatic,
    sellerPhone: '+919111100004',
    sellerName: 'Kavita Devi',
    status: 'live',
    specs: {
      engineCc: 109,
      powerBhp: 7.8,
      mileageKmpl: 50,
      fuelTankCapacityL: 5.3,
    },
  },
  {
    categoryName: 'Tractors',
    districtName: 'Mahasamund',
    title: 'Mahindra 575 DI',
    brand: 'Mahindra',
    model: '575 DI',
    year: 2019,
    price: 495000,
    kmDriven: 3200,
    fuelType: FuelType.diesel,
    transmission: Transmission.manual,
    sellerPhone: '+919111100005',
    sellerName: 'Ramesh Patel',
    status: 'live',
    specs: {
      powerBhp: 47,
      liftingCapacityKg: 1600,
      ptoHp: 40,
      numberOfCylinders: 3,
      numberOfGears: '8F + 2R',
      fuelTankCapacityL: 60,
    },
  },
  {
    categoryName: 'Commercial Vehicles',
    districtName: 'Korba',
    title: 'Tata 407 Gold',
    brand: 'Tata',
    model: '407 Gold',
    year: 2018,
    price: 725000,
    kmDriven: 98000,
    fuelType: FuelType.diesel,
    transmission: Transmission.manual,
    sellerPhone: '+919111100006',
    sellerName: 'Dinesh Kumar',
    status: 'live',
    specs: {
      loadCapacityKg: 2500,
      powerBhp: 100,
      engineCc: 2956,
      seatingCapacity: 3,
      numberOfGears: '5-speed',
    },
  },
  {
    categoryName: 'Cars',
    districtName: 'Bilaspur',
    title: 'Hyundai i20 Sportz',
    brand: 'Hyundai',
    model: 'i20 Sportz',
    year: 2021,
    price: 690000,
    kmDriven: 25000,
    fuelType: FuelType.petrol,
    transmission: Transmission.manual,
    sellerPhone: '+919111100007',
    sellerName: 'Neha Agarwal',
    status: 'submitted', // still under review — should not appear in public browse
    specs: {
      powerBhp: 83,
      mileageKmpl: 20.35,
      engineCc: 1197,
      seatingCapacity: 5,
      groundClearanceMm: 170,
      fuelTankCapacityL: 37,
    },
  },
];

async function seedAdmin(): Promise<{ id: string }> {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set to seed the dev admin account',
    );
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
  return prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: UserRole.admin },
    create: {
      email,
      passwordHash,
      role: UserRole.admin,
      name: 'Dev Admin',
      phone: '+910000000000',
    },
  });
}

// Dev agent accounts (Phase 3) — same password as the admin for local
// convenience only; never reuse this pattern outside a throwaway dev seed.
const SAMPLE_AGENTS = [
  {
    email: 'agent1@cgautomarket.local',
    name: 'Agent Ramesh',
    phone: '+910000000001',
  },
  {
    email: 'agent2@cgautomarket.local',
    name: 'Agent Sunita',
    phone: '+910000000002',
  },
];

async function seedAgents(): Promise<void> {
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) return;
  const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);

  await Promise.all(
    SAMPLE_AGENTS.map((agent) =>
      prisma.user.upsert({
        where: { email: agent.email },
        update: { passwordHash, role: UserRole.agent },
        create: { ...agent, passwordHash, role: UserRole.agent },
      }),
    ),
  );
}

async function main(): Promise<void> {
  const admin = await seedAdmin();
  await seedAgents();

  const categories = await Promise.all(
    CATEGORIES.map((name, index) =>
      prisma.category.upsert({
        where: { slug: slugify(name) },
        update: {},
        create: { name, slug: slugify(name), sortOrder: index },
      }),
    ),
  );
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  const locations = await Promise.all(
    DISTRICTS.map((d) =>
      prisma.location.upsert({
        where: { slug: slugify(d.district) },
        update: {},
        create: { ...d, slug: slugify(d.district) },
      }),
    ),
  );
  const locationBySlug = new Map(locations.map((l) => [l.slug, l]));

  for (const sample of SAMPLE_VEHICLES) {
    const category = categoryBySlug.get(slugify(sample.categoryName));
    const location = locationBySlug.get(slugify(sample.districtName));
    if (!category || !location) {
      throw new Error(
        `Seed data references an unknown category/district: ${sample.title}`,
      );
    }

    const seller = await prisma.user.upsert({
      where: { phone: sample.sellerPhone },
      update: {},
      create: { phone: sample.sellerPhone, name: sample.sellerName },
    });

    const existing = await prisma.vehicle.findFirst({
      where: { slug: slugify(sample.title) },
    });
    if (existing) {
      continue;
    }

    let publicId: number | undefined;
    if (sample.status === 'live') {
      const rows = await prisma.$queryRaw<Array<{ nextval: bigint }>>`
        SELECT nextval('vehicle_public_id_seq')
      `;
      publicId = Number(rows[0].nextval);
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        slug: slugify(sample.title),
        publicId,
        title: sample.title,
        brand: sample.brand,
        model: sample.model,
        year: sample.year,
        price: sample.price,
        kmDriven: sample.kmDriven,
        fuelType: sample.fuelType,
        transmission: sample.transmission,
        status: sample.status,
        categoryId: category.id,
        locationId: location.id,
        sellerId: seller.id,
        specs: sample.specs ?? {},
      },
    });

    if (sample.status === 'live') {
      await prisma.vehicleVerification.create({
        data: {
          vehicleId: vehicle.id,
          verifiedBy: admin.id,
          notes: 'Seed data',
        },
      });
    }
  }

  console.log(
    `Seeded 1 admin (${process.env.SEED_ADMIN_EMAIL}), ${SAMPLE_AGENTS.length} agents, ` +
      `${categories.length} categories, ${locations.length} locations, ` +
      `${SAMPLE_VEHICLES.length} vehicles.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
