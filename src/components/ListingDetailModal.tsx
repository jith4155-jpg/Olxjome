import React, {useState} from 'react';
import {CheckCircle2, Home, MapPin, Phone, ShieldCheck, Store, X} from 'lucide-react';
import {Listing, UserAccount} from '../types';
import {CompressedImageUpload} from './CompressedImageUpload';
import {UpiQrBox} from './UpiQrBox';

interface ListingDetailModalProps {
  listing: Listing | null;
  initialTab?: 'action' | 'promote';
  currentUser?: UserAccount | null;
  authToken?: string;
  onClose: () => void;
  onOpenTerms: () => void;
  onSuccessRefresh: () => void;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  listing,
  initialTab = 'action',
  currentUser,
  authToken,
  onClose,
  onOpenTerms,
  onSuccessRefresh,
}) => {
  const [tab, setTab] = useState<'action' | 'promote'>(initialTab);

  // Direct Meetup / Inquiry state (No platform payment or commission)
  const [days, setDays] = useState(1);
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [usageOrDropLocation, setUsageOrDropLocation] = useState(currentUser?.location || '');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Paid Ad Promotion state (UPI QR + Screenshot required ONLY for ad promotion)
  const [promoPlan, setPromoPlan] = useState<'7-Day Featured Top' | '15-Day City Spotlight'>('7-Day Featured Top');
  const [promoOwnerName, setPromoOwnerName] = useState(currentUser?.name || '');
  const [promoOwnerPhone, setPromoOwnerPhone] = useState(currentUser?.phone || '');
  const [promoUpiRef, setPromoUpiRef] = useState('');
  const [promoScreenshot, setPromoScreenshot] = useState('');
  const [promoScreenshotKb, setPromoScreenshotKb] = useState(0);
  const [promoTerms, setPromoTerms] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!listing) return null;

  const isRent = listing.listingType === 'rent';
  const rentEstimatedTotal = listing.price * days;
  const promoFee = promoPlan === '15-Day City Spotlight' ? 179 : 99;

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        listingId: listing.id,
        orderKind: isRent ? 'rental_booking' : 'sale_inquiry',
        customerName,
        customerPhone,
        usageOrDropLocation,
        days: isRent ? days : undefined,
        offerPrice: !isRent ? Number(offerPrice) || listing.price : undefined,
        termsAccepted,
      };

      const headers: Record<string, string> = {'Content-Type': 'application/json'};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not send meetup request.');
      }

      setSuccessMsg(
        isRent
          ? `Meetup request sent to ${listing.ownerName}. Contact directly at +91 ${listing.ownerPhone} and settle ₹${rentEstimatedTotal.toLocaleString('en-IN')} at pickup (${listing.pickupLocation}).`
          : `Offer sent to ${listing.ownerName}. Contact directly at +91 ${listing.ownerPhone} to inspect & buy.`
      );
      onSuccessRefresh();
    } catch (err: any) {
      setError(err?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const headers: Record<string, string> = {'Content-Type': 'application/json'};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          listingId: listing.id,
          ownerName: promoOwnerName || listing.ownerName,
          ownerPhone: promoOwnerPhone || listing.ownerPhone,
          planLabel: promoPlan,
          upiRef: promoUpiRef || undefined,
          screenshotDataUrl: promoScreenshot,
          screenshotSizeKb: promoScreenshotKb,
          termsAccepted: promoTerms,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not submit promotion.');
      }
      setSuccessMsg(
        'Promotion screenshot submitted (Pending Verification). Featured ad boost activates once checked.'
      );
      onSuccessRefresh();
    } catch (err: any) {
      setError(err?.message || 'Promotion submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            {listing.ownerType === 'shop' ? (
              <Store className="w-4 h-4 text-amber-400" />
            ) : (
              <Home className="w-4 h-4 text-teal-400" />
            )}
            <span className="font-medium">
              {isRent
                ? listing.ownerType === 'shop'
                  ? `Shop Rental · ${listing.shopName || listing.ownerName}`
                  : `Home Rental · ${listing.ownerName}`
                : `For Sale · ${listing.ownerName}`}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 space-y-5">
          {/* Item Summary */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            <div className="md:col-span-5 aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
              <img
                src={listing.photoUrl}
                alt={listing.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="md:col-span-7 space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{listing.category}</span>
                <span>·</span>
                <span>{listing.condition}</span>
                <span>·</span>
                <span>{listing.availability}</span>
              </div>

              <h2 className="text-xl font-bold text-white leading-snug">{listing.title}</h2>

              <p className="text-2xl font-bold text-white font-mono tabular-nums">
                ₹{listing.price.toLocaleString('en-IN')}
                {isRent && <span className="text-sm font-sans font-normal text-slate-400"> / day</span>}
              </p>

              <p className="text-sm text-slate-300">{listing.description}</p>

              <div className="pt-1 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>
                    <strong className="text-white">Pickup / Meetup:</strong> {listing.pickupLocation}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{listing.usageAreaNotes}</span>
                </div>
                {listing.shopTerms && (
                  <div className="text-amber-200 bg-amber-950/50 border border-amber-800/60 rounded-lg px-2.5 py-1.5 mt-1">
                    {listing.shopTerms}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <span className="inline-flex items-center gap-1.5 text-slate-200 font-mono">
                    <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    +91 {listing.ownerPhone}
                  </span>
                  <a
                    href={`tel:+91${listing.ownerPhone}`}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-teal-600/20 border border-teal-500/40 text-teal-300 hover:bg-teal-600/30 rounded-lg"
                  >
                    Call Owner Directly
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Segmented Mode Switcher: Direct Meetup vs Promote Ad */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => {
                setTab('action');
                setError('');
                setSuccessMsg('');
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'action' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isRent ? 'Contact & Meetup' : 'Buy / Make Offer'}
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('promote');
                setError('');
                setSuccessMsg('');
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'promote' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Promote Ad (Paid Boost)
            </button>
          </div>

          {successMsg ? (
            <div className="p-4 bg-teal-950/60 border border-teal-700/60 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-teal-100">{successMsg}</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-500 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : tab === 'action' ? (
            <form onSubmit={handleActionSubmit} className="space-y-4 border-t border-slate-800 pt-4">
              {isRent ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">
                      Rental Duration (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={days}
                      onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono tabular-nums"
                    />
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Estimated Rental ({days} day{days > 1 ? 's' : ''})</span>
                      <span className="font-mono tabular-nums text-white font-bold">
                        ₹{rentEstimatedTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-xs text-teal-400">
                      0% platform fee · Pay owner directly when meeting for pickup
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Your Offer Price (₹) — Pay Seller Directly at Meetup
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder={String(listing.price)}
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono tabular-nums"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Your Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Phone Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  {isRent ? 'Usage / Meetup Location' : 'Meetup / Inspection Location'}{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={usageOrDropLocation}
                  onChange={(e) => setUsageOrDropLocation(e.target.value)}
                  placeholder={
                    isRent
                      ? 'Where item will be used / meetup point (e.g. Kakkanad, Kochi)'
                      : 'Preferred inspection point or buyer locality'
                  }
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-slate-600 bg-slate-950 text-teal-500 focus:ring-teal-500"
                />
                <span>
                  I accept the{' '}
                  <button
                    type="button"
                    onClick={onOpenTerms}
                    className="text-teal-400 underline font-medium cursor-pointer"
                  >
                    Terms &amp; Conditions
                  </button>{' '}
                  (inspect item in person at meetup/pickup; direct owner settlement).
                </span>
              </label>

              {error && <p className="text-xs font-medium text-rose-400">{error}</p>}

              <div className="flex justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting
                    ? 'Sending...'
                    : isRent
                    ? 'Send Meetup Request (No Fee)'
                    : 'Send Offer & Request Meetup'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePromoteSubmit} className="space-y-4 border-t border-slate-800 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPromoPlan('7-Day Featured Top')}
                  className={`p-3.5 text-left rounded-lg border cursor-pointer transition-colors ${
                    promoPlan === '7-Day Featured Top'
                      ? 'border-teal-500 bg-teal-950/60'
                      : 'border-slate-700 bg-slate-950'
                  }`}
                >
                  <p className="text-sm font-semibold text-white">7-Day Featured Top</p>
                  <p className="text-xs text-slate-400 mt-0.5">Pinned to top of search &amp; grid</p>
                  <p className="text-base font-bold text-teal-400 font-mono mt-1.5">₹99</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPromoPlan('15-Day City Spotlight')}
                  className={`p-3.5 text-left rounded-lg border cursor-pointer transition-colors ${
                    promoPlan === '15-Day City Spotlight'
                      ? 'border-teal-500 bg-teal-950/60'
                      : 'border-slate-700 bg-slate-950'
                  }`}
                >
                  <p className="text-sm font-semibold text-white">15-Day City Spotlight</p>
                  <p className="text-xs text-slate-400 mt-0.5">Priority rank across Rentals &amp; Sales</p>
                  <p className="text-base font-bold text-teal-400 font-mono mt-1.5">₹179</p>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Listing Owner / Shop Name
                  </label>
                  <input
                    type="text"
                    value={promoOwnerName}
                    onChange={(e) => setPromoOwnerName(e.target.value)}
                    placeholder={listing.ownerName}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Registered Phone
                  </label>
                  <input
                    type="tel"
                    value={promoOwnerPhone}
                    onChange={(e) => setPromoOwnerPhone(e.target.value)}
                    placeholder={listing.ownerPhone}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <UpiQrBox amount={promoFee} note={`BOOST ${listing.id}`} />

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  UPI Reference / UTR (Optional)
                </label>
                <input
                  type="text"
                  value={promoUpiRef}
                  onChange={(e) => setPromoUpiRef(e.target.value)}
                  placeholder="Transaction ID"
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <CompressedImageUpload
                label="Upload Promotion UPI Screenshot"
                required
                value={promoScreenshot}
                sizeKb={promoScreenshotKb}
                onChange={(url, kb) => {
                  setPromoScreenshot(url);
                  setPromoScreenshotKb(kb);
                }}
                onClear={() => {
                  setPromoScreenshot('');
                  setPromoScreenshotKb(0);
                }}
              />

              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={promoTerms}
                  onChange={(e) => setPromoTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-600 bg-slate-950 text-teal-500 focus:ring-teal-500"
                />
                <span>
                  I accept the{' '}
                  <button
                    type="button"
                    onClick={onOpenTerms}
                    className="text-teal-400 underline font-medium cursor-pointer"
                  >
                    Terms &amp; Conditions
                  </button>{' '}
                  for listing promotion and manual UPI verification.
                </span>
              </label>

              {error && <p className="text-xs font-medium text-rose-400">{error}</p>}

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : `Submit Boost Payment (₹${promoFee})`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
