import React, {useState} from 'react';
import {CheckCircle2, Home, Store, Tag} from 'lucide-react';
import {ListingType, OwnerType} from '../types';
import {CompressedImageUpload} from './CompressedImageUpload';

const CATEGORIES = [
  'Tools & Hardware',
  'Cameras & Audio',
  'Electronics',
  'Furniture',
  'Vehicles & Cycles',
  'Events & Party',
  'Home Appliances',
  'Other',
];

interface PostListingFormProps {
  defaultListingType?: ListingType;
  currentUser?: {
    name: string;
    phone: string;
    accountType: OwnerType;
    shopName?: string;
    location: string;
  } | null;
  authToken?: string;
  onOpenLogin?: () => void;
  onOpenTerms: () => void;
  onSuccess: () => void;
  onBackToHome?: () => void;
}

export const PostListingForm: React.FC<PostListingFormProps> = ({
  defaultListingType = 'rent',
  currentUser,
  authToken,
  onOpenLogin,
  onOpenTerms,
  onSuccess,
  onBackToHome,
}) => {
  const [listingType, setListingType] = useState<ListingType>(defaultListingType);
  const [ownerType, setOwnerType] = useState<OwnerType>(currentUser?.accountType || 'home');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('Good');
  const [pickupLocation, setPickupLocation] = useState(currentUser?.location || '');
  const [usageAreaNotes, setUsageAreaNotes] = useState('');
  const [availability, setAvailability] = useState('Available Today');
  const [description, setDescription] = useState('');
  const [ownerName, setOwnerName] = useState(currentUser?.name || '');
  const [ownerPhone, setOwnerPhone] = useState(currentUser?.phone || '');
  const [shopName, setShopName] = useState(currentUser?.shopName || '');
  const [shopTerms, setShopTerms] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoSizeKb, setPhotoSizeKb] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState('');

  const numericPrice = Number(price) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const headers: Record<string, string> = {'Content-Type': 'application/json'};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          listingType,
          ownerType,
          title,
          category,
          price: numericPrice,
          condition,
          pickupLocation,
          usageAreaNotes,
          availability,
          description,
          ownerName,
          ownerPhone,
          shopName: ownerType === 'shop' ? shopName : undefined,
          shopTerms: ownerType === 'shop' ? shopTerms : undefined,
          photoUrl,
          photoSizeKb,
          termsAccepted,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish listing.');
      }

      setSubmittedMessage(data.message || 'Listing submitted for Admin approval.');
      setTitle('');
      setPrice('');
      setPickupLocation(currentUser?.location || '');
      setUsageAreaNotes('');
      setDescription('');
      setPhotoUrl('');
      setPhotoSizeKb(0);
      setTermsAccepted(false);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Unable to submit listing.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedMessage) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl mx-auto text-center space-y-3">
        <CheckCircle2 className="w-8 h-8 text-teal-400 mx-auto" />
        <h3 className="text-lg font-semibold text-white">Listing Received</h3>
        <p className="text-sm text-slate-300">{submittedMessage}</p>
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="px-4 py-2 text-sm font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-500 cursor-pointer"
            >
              View on Home Page
            </button>
          )}
          <button
            type="button"
            onClick={() => setSubmittedMessage('')}
            className="px-4 py-2 text-sm font-medium bg-slate-800 text-slate-200 rounded-xl hover:bg-slate-700 cursor-pointer"
          >
            Post Another Item
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 max-w-3xl mx-auto space-y-5"
    >
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">
            {listingType === 'rent' ? 'Give Item for Rent (കൊടുക്കാൻ)' : 'List Item for Sale (വിൽക്കാൻ)'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Photos auto-compress to 10KB–30KB. Reviewed quickly before going live.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setListingType('rent')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              listingType === 'rent' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'
            }`}
          >
            Give on Rent
          </button>
          <button
            type="button"
            onClick={() => setListingType('sale')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              listingType === 'sale' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'
            }`}
          >
            Sell Item
          </button>
        </div>
      </div>

      {!currentUser && onOpenLogin && (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs">
          <span className="text-slate-300">
            Sign in to auto-fill your details and track listing approvals.
          </span>
          <button
            type="button"
            onClick={onOpenLogin}
            className="font-semibold text-teal-400 hover:underline whitespace-nowrap cursor-pointer"
          >
            Login / ലോഗിൻ
          </button>
        </div>
      )}

      {/* Owner Type Selector: Home vs Shop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setOwnerType('home')}
          className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
            ownerType === 'home'
              ? 'border-teal-500 bg-teal-950/50'
              : 'border-slate-800 bg-slate-950'
          }`}
        >
          <Home className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">Home / Individual</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {listingType === 'rent'
                ? '0% platform fee. Customers contact & meet you directly.'
                : 'Direct OLX-style home sale listing.'}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setOwnerType('shop')}
          className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
            ownerType === 'shop'
              ? 'border-amber-500 bg-amber-950/40'
              : 'border-slate-800 bg-slate-950'
          }`}
        >
          <Store className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">Local Rental / Retail Shop</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {listingType === 'rent'
                ? '0% platform fee. Show your shop terms clearly.'
                : 'Shop-backed sale item with store pickup.'}
            </p>
          </div>
        </button>
      </div>

      {/* Clear 0% Fee Direct Meetup Note */}
      {listingType === 'rent' && (
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Tag className="w-4 h-4 text-teal-400 shrink-0" />
            <span>
              {ownerType === 'home'
                ? 'Direct Customer Meetup: 0% platform commission. Settle rental directly at pickup.'
                : 'Shop Rental Terms: 0% platform fee; customers meet at your store and follow shop rules.'}
            </span>
          </div>
          {numericPrice > 0 && (
            <span className="font-mono tabular-nums font-semibold text-teal-400">
              Rate: ₹{numericPrice}/day (0% fee)
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-200 mb-1">
            Item Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              listingType === 'rent'
                ? 'e.g. Bosch Pressure Washer 1700 PSI or DSLR Camera'
                : 'e.g. Solid Teak Study Desk or MacBook Air M1'
            }
            className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1">
            {listingType === 'rent' ? 'Rental Rate (₹ / Day)' : 'Selling Price (₹)'}{' '}
            <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            min={1}
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={listingType === 'rent' ? 'e.g. 350' : 'e.g. 8500'}
            className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono tabular-nums"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1">Condition</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Shop Tested">Shop Tested</option>
            <option value="Used">Used</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1">Availability</label>
          <input
            type="text"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="e.g. Available Today / Weekends"
            className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1">
            Pickup Location <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            placeholder="e.g. Edappally, Kochi"
            className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1">
            Usage / Drop Area Details
          </label>
          <input
            type="text"
            value={usageAreaNotes}
            onChange={(e) => setUsageAreaNotes(e.target.value)}
            placeholder="e.g. Within 15 km; ID check at pickup"
            className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {ownerType === 'shop' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Shop Name</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Metro Hardware Hire"
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Shop Terms</label>
              <input
                type="text"
                value={shopTerms}
                onChange={(e) => setShopTerms(e.target.value)}
                placeholder="e.g. Store pickup & return by 7 PM"
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1">
            Contact Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="Your name"
            className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1">
            Contact Phone <span className="text-rose-400">*</span>
          </label>
          <input
            type="tel"
            required
            value={ownerPhone}
            onChange={(e) => setOwnerPhone(e.target.value)}
            placeholder="10-digit mobile"
            className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-200 mb-1">Short Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key specs, included accessories, or pickup hours..."
            className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="sm:col-span-2">
          <CompressedImageUpload
            label="Item Photo"
            required
            value={photoUrl}
            sizeKb={photoSizeKb}
            onChange={(url, kb) => {
              setPhotoUrl(url);
              setPhotoSizeKb(kb);
            }}
            onClear={() => {
              setPhotoUrl('');
              setPhotoSizeKb(0);
            }}
          />
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-0.5 rounded border-slate-600 bg-slate-950 text-teal-500 focus:ring-teal-500"
        />
        <span>
          I agree to the{' '}
          <button
            type="button"
            onClick={onOpenTerms}
            className="text-teal-400 underline font-medium cursor-pointer"
          >
            Terms &amp; Conditions
          </button>{' '}
          (accurate pickup location, condition disclosure, and direct customer meetup rules).
        </span>
      </label>

      {error && <p className="text-xs font-medium text-rose-400">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
        >
          {submitting
            ? 'Submitting...'
            : listingType === 'rent'
            ? 'Submit Rental Listing'
            : 'Publish Sale Listing'}
        </button>
      </div>
    </form>
  );
};
