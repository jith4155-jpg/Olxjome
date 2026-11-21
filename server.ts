import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import {createServer as createViteServer} from 'vite';

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'marketplace.json');

interface UserRecord {
  id: string;
  name: string;
  phone: string;
  accountType: 'home' | 'shop';
  shopName?: string;
  location: string;
  bio?: string;
  avatarUrl?: string;
  avatarSizeKb?: number;
  passwordHash: string;
  createdAt: string;
}

interface DatabaseState {
  listings: any[];
  needs: any[];
  bookings: any[];
  promotions: any[];
  adSlots: any[];
  blockedUsers: any[];
  users?: UserRecord[];
  adminPasscodeHash?: string;
}

const activeAdminTokens = new Map<string, number>();
const activeUserTokens = new Map<string, {userId: string; expiresAt: number}>();
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashSecret(secret: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(secret, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifySecret(secret: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  const actual = crypto.scryptSync(secret, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

function timingSafeTextEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function sanitizeUser(user: UserRecord) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    accountType: user.accountType,
    shopName: user.shopName,
    location: user.location,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    avatarSizeKb: user.avatarSizeKb,
    createdAt: user.createdAt,
  };
}

function sanitizeActionUrl(rawUrl: unknown): string {
  const val = String(rawUrl || '').trim();
  if (!val) return '#';
  if (val.startsWith('#') || val.startsWith('tel:')) return val;
  try {
    const parsed = new URL(val);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    return '#';
  }
  return '#';
}

function createInitialSeed(): DatabaseState {
  const now = Date.now();
  const iso = (minsAgo: number) => new Date(now - minsAgo * 60_000).toISOString();

  return {
    listings: [
      {
        id: 'lst-101',
        listingType: 'rent',
        ownerType: 'home',
        title: 'AquaClean 1700 PSI Electric Pressure Washer',
        category: 'Tools & Hardware',
        price: 350,
        condition: 'Like New',
        pickupLocation: 'Edappally, Kochi',
        usageAreaNotes: 'Ernakulam district use only. Pickup with valid ID.',
        availability: 'Available Today',
        description: 'Compact high-pressure washer with 8m hose and foam nozzle for driveway and car cleaning.',
        photoUrl: '/src/assets/images/item_pressure_washer_1795287444257.jpg',
        ownerName: 'Suresh Menon',
        ownerPhone: '9847011223',
        status: 'approved',
        isPromoted: true,
        promotionPlan: '7-Day Featured Top',
        createdAt: iso(420),
      },
      {
        id: 'lst-102',
        listingType: 'rent',
        ownerType: 'home',
        title: 'Nikon DSLR Camera + 50mm f/1.8 Lens & Bag',
        category: 'Cameras & Audio',
        price: 600,
        condition: 'Well Maintained',
        pickupLocation: 'Swaraj Round, Thrissur',
        usageAreaNotes: 'Family events or portrait shoots within 25 km.',
        availability: 'Weekends & Weekdays',
        description: 'Full DSLR kit with extra battery, 64GB SD card, and padded shoulder bag.',
        photoUrl: '/src/assets/images/item_dslr_camera_1795287445953.jpg',
        ownerName: 'Ananya Nair',
        ownerPhone: '9895122334',
        status: 'approved',
        isPromoted: false,
        createdAt: iso(360),
      },
      {
        id: 'lst-103',
        listingType: 'rent',
        ownerType: 'shop',
        title: 'Yamaha 2200W Silent Inverter Generator + 40m Reel',
        category: 'Tools & Hardware',
        price: 950,
        condition: 'Shop Tested',
        pickupLocation: 'M.G. Road, Ernakulam',
        usageAreaNotes: 'Store pickup & return before 7 PM. Fuel extra.',
        availability: 'In Stock (3 Units)',
        description: 'Low-noise inverter backup unit ideal for outdoor events, shops, and home backup.',
        photoUrl: '/src/assets/images/item_shop_generator_1795287447221.jpg',
        ownerName: 'Kochi Power Rentals',
        ownerPhone: '9447033445',
        shopName: 'Kochi Power & Tools Center',
        shopTerms: 'Shop verified: 0% platform commission. Refundable ID check at store counter.',
        status: 'approved',
        isPromoted: true,
        promotionPlan: '15-Day City Spotlight',
        createdAt: iso(300),
      },
      {
        id: 'lst-104',
        listingType: 'rent',
        ownerType: 'shop',
        title: 'Aluminum 6-Step Heavy Duty Folding Ladder',
        category: 'Tools & Hardware',
        price: 220,
        condition: 'Shop Tested',
        pickupLocation: 'Palarivattom, Kochi',
        usageAreaNotes: 'Pickup from shop bay. Home delivery available within 5 km.',
        availability: 'Available Daily',
        description: 'Anti-slip wide aluminum steps, 150 kg load capacity, fits in hatchback boot.',
        photoUrl: '/src/assets/images/item_folding_ladder_1795287447133.jpg',
        ownerName: 'Metro Hardware Hire',
        ownerPhone: '9846044556',
        shopName: 'Metro Hardware Hire',
        shopTerms: 'Shop verified: 0% platform commission. Late return ₹50/hr.',
        status: 'approved',
        isPromoted: false,
        createdAt: iso(240),
      },
      {
        id: 'lst-105',
        listingType: 'rent',
        ownerType: 'home',
        title: 'Smart HD Portable Projector + Tripod Stand',
        category: 'Events & Party',
        price: 450,
        condition: 'Like New',
        pickupLocation: 'Kowdiar, Trivandrum',
        usageAreaNotes: 'Indoor home movie nights or small presentations.',
        availability: 'Evenings & Weekends',
        description: '1080p wireless projector with HDMI cable and compact tripod stand.',
        photoUrl: '/src/assets/images/item_projector_rent_1795287446014.jpg',
        ownerName: 'Rahul Krishnan',
        ownerPhone: '9745055667',
        status: 'approved',
        isPromoted: false,
        createdAt: iso(180),
      },
      {
        id: 'lst-201',
        listingType: 'sale',
        ownerType: 'home',
        title: 'MacBook Air 13-inch Silver (8GB / 256GB SSD)',
        category: 'Electronics',
        price: 34500,
        condition: 'Good · 88% Battery',
        pickupLocation: 'Kakkanad, Kochi',
        usageAreaNotes: 'Meet at Infopark Phase 1 gate or buyer inspects at home.',
        availability: 'Ready for Pickup',
        description: 'Clean silver laptop with original MagSafe charger, zero display scratches.',
        photoUrl: '/src/assets/images/item_laptop_sale_1795287447890.jpg',
        ownerName: 'Deepak Varma',
        ownerPhone: '9847066778',
        status: 'approved',
        isPromoted: true,
        promotionPlan: '7-Day Featured Top',
        createdAt: iso(150),
      },
      {
        id: 'lst-202',
        listingType: 'sale',
        ownerType: 'home',
        title: 'Solid Wood 3-Drawer Study Desk + Mesh Chair',
        category: 'Furniture',
        price: 9800,
        condition: 'Excellent',
        pickupLocation: 'Vyttila, Kochi',
        usageAreaNotes: 'Buyer arranges tempo/pickup from ground floor.',
        availability: 'Available Immediately',
        description: 'Sturdy natural wood writing desk paired with ergonomic black mesh swivel chair.',
        photoUrl: '/src/assets/images/item_wood_desk_sale_1795287447737.jpg',
        ownerName: 'Meera Thomas',
        ownerPhone: '9446077889',
        status: 'approved',
        isPromoted: false,
        createdAt: iso(110),
      },
      {
        id: 'lst-203',
        listingType: 'sale',
        ownerType: 'home',
        title: 'Trailhead 21-Speed Alloy Hybrid Bicycle',
        category: 'Vehicles & Cycles',
        price: 11200,
        condition: 'Used · Serviced',
        pickupLocation: 'Nadakkavu, Kozhikode',
        usageAreaNotes: 'Test ride available before payment.',
        availability: 'Available',
        description: 'Matte slate frame with disc brakes, rear carrier rack, and bottle cage.',
        photoUrl: '/src/assets/images/item_bicycle_sale_1795287448959.jpg',
        ownerName: 'Arjun Raj',
        ownerPhone: '9895088990',
        status: 'approved',
        isPromoted: false,
        createdAt: iso(70),
      },
      {
        id: 'lst-204',
        listingType: 'rent',
        ownerType: 'home',
        title: 'Bosch Cordless Hammer Drill Kit (Pending Review Demo)',
        category: 'Tools & Hardware',
        price: 300,
        condition: 'Good',
        pickupLocation: 'Aluva, Kochi',
        usageAreaNotes: 'Aluva & Kalamassery area.',
        availability: 'Weekdays',
        description: '18V cordless drill with masonry bits and carrying case.',
        photoUrl: '/src/assets/images/item_pressure_washer_1795287444257.jpg',
        ownerName: 'Nikhil Jose',
        ownerPhone: '9947099112',
        status: 'pending',
        isPromoted: false,
        createdAt: iso(25),
      },
    ],
    needs: [
      {
        id: 'need-301',
        title: 'Need Folding Chairs (12 Nos) & Portable Speaker for Home Function',
        needType: 'rent',
        category: 'Events & Party',
        location: 'Tripunithura, Kochi',
        durationOrTimeline: 'This Sunday · 1 Day',
        budget: 1200,
        notes: 'Need clean chairs and Bluetooth speaker for a small family lunch.',
        requesterName: 'Lakshmi Pillai',
        requesterPhone: '9447112233',
        status: 'approved',
        responses: [
          {
            id: 'resp-1',
            responderName: 'Sree Event Rentals (Shop)',
            responderPhone: '9847223344',
            responderType: 'shop',
            offerPrice: 1050,
            location: 'Pettah, Kochi',
            message: '12 cushioned folding chairs + JBL party speaker available for ₹1,050/day.',
            createdAt: iso(45),
          },
        ],
        createdAt: iso(95),
      },
      {
        id: 'need-302',
        title: 'Looking to Buy Used Study Table Under ₹6,000',
        needType: 'buy',
        category: 'Furniture',
        location: 'Kakkanad, Kochi',
        durationOrTimeline: 'Needed this week',
        budget: 6000,
        notes: 'Compact wooden or metal-frame desk for WFH setup. Can pick up nearby.',
        requesterName: 'Faisal Rahman',
        requesterPhone: '9745334455',
        status: 'approved',
        responses: [],
        createdAt: iso(55),
      },
    ],
    bookings: [
      {
        id: 'bk-501',
        listingId: 'lst-101',
        listingTitle: 'AquaClean 1700 PSI Electric Pressure Washer',
        listingType: 'rent',
        ownerType: 'home',
        orderKind: 'rental_booking',
        customerName: 'Vineeth Kumar',
        customerPhone: '9846556677',
        pickupLocation: 'Edappally, Kochi',
        usageOrDropLocation: 'Vennala, Kochi (Home Courtyard)',
        days: 2,
        baseAmount: 700,
        commissionAmount: 70,
        totalPayable: 770,
        upiRef: 'UTR4290184451',
        screenshotDataUrl: '/src/assets/images/item_pressure_washer_1795287444257.jpg',
        screenshotSizeKb: 22.4,
        paymentStatus: 'Verified',
        fulfillmentStatus: 'Completed',
        termsAccepted: true,
        createdAt: iso(500),
      },
      {
        id: 'bk-502',
        listingId: 'lst-102',
        listingTitle: 'Nikon DSLR Camera + 50mm f/1.8 Lens & Bag',
        listingType: 'rent',
        ownerType: 'home',
        orderKind: 'rental_booking',
        customerName: 'Athulya Mohan',
        customerPhone: '9895667788',
        pickupLocation: 'Swaraj Round, Thrissur',
        usageOrDropLocation: 'Punkunnam, Thrissur',
        days: 1,
        baseAmount: 600,
        commissionAmount: 60,
        totalPayable: 660,
        upiRef: 'UTR9901823110',
        screenshotDataUrl: '/src/assets/images/item_dslr_camera_1795287445953.jpg',
        screenshotSizeKb: 18.6,
        paymentStatus: 'Pending Verification',
        fulfillmentStatus: 'Awaiting Verification',
        termsAccepted: true,
        createdAt: iso(18),
      },
    ],
    promotions: [
      {
        id: 'prm-701',
        listingId: 'lst-101',
        listingTitle: 'AquaClean 1700 PSI Electric Pressure Washer',
        ownerName: 'Suresh Menon',
        ownerPhone: '9847011223',
        planLabel: '7-Day Featured Top',
        feeAmount: 99,
        upiRef: 'UTR7712349012',
        screenshotDataUrl: '/src/assets/images/item_pressure_washer_1795287444257.jpg',
        screenshotSizeKb: 21.1,
        status: 'Approved',
        termsAccepted: true,
        createdAt: iso(400),
      },
      {
        id: 'prm-702',
        listingId: 'lst-103',
        listingTitle: 'Yamaha 2200W Silent Inverter Generator + 40m Reel',
        ownerName: 'Kochi Power Rentals',
        ownerPhone: '9447033445',
        planLabel: '15-Day City Spotlight',
        feeAmount: 179,
        upiRef: 'UTR8812349022',
        screenshotDataUrl: '/src/assets/images/item_shop_generator_1795287447221.jpg',
        screenshotSizeKb: 24.3,
        status: 'Approved',
        termsAccepted: true,
        createdAt: iso(290),
      },
      {
        id: 'prm-703',
        listingId: 'lst-202',
        listingTitle: 'Solid Wood 3-Drawer Study Desk + Mesh Chair',
        ownerName: 'Meera Thomas',
        ownerPhone: '9446077889',
        planLabel: '7-Day Featured Top',
        feeAmount: 99,
        upiRef: 'UTR5512349900',
        screenshotDataUrl: '/src/assets/images/item_wood_desk_sale_1795287447737.jpg',
        screenshotSizeKb: 19.8,
        status: 'Pending Verification',
        termsAccepted: true,
        createdAt: iso(12),
      },
    ],
    adSlots: [
      {
        id: 'ad-1',
        placement: 'top_strip',
        sponsorName: 'Malabar Mini Tempo & Shifting',
        headline: 'Local pickup & drop for furniture, generators, and event gear starting at ₹299',
        ctaLabel: 'Call +91 98470 00112',
        targetUrl: 'tel:+919847000112',
        locationTag: 'Kochi & Thrissur',
        active: true,
      },
      {
        id: 'ad-2',
        placement: 'grid_native',
        sponsorName: 'SafeHand Tool Service Hub',
        headline: 'Authorized repair & servicing for pressure washers, drills, and portable inverters.',
        ctaLabel: 'Book Service',
        targetUrl: '#service-partner',
        locationTag: 'Ernakulam',
        active: true,
      },
    ],
    blockedUsers: [],
    users: [],
  };
}

function loadDb(): DatabaseState {
  fs.mkdirSync(DATA_DIR, {recursive: true});
  if (!fs.existsSync(DATA_FILE)) {
    const initial = createInitialSeed();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseState;
    if (!Array.isArray(parsed.users)) parsed.users = [];
    return parsed;
  } catch {
    const fallback = createInitialSeed();
    fs.writeFileSync(DATA_FILE, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
}

function saveDb(state: DatabaseState): void {
  fs.mkdirSync(DATA_DIR, {recursive: true});
  const tmpFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DATA_FILE);
}

let db = loadDb();

function normalizePhone(phone: unknown): string {
  return String(phone ?? '').replace(/\D/g, '').slice(-10);
}

function isPhoneBlocked(phone: string): boolean {
  const norm = normalizePhone(phone);
  if (!norm) return false;
  return db.blockedUsers.some((b) => normalizePhone(b.phone) === norm);
}

function sanitizeImageData(data: unknown, required = false): string {
  const value = String(data ?? '').trim();
  if (!value) {
    if (required) {
      throw new Error('Image upload is required.');
    }
    return '';
  }
  if (value.startsWith('/src/assets/images/')) {
    return value;
  }
  if (!value.startsWith('data:image/')) {
    throw new Error('Invalid image format.');
  }
  if (value.length > 140_000) {
    throw new Error('Image exceeds compressed size limit. Please upload via the compressor.');
  }
  return value;
}

function getAuthenticatedUser(req: express.Request): UserRecord | null {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return null;
  const session = activeUserTokens.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    activeUserTokens.delete(token);
    return null;
  }
  const user = (db.users || []).find((u) => u.id === session.userId);
  if (!user || isPhoneBlocked(user.phone)) return null;
  return user;
}

function requireUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({error: 'Please log in to continue.'});
    return;
  }
  (req as any).user = user;
  next();
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const expiresAt = token ? activeAdminTokens.get(token) : undefined;
  if (!expiresAt || expiresAt < Date.now()) {
    if (token) activeAdminTokens.delete(token);
    res.status(401).json({error: 'Admin authorization required.'});
    return;
  }
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({limit: '1mb'}));

  // User Authentication APIs
  app.post('/api/auth/register', (req, res) => {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    const phone = normalizePhone(body.phone);
    const password = String(body.password || '');
    const location = String(body.location || '').trim();
    const accountType: 'home' | 'shop' = body.accountType === 'shop' ? 'shop' : 'home';
    const shopName = accountType === 'shop' ? String(body.shopName || '').trim() : undefined;

    if (!name || name.length < 2) {
      res.status(400).json({error: 'Please enter your full name.'});
      return;
    }
    if (!phone || phone.length !== 10) {
      res.status(400).json({error: 'Valid 10-digit mobile number is required.'});
      return;
    }
    if (isPhoneBlocked(phone)) {
      res.status(403).json({error: 'This phone number has been blocked by marketplace moderation.'});
      return;
    }
    if (!location) {
      res.status(400).json({error: 'City / locality is required.'});
      return;
    }
    if (password.length < 6) {
      res.status(400).json({error: 'Password must be at least 6 characters.'});
      return;
    }

    const users = db.users || [];
    if (users.some((u) => u.phone === phone)) {
      res.status(409).json({error: 'An account with this phone number already exists. Please log in.'});
      return;
    }

    const newUser: UserRecord = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      name,
      phone,
      accountType,
      shopName: shopName || undefined,
      location,
      passwordHash: hashSecret(password),
      createdAt: new Date().toISOString(),
    };

    db.users = [newUser, ...users];
    saveDb(db);

    const token = crypto.randomBytes(24).toString('hex');
    activeUserTokens.set(token, {userId: newUser.id, expiresAt: Date.now() + SESSION_TTL_MS});

    res.status(201).json({token, user: sanitizeUser(newUser)});
  });

  app.post('/api/auth/login', (req, res) => {
    const body = req.body || {};
    const phone = normalizePhone(body.phone);
    const password = String(body.password || '');

    if (!phone || phone.length !== 10 || !password) {
      res.status(400).json({error: 'Enter your 10-digit mobile number and password.'});
      return;
    }
    if (isPhoneBlocked(phone)) {
      res.status(403).json({error: 'This phone number has been blocked by marketplace moderation.'});
      return;
    }

    const user = (db.users || []).find((u) => u.phone === phone);
    if (!user || !verifySecret(password, user.passwordHash)) {
      res.status(401).json({error: 'Invalid mobile number or password.'});
      return;
    }

    const token = crypto.randomBytes(24).toString('hex');
    activeUserTokens.set(token, {userId: user.id, expiresAt: Date.now() + SESSION_TTL_MS});

    res.json({token, user: sanitizeUser(user)});
  });

  app.post('/api/auth/logout', (req, res) => {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (token) activeUserTokens.delete(token);
    res.json({ok: true});
  });

  app.get('/api/auth/me', requireUser, (req, res) => {
    const user = (req as any).user as UserRecord;
    res.json({user: sanitizeUser(user)});
  });

  app.patch('/api/auth/profile', requireUser, (req, res) => {
    try {
      const user = (req as any).user as UserRecord;
      const body = req.body || {};

      if (typeof body.name === 'string') {
        const cleanName = body.name.trim();
        if (cleanName.length < 2) {
          res.status(400).json({error: 'Name must be at least 2 characters.'});
          return;
        }
        user.name = cleanName;
      }

      if (typeof body.location === 'string') {
        const cleanLoc = body.location.trim();
        if (!cleanLoc) {
          res.status(400).json({error: 'Location cannot be empty.'});
          return;
        }
        user.location = cleanLoc;
      }

      if (body.accountType === 'home' || body.accountType === 'shop') {
        user.accountType = body.accountType;
      }

      if (typeof body.shopName === 'string') {
        user.shopName = user.accountType === 'shop' ? body.shopName.trim() || undefined : undefined;
      }

      if (typeof body.bio === 'string') {
        user.bio = body.bio.trim().slice(0, 240) || undefined;
      }

      if (body.avatarUrl !== undefined) {
        if (body.avatarUrl === '' || body.avatarUrl === null) {
          user.avatarUrl = undefined;
          user.avatarSizeKb = undefined;
        } else {
          user.avatarUrl = sanitizeImageData(body.avatarUrl, false);
          user.avatarSizeKb = Number(body.avatarSizeKb) || undefined;
        }
      }

      saveDb(db);
      res.json({user: sanitizeUser(user)});
    } catch (err: any) {
      res.status(400).json({error: err?.message || 'Unable to update profile.'});
    }
  });

  app.get('/api/my-activity', requireUser, (req, res) => {
    const user = (req as any).user as UserRecord;
    const listings = db.listings.filter(
      (l) =>
        l.status !== 'removed' &&
        (l.ownerUserId ? l.ownerUserId === user.id : l.ownerPhone === user.phone)
    );
    const ownedListingIds = new Set(listings.map((l) => l.id));
    const needs = db.needs.filter(
      (n) =>
        n.status !== 'removed' &&
        (n.requesterUserId ? n.requesterUserId === user.id : n.requesterPhone === user.phone)
    );
    const bookings = db.bookings.filter((b) =>
      b.customerUserId ? b.customerUserId === user.id : b.customerPhone === user.phone
    );
    const receivedBookings = db.bookings.filter((b) => ownedListingIds.has(b.listingId));
    const promotions = db.promotions.filter((p) =>
      p.ownerUserId ? p.ownerUserId === user.id : p.ownerPhone === user.phone
    );
    res.json({listings, needs, bookings, receivedBookings, promotions});
  });

  app.delete('/api/my-listings/:id', requireUser, (req, res) => {
    const user = (req as any).user as UserRecord;
    const listing = db.listings.find((l) => l.id === req.params.id && l.status !== 'removed');
    if (!listing) {
      res.status(404).json({error: 'Listing not found.'});
      return;
    }
    if (listing.ownerUserId !== user.id && listing.ownerPhone !== user.phone) {
      res.status(403).json({error: 'You can only remove your own listings.'});
      return;
    }
    listing.status = 'removed';
    saveDb(db);
    res.json({ok: true});
  });

  // Public Marketplace APIs
  app.get('/api/marketplace', (req, res) => {
    const authUser = getAuthenticatedUser(req);

    const publicListings = db.listings
      .filter(
        (l) =>
          l.status === 'approved' ||
          (authUser && l.status === 'pending' && l.ownerUserId === authUser.id)
      )
      .sort((a, b) => {
        if (a.isPromoted !== b.isPromoted) return a.isPromoted ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    const publicNeeds = db.needs
      .filter(
        (n) =>
          n.status === 'approved' ||
          (authUser && n.status === 'pending' && n.requesterUserId === authUser.id)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const activeAds = db.adSlots
      .filter((a) => a.active)
      .map((a) => ({...a, targetUrl: sanitizeActionUrl(a.targetUrl)}));
    res.json({listings: publicListings, needs: publicNeeds, adSlots: activeAds});
  });

  app.post('/api/listings', (req, res) => {
    try {
      const authUser = getAuthenticatedUser(req);
      const body = req.body || {};
      const phone = normalizePhone(body.ownerPhone || authUser?.phone);
      if (!phone || phone.length < 10) {
        res.status(400).json({error: 'Valid 10-digit contact phone number is required.'});
        return;
      }
      if (isPhoneBlocked(phone)) {
        res.status(403).json({error: 'This phone number has been blocked by marketplace moderation.'});
        return;
      }
      if (!body.termsAccepted) {
        res.status(400).json({error: 'You must accept the Terms & Conditions before submitting.'});
        return;
      }
      const title = String(body.title || '').trim();
      const pickupLocation = String(body.pickupLocation || '').trim();
      const ownerName = String(body.ownerName || authUser?.name || '').trim();
      const price = Number(body.price);
      if (!title || !pickupLocation || !ownerName || !Number.isFinite(price) || price <= 0) {
        res.status(400).json({error: 'Title, valid price, pickup location, and contact name are required.'});
        return;
      }

      const photoUrl = sanitizeImageData(body.photoUrl, true);
      const listingType = body.listingType === 'sale' ? 'sale' : 'rent';
      const ownerType = body.ownerType === 'shop' ? 'shop' : 'home';

      const newListing = {
        id: `lst-${crypto.randomUUID().slice(0, 8)}`,
        listingType,
        ownerType,
        title,
        category: String(body.category || 'Other'),
        price: Math.round(price),
        condition: String(body.condition || 'Good'),
        pickupLocation,
        usageAreaNotes: String(body.usageAreaNotes || 'Inspect at pickup location before handover.'),
        availability: String(body.availability || 'Available Now'),
        description: String(body.description || '').slice(0, 400),
        photoUrl,
        photoSizeKb: Number(body.photoSizeKb) || undefined,
        ownerUserId: authUser?.id,
        ownerName,
        ownerPhone: phone,
        shopName: ownerType === 'shop' ? String(body.shopName || ownerName) : undefined,
        shopTerms: ownerType === 'shop' ? String(body.shopTerms || 'Shop verified terms apply at pickup.') : undefined,
        status: 'pending',
        isPromoted: false,
        createdAt: new Date().toISOString(),
      };

      db.listings.unshift(newListing);
      saveDb(db);
      res.status(201).json({listing: newListing, message: 'Submitted for quick Admin approval.'});
    } catch (err: any) {
      res.status(400).json({error: err?.message || 'Unable to submit listing.'});
    }
  });

  app.post('/api/needs', (req, res) => {
    try {
      const authUser = getAuthenticatedUser(req);
      const body = req.body || {};
      const phone = normalizePhone(body.requesterPhone || authUser?.phone);
      if (!phone || phone.length < 10) {
        res.status(400).json({error: 'Valid 10-digit phone number is required.'});
        return;
      }
      if (isPhoneBlocked(phone)) {
        res.status(403).json({error: 'This phone number is blocked from posting requests.'});
        return;
      }
      if (!body.termsAccepted) {
        res.status(400).json({error: 'Please accept Terms & Conditions.'});
        return;
      }
      const title = String(body.title || '').trim();
      const location = String(body.location || '').trim();
      const requesterName = String(body.requesterName || authUser?.name || '').trim();
      const budget = Number(body.budget);
      if (!title || !location || !requesterName || !Number.isFinite(budget) || budget <= 0) {
        res.status(400).json({error: 'Item needed, location, budget, and name are required.'});
        return;
      }

      const photoUrl = body.photoUrl ? sanitizeImageData(body.photoUrl, false) : undefined;
      const newNeed = {
        id: `need-${crypto.randomUUID().slice(0, 8)}`,
        title,
        needType: body.needType === 'buy' ? 'buy' : 'rent',
        category: String(body.category || 'Other'),
        location,
        durationOrTimeline: String(body.durationOrTimeline || 'Flexible'),
        budget: Math.round(budget),
        notes: String(body.notes || '').slice(0, 400),
        photoUrl,
        photoSizeKb: Number(body.photoSizeKb) || undefined,
        requesterUserId: authUser?.id,
        requesterName,
        requesterPhone: phone,
        status: 'pending',
        responses: [],
        createdAt: new Date().toISOString(),
      };

      db.needs.unshift(newNeed);
      saveDb(db);
      res.status(201).json({need: newNeed, message: 'Request submitted for Admin approval.'});
    } catch (err: any) {
      res.status(400).json({error: err?.message || 'Unable to submit request.'});
    }
  });

  app.post('/api/needs/:id/respond', (req, res) => {
    const need = db.needs.find((n) => n.id === req.params.id && n.status === 'approved');
    if (!need) {
      res.status(404).json({error: 'Approved request not found.'});
      return;
    }
    const authUser = getAuthenticatedUser(req);
    const body = req.body || {};
    const phone = normalizePhone(body.responderPhone || authUser?.phone);
    if (!phone || phone.length < 10) {
      res.status(400).json({error: 'Valid 10-digit phone number is required.'});
      return;
    }
    if (isPhoneBlocked(phone)) {
      res.status(403).json({error: 'This phone number is blocked.'});
      return;
    }
    if (!body.termsAccepted) {
      res.status(400).json({error: 'Please accept Terms & Conditions.'});
      return;
    }
    const responderName = String(body.responderName || authUser?.name || '').trim();
    const location = String(body.location || '').trim();
    const message = String(body.message || '').trim();
    const offerPrice = Number(body.offerPrice);
    if (!responderName || !location || !message || !Number.isFinite(offerPrice) || offerPrice <= 0) {
      res.status(400).json({error: 'Name, location, offer price, and message are required.'});
      return;
    }

    const responseObj = {
      id: `resp-${crypto.randomUUID().slice(0, 8)}`,
      responderUserId: authUser?.id,
      responderName,
      responderPhone: phone,
      responderType: body.responderType === 'shop' ? 'shop' : 'home',
      offerPrice: Math.round(offerPrice),
      location,
      message: message.slice(0, 300),
      createdAt: new Date().toISOString(),
    };
    need.responses.push(responseObj);
    saveDb(db);
    res.status(201).json({response: responseObj});
  });

  app.post('/api/bookings', (req, res) => {
    try {
      const authUser = getAuthenticatedUser(req);
      const body = req.body || {};
      const phone = normalizePhone(body.customerPhone || authUser?.phone);
      if (!phone || phone.length < 10) {
        res.status(400).json({error: 'Valid 10-digit phone number is required.'});
        return;
      }
      if (isPhoneBlocked(phone)) {
        res.status(403).json({error: 'This phone number is blocked by marketplace moderation.'});
        return;
      }
      if (!body.termsAccepted) {
        res.status(400).json({error: 'You must accept the Terms & Conditions.'});
        return;
      }

      const listing = db.listings.find((l) => l.id === body.listingId && l.status === 'approved');
      if (!listing) {
        res.status(404).json({error: 'Listing not found or unavailable.'});
        return;
      }

      const customerName = String(body.customerName || authUser?.name || '').trim();
      const usageOrDropLocation = String(body.usageOrDropLocation || '').trim();
      if (!customerName || !usageOrDropLocation) {
        res.status(400).json({error: 'Your name and usage/drop location are required.'});
        return;
      }

      const orderKind =
        listing.listingType === 'rent' ? 'rental_booking' : 'sale_inquiry';

      const days =
        listing.listingType === 'rent'
          ? Math.max(1, Math.round(Number(body.days) || 1))
          : undefined;
      const baseAmount =
        listing.listingType === 'rent'
          ? listing.price * (days || 1)
          : Math.max(1, Math.round(Number(body.offerPrice) || listing.price));

      const commissionAmount = 0;
      const totalPayable = baseAmount;

      const booking = {
        id: `bk-${crypto.randomUUID().slice(0, 8)}`,
        listingId: listing.id,
        listingTitle: listing.title,
        listingType: listing.listingType,
        ownerType: listing.ownerType,
        orderKind,
        customerUserId: authUser?.id,
        customerName,
        customerPhone: phone,
        pickupLocation: listing.pickupLocation,
        usageOrDropLocation,
        days,
        baseAmount,
        commissionAmount,
        totalPayable,
        paymentStatus: 'Direct Contact',
        fulfillmentStatus: 'Confirmed',
        termsAccepted: true,
        createdAt: new Date().toISOString(),
      };

      db.bookings.unshift(booking);
      saveDb(db);
      res.status(201).json({booking});
    } catch (err: any) {
      res.status(400).json({error: err?.message || 'Unable to process booking/order.'});
    }
  });

  app.post('/api/promotions', (req, res) => {
    try {
      const authUser = getAuthenticatedUser(req);
      const body = req.body || {};
      const phone = normalizePhone(body.ownerPhone || authUser?.phone);
      if (!phone || phone.length < 10) {
        res.status(400).json({error: 'Valid 10-digit phone number is required.'});
        return;
      }
      if (isPhoneBlocked(phone)) {
        res.status(403).json({error: 'This phone number is blocked.'});
        return;
      }
      if (!body.termsAccepted) {
        res.status(400).json({error: 'You must accept the Terms & Conditions.'});
        return;
      }
      const listing = db.listings.find((l) => l.id === body.listingId && l.status === 'approved');
      if (!listing) {
        res.status(404).json({error: 'Approved listing not found.'});
        return;
      }

      const planLabel = body.planLabel === '15-Day City Spotlight' ? '15-Day City Spotlight' : '7-Day Featured Top';
      const feeAmount = planLabel === '15-Day City Spotlight' ? 179 : 99;
      const screenshotDataUrl = sanitizeImageData(body.screenshotDataUrl, true);

      const promotion = {
        id: `prm-${crypto.randomUUID().slice(0, 8)}`,
        listingId: listing.id,
        listingTitle: listing.title,
        ownerUserId: authUser?.id,
        ownerName: String(body.ownerName || authUser?.name || listing.ownerName).trim(),
        ownerPhone: phone,
        planLabel,
        feeAmount,
        upiRef: body.upiRef ? String(body.upiRef).trim() : undefined,
        screenshotDataUrl,
        screenshotSizeKb: Number(body.screenshotSizeKb) || 20,
        status: 'Pending Verification',
        termsAccepted: true,
        createdAt: new Date().toISOString(),
      };

      db.promotions.unshift(promotion);
      saveDb(db);
      res.status(201).json({promotion});
    } catch (err: any) {
      res.status(400).json({error: err?.message || 'Unable to submit promotion payment.'});
    }
  });

  // Admin Auth & Moderation APIs
  app.get('/api/admin/status', (_req, res) => {
    const envPasscode = String(process.env.ADMIN_PASSCODE || '').trim();
    const configured = Boolean(envPasscode || db.adminPasscodeHash);
    res.json({configured});
  });

  app.post('/api/admin/setup', (req, res) => {
    const envPasscode = String(process.env.ADMIN_PASSCODE || '').trim();
    if (envPasscode || db.adminPasscodeHash) {
      res.status(409).json({error: 'Admin passcode is already configured.'});
      return;
    }
    const passcode = String(req.body?.passcode || '').trim();
    if (passcode.length < 6) {
      res.status(400).json({error: 'Admin passcode must be at least 6 characters.'});
      return;
    }
    db.adminPasscodeHash = hashSecret(passcode);
    saveDb(db);
    const token = crypto.randomBytes(24).toString('hex');
    activeAdminTokens.set(token, Date.now() + SESSION_TTL_MS);
    res.status(201).json({token});
  });

  app.post('/api/admin/login', (req, res) => {
    const passcode = String(req.body?.passcode || '');
    const envPasscode = String(process.env.ADMIN_PASSCODE || '').trim();

    if (envPasscode) {
      if (!timingSafeTextEqual(passcode, envPasscode)) {
        res.status(401).json({error: 'Invalid admin passcode.'});
        return;
      }
    } else if (db.adminPasscodeHash) {
      if (!verifySecret(passcode, db.adminPasscodeHash)) {
        res.status(401).json({error: 'Invalid admin passcode.'});
        return;
      }
    } else {
      res.status(409).json({error: 'Admin passcode has not been set up yet.'});
      return;
    }

    const token = crypto.randomBytes(24).toString('hex');
    activeAdminTokens.set(token, Date.now() + SESSION_TTL_MS);
    res.json({token});
  });

  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    const activeListings = db.listings.filter((l) => l.status !== 'removed');
    const rentalListings = activeListings.filter((l) => l.listingType === 'rent').length;
    const saleListings = activeListings.filter((l) => l.listingType === 'sale').length;
    const needRequests = db.needs.filter((n) => n.status !== 'removed').length;
    const pendingApprovals =
      db.listings.filter((l) => l.status === 'pending').length +
      db.needs.filter((n) => n.status === 'pending').length;

    const bookingsCount = db.bookings.length;
    const pendingScreenshots =
      db.bookings.filter((b) => b.paymentStatus === 'Pending Verification').length +
      db.promotions.filter((p) => p.status === 'Pending Verification').length;

    const commissionTotal = db.bookings
      .filter((b) => b.paymentStatus === 'Verified')
      .reduce((sum, b) => sum + (Number(b.commissionAmount) || 0), 0);

    const promotionRevenue = db.promotions
      .filter((p) => p.status === 'Approved')
      .reduce((sum, p) => sum + (Number(p.feeAmount) || 0), 0);

    res.json({
      stats: {
        rentalListings,
        saleListings,
        needRequests,
        pendingApprovals,
        bookingsCount,
        pendingScreenshots,
        commissionTotal,
        promotionRevenue,
      },
      listings: db.listings,
      needs: db.needs,
      bookings: db.bookings,
      promotions: db.promotions,
      adSlots: db.adSlots.map((a) => ({...a, targetUrl: sanitizeActionUrl(a.targetUrl)})),
      blockedUsers: db.blockedUsers,
    });
  });

  app.patch('/api/admin/listings/:id', requireAdmin, (req, res) => {
    const listing = db.listings.find((l) => l.id === req.params.id);
    if (!listing) {
      res.status(404).json({error: 'Listing not found.'});
      return;
    }
    const {status, isPromoted} = req.body || {};
    if (status && ['pending', 'approved', 'rejected', 'removed'].includes(status)) {
      listing.status = status;
    }
    if (typeof isPromoted === 'boolean') {
      listing.isPromoted = isPromoted;
      if (isPromoted && !listing.promotionPlan) {
        listing.promotionPlan = 'Admin Featured';
      }
    }
    saveDb(db);
    res.json({listing});
  });

  app.patch('/api/admin/needs/:id', requireAdmin, (req, res) => {
    const need = db.needs.find((n) => n.id === req.params.id);
    if (!need) {
      res.status(404).json({error: 'Request not found.'});
      return;
    }
    const {status} = req.body || {};
    if (status && ['pending', 'approved', 'rejected', 'removed'].includes(status)) {
      need.status = status;
    }
    saveDb(db);
    res.json({need});
  });

  app.patch('/api/admin/bookings/:id', requireAdmin, (req, res) => {
    const booking = db.bookings.find((b) => b.id === req.params.id);
    if (!booking) {
      res.status(404).json({error: 'Booking/order not found.'});
      return;
    }
    const {paymentStatus, fulfillmentStatus} = req.body || {};
    if (paymentStatus && ['Pending Verification', 'Verified', 'Rejected', 'Direct Contact'].includes(paymentStatus)) {
      booking.paymentStatus = paymentStatus;
      if (paymentStatus === 'Verified' && booking.fulfillmentStatus === 'Awaiting Verification') {
        booking.fulfillmentStatus = 'Confirmed';
      }
      if (paymentStatus === 'Rejected') {
        booking.fulfillmentStatus = 'Cancelled';
      }
    }
    if (
      fulfillmentStatus &&
      ['Awaiting Verification', 'Confirmed', 'Picked Up', 'Returned', 'Completed', 'Cancelled'].includes(
        fulfillmentStatus
      )
    ) {
      booking.fulfillmentStatus = fulfillmentStatus;
    }
    saveDb(db);
    res.json({booking});
  });

  app.patch('/api/admin/promotions/:id', requireAdmin, (req, res) => {
    const promo = db.promotions.find((p) => p.id === req.params.id);
    if (!promo) {
      res.status(404).json({error: 'Promotion request not found.'});
      return;
    }
    const {status} = req.body || {};
    if (status && ['Pending Verification', 'Approved', 'Rejected'].includes(status)) {
      promo.status = status;
      const listing = db.listings.find((l) => l.id === promo.listingId);
      if (listing) {
        if (status === 'Approved') {
          listing.isPromoted = true;
          listing.promotionPlan = promo.planLabel;
        } else if (status === 'Rejected') {
          listing.isPromoted = false;
        }
      }
    }
    saveDb(db);
    res.json({promotion: promo});
  });

  app.post('/api/admin/block-user', requireAdmin, (req, res) => {
    const phone = normalizePhone(req.body?.phone);
    if (!phone || phone.length < 10) {
      res.status(400).json({error: 'Valid 10-digit phone number required.'});
      return;
    }
    const existing = db.blockedUsers.find((u) => normalizePhone(u.phone) === phone);
    if (!existing) {
      db.blockedUsers.unshift({
        phone,
        reason: String(req.body?.reason || 'Policy / payment verification violation').slice(0, 200),
        blockedAt: new Date().toISOString(),
      });
      saveDb(db);
    }
    res.json({blockedUsers: db.blockedUsers});
  });

  app.delete('/api/admin/block-user/:phone', requireAdmin, (req, res) => {
    const phone = normalizePhone(req.params.phone);
    db.blockedUsers = db.blockedUsers.filter((u) => normalizePhone(u.phone) !== phone);
    saveDb(db);
    res.json({blockedUsers: db.blockedUsers});
  });

  app.patch('/api/admin/ads/:id', requireAdmin, (req, res) => {
    const ad = db.adSlots.find((a) => a.id === req.params.id);
    if (!ad) {
      res.status(404).json({error: 'Ad slot not found.'});
      return;
    }
    const {active, sponsorName, headline, ctaLabel} = req.body || {};
    if (typeof active === 'boolean') ad.active = active;
    if (typeof sponsorName === 'string' && sponsorName.trim()) ad.sponsorName = sponsorName.trim();
    if (typeof headline === 'string' && headline.trim()) ad.headline = headline.trim();
    if (typeof ctaLabel === 'string' && ctaLabel.trim()) ad.ctaLabel = ctaLabel.trim();
    saveDb(db);
    res.json({ad});
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NattuHub server listening on http://localhost:${PORT}`);
  });
}

startServer();
