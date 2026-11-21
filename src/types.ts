export type ActionMode = 'rent' | 'buy_sell' | 'give' | 'need';
export type AppPage = 'home' | 'orders' | 'need' | 'profile';

export type ListingType = 'rent' | 'sale';
export type OwnerType = 'home' | 'shop';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'removed';

export interface Listing {
  id: string;
  listingType: ListingType;
  ownerType: OwnerType;
  title: string;
  category: string;
  price: number;
  condition: string;
  pickupLocation: string;
  usageAreaNotes: string;
  availability: string;
  description: string;
  photoUrl: string;
  photoSizeKb?: number;
  ownerUserId?: string;
  ownerName: string;
  ownerPhone: string;
  shopName?: string;
  shopTerms?: string;
  status: ModerationStatus;
  isPromoted: boolean;
  promotionPlan?: string;
  createdAt: string;
}

export interface NeedResponse {
  id: string;
  responderUserId?: string;
  responderName: string;
  responderPhone: string;
  responderType: OwnerType;
  offerPrice: number;
  location: string;
  message: string;
  createdAt: string;
}

export interface NeedRequest {
  id: string;
  title: string;
  needType: 'rent' | 'buy';
  category: string;
  location: string;
  durationOrTimeline: string;
  budget: number;
  notes: string;
  photoUrl?: string;
  photoSizeKb?: number;
  requesterUserId?: string;
  requesterName: string;
  requesterPhone: string;
  status: ModerationStatus;
  responses: NeedResponse[];
  createdAt: string;
}

export interface BookingOrder {
  id: string;
  listingId: string;
  listingTitle: string;
  listingType: ListingType;
  ownerType: OwnerType;
  orderKind: 'rental_booking' | 'sale_hold' | 'sale_inquiry';
  customerUserId?: string;
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  usageOrDropLocation: string;
  days?: number;
  baseAmount: number;
  commissionAmount: number;
  totalPayable: number;
  upiRef?: string;
  screenshotDataUrl?: string;
  screenshotSizeKb?: number;
  paymentStatus: 'Pending Verification' | 'Verified' | 'Rejected' | 'Direct Contact';
  fulfillmentStatus: 'Awaiting Verification' | 'Confirmed' | 'Picked Up' | 'Returned' | 'Completed' | 'Cancelled';
  termsAccepted: boolean;
  createdAt: string;
}

export interface PromotionRequest {
  id: string;
  listingId: string;
  listingTitle: string;
  ownerUserId?: string;
  ownerName: string;
  ownerPhone: string;
  planLabel: string;
  feeAmount: number;
  upiRef?: string;
  screenshotDataUrl: string;
  screenshotSizeKb: number;
  status: 'Pending Verification' | 'Approved' | 'Rejected';
  termsAccepted: boolean;
  createdAt: string;
}

export interface AdSlot {
  id: string;
  placement: 'top_strip' | 'grid_native';
  sponsorName: string;
  headline: string;
  ctaLabel: string;
  targetUrl: string;
  locationTag: string;
  active: boolean;
}

export interface BlockedUser {
  phone: string;
  reason: string;
  blockedAt: string;
}

export interface AdminStats {
  rentalListings: number;
  saleListings: number;
  needRequests: number;
  pendingApprovals: number;
  bookingsCount: number;
  pendingScreenshots: number;
  commissionTotal: number;
  promotionRevenue: number;
}

export interface UserAccount {
  id: string;
  name: string;
  phone: string;
  accountType: OwnerType;
  shopName?: string;
  location: string;
  bio?: string;
  avatarUrl?: string;
  avatarSizeKb?: number;
  createdAt: string;
}

export interface UserActivity {
  listings: Listing[];
  needs: NeedRequest[];
  bookings: BookingOrder[];
  receivedBookings: BookingOrder[];
  promotions: PromotionRequest[];
}

