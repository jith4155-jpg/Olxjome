import React, {useState} from 'react';
import {
  Handshake,
  MapPin,
  Megaphone,
  Package,
  Phone,
  ShoppingBag,
} from 'lucide-react';
import {Listing} from '../types';

interface ListingCardProps {
  listing: Listing;
  onSelect: (listing: Listing, initialTab?: 'action' | 'promote') => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({listing, onSelect}) => {
  const [imgError, setImgError] = useState(false);

  const typeLabel =
    listing.listingType === 'rent'
      ? listing.ownerType === 'shop'
        ? 'For Rent - Shop'
        : 'For Rent - Home'
      : 'For Sale';

  const isRent = listing.listingType === 'rent';

  return (
    <article
      className={`group bg-slate-900 rounded-2xl border transition-all duration-150 flex flex-col overflow-hidden ${
        listing.isPromoted
          ? 'border-teal-500/60 shadow-sm shadow-teal-950/40'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* 4:3 Uniform Media Container with 3 Boxed Action Icons Inside Image */}
      <div className="relative aspect-[4/3] w-full bg-slate-950 overflow-hidden border-b border-slate-800">
        <button
          type="button"
          onClick={() => onSelect(listing, 'action')}
          aria-label={`View ${listing.title}`}
          className="w-full h-full block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          {!imgError && listing.photoUrl ? (
            <img
              src={listing.photoUrl}
              alt={listing.title}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-500 p-3 text-center">
              <Package className="w-6 h-6 mb-1 text-slate-500" />
              <span className="text-[11px] font-medium text-slate-400 line-clamp-1">
                {listing.title}
              </span>
            </div>
          )}
        </button>

        {listing.status === 'pending' ? (
          <span className="absolute top-2 left-2 bg-amber-950/90 border border-amber-500/40 text-amber-300 text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-md pointer-events-none">
            Pending Approval
          </span>
        ) : listing.isPromoted ? (
          <span className="absolute top-2 left-2 bg-slate-950/90 border border-teal-500/40 text-teal-300 text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-md pointer-events-none">
            Featured
          </span>
        ) : null}

        {/* 3 Boxed Icons Overlaid Inside Bottom of Image */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent pt-6 pb-2 px-2">
          <div className="grid grid-cols-3 gap-1.5">
            {/* Box 1: Rent / Buy */}
            <button
              type="button"
              onClick={() => onSelect(listing, 'action')}
              className="min-h-[38px] px-1 py-1 rounded-lg bg-slate-950/85 hover:bg-slate-900 border border-slate-700/80 hover:border-teal-400 text-slate-100 flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer"
            >
              {isRent ? (
                <Handshake className="w-3.5 h-3.5 text-teal-400" />
              ) : (
                <ShoppingBag className="w-3.5 h-3.5 text-teal-400" />
              )}
              <span className="text-[9px] sm:text-[10px] font-semibold leading-none whitespace-nowrap">
                {isRent ? 'Rent' : 'Buy'}
              </span>
            </button>

            {/* Box 2: Contact / Call */}
            <a
              href={`tel:+91${listing.ownerPhone}`}
              onClick={(e) => e.stopPropagation()}
              className="min-h-[38px] px-1 py-1 rounded-lg bg-slate-950/85 hover:bg-slate-900 border border-slate-700/80 hover:border-teal-400 text-slate-100 flex flex-col items-center justify-center gap-0.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-slate-200" />
              <span className="text-[9px] sm:text-[10px] font-semibold leading-none whitespace-nowrap">
                Call
              </span>
            </a>

            {/* Box 3: Promote */}
            <button
              type="button"
              onClick={() => onSelect(listing, 'promote')}
              className="min-h-[38px] px-1 py-1 rounded-lg bg-teal-600/90 hover:bg-teal-500 border border-teal-400/60 text-white flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer"
            >
              <Megaphone className="w-3.5 h-3.5 text-white" />
              <span className="text-[9px] sm:text-[10px] font-semibold leading-none whitespace-nowrap">
                Promote
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Clean Unboxed Content */}
      <button
        type="button"
        onClick={() => onSelect(listing, 'action')}
        className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 cursor-pointer flex-1 p-3 sm:p-4 flex flex-col justify-between gap-2"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-400 min-w-0">
            <span
              className={`truncate ${
                isRent
                  ? listing.ownerType === 'shop'
                    ? 'font-medium text-amber-400'
                    : 'font-medium text-teal-400'
                  : 'font-medium text-slate-200'
              }`}
            >
              {typeLabel}
            </span>
            <span className="hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <span className="hidden sm:inline truncate">{listing.category}</span>
          </div>

          <h3 className="text-[13px] sm:text-[15px] font-semibold text-slate-100 leading-snug line-clamp-2">
            {listing.title}
          </h3>
        </div>

        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-base sm:text-lg font-bold text-white font-mono tabular-nums">
              ₹{listing.price.toLocaleString('en-IN')}
              {isRent && (
                <span className="text-[10px] sm:text-xs font-sans font-normal text-slate-400">
                  {' '}
                  / day
                </span>
              )}
            </p>
            <span className="hidden sm:inline text-xs text-slate-400 truncate max-w-[110px]">
              {listing.condition}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-400 min-w-0">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{listing.pickupLocation}</span>
          </div>
        </div>
      </button>
    </article>
  );
};
