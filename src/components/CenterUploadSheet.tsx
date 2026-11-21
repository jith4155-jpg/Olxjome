import React, {useState} from 'react';
import {
  ClipboardList,
  PackagePlus,
  ShoppingBag,
  UploadCloud,
  Wrench,
  X,
} from 'lucide-react';
import {ActionMode, UserAccount, UserActivity} from '../types';

export interface CenterUploadCategory {
  id: ActionMode;
  title: string;
  ml: string;
  subtitle: string;
  imageUrl: string;
  fallbackIcon: 'rent' | 'buy_sell' | 'give' | 'need';
}

const CATEGORIES: CenterUploadCategory[] = [
  {
    id: 'rent',
    title: 'Rent / Take',
    ml: 'എടുക്കാൻ',
    subtitle: 'Browse Home & Shop rentals nearby',
    imageUrl: '/src/assets/images/nav_rent_take_1795288865215.jpg',
    fallbackIcon: 'rent',
  },
  {
    id: 'buy_sell',
    title: 'Buy / Sell',
    ml: 'വിൽക്കാൻ / വാങ്ങാൻ',
    subtitle: 'Sell an item (OLX-style upload)',
    imageUrl: '/src/assets/images/nav_buy_sell_1795288863318.jpg',
    fallbackIcon: 'buy_sell',
  },
  {
    id: 'give',
    title: 'Give / List',
    ml: 'കൊടുക്കാൻ',
    subtitle: 'Upload item from Home or Shop for rent',
    imageUrl: '/src/assets/images/nav_give_list_1795288864305.jpg',
    fallbackIcon: 'give',
  },
  {
    id: 'need',
    title: 'Need / Request',
    ml: 'ആവശ്യക്കാരൻ',
    subtitle: 'Post what item you are looking for',
    imageUrl: '/src/assets/images/nav_need_request_1795288865593.jpg',
    fallbackIcon: 'need',
  },
];

function CategoryThumb({
  src,
  alt,
  fallbackIcon,
}: {
  src: string;
  alt: string;
  fallbackIcon: 'rent' | 'buy_sell' | 'give' | 'need';
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    const Icon =
      fallbackIcon === 'rent'
        ? Wrench
        : fallbackIcon === 'buy_sell'
          ? ShoppingBag
          : fallbackIcon === 'give'
            ? PackagePlus
            : ClipboardList;
    return (
      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-teal-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
    />
  );
}

interface CenterUploadSheetProps {
  open: boolean;
  currentUser: UserAccount | null;
  activity: UserActivity | null;
  onClose: () => void;
  onSelectCategory: (mode: ActionMode) => void;
  onOpenProfile: () => void;
}

export const CenterUploadSheet: React.FC<CenterUploadSheetProps> = ({
  open,
  currentUser,
  activity,
  onClose,
  onSelectCategory,
  onOpenProfile,
}) => {
  if (!open) return null;

  const rentUploads =
    activity?.listings.filter((l) => l.listingType === 'rent').length || 0;
  const saleUploads =
    activity?.listings.filter((l) => l.listingType === 'sale').length || 0;
  const needUploads = activity?.needs.length || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="center-upload-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600/20 border border-teal-500/40 flex items-center justify-center">
              <UploadCloud className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h2 id="center-upload-title" className="text-base font-bold text-white">
                Upload &amp; Categories
              </h2>
              <p className="text-xs text-slate-400">
                Choose a section to upload or browse
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* The 4 Categories with Generated Images & Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-teal-500/50 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer group"
              >
                <CategoryThumb
                  src={cat.imageUrl}
                  alt={cat.title}
                  fallbackIcon={cat.fallbackIcon}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors truncate">
                      {cat.title}
                    </span>
                    <span className="text-[11px] font-medium text-teal-400 shrink-0">
                      {cat.ml}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                    {cat.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Upload Summary by Section linked to Logged-in User ID */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            {currentUser ? (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    Your Uploaded Sections
                  </span>
                  <span className="font-mono text-teal-400">
                    ID: {currentUser.id}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <button
                    type="button"
                    onClick={() => onSelectCategory('give')}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer"
                  >
                    <p className="text-base font-bold text-white font-mono tabular-nums">
                      {rentUploads}
                    </p>
                    <p className="text-[11px] text-slate-400">Rent Uploads</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectCategory('buy_sell')}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer"
                  >
                    <p className="text-base font-bold text-white font-mono tabular-nums">
                      {saleUploads}
                    </p>
                    <p className="text-[11px] text-slate-400">Sale Uploads</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectCategory('need')}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer"
                  >
                    <p className="text-base font-bold text-white font-mono tabular-nums">
                      {needUploads}
                    </p>
                    <p className="text-[11px] text-slate-400">Needs Posted</p>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="w-full py-2 text-xs font-semibold text-teal-400 hover:text-teal-300 text-center cursor-pointer"
                >
                  View All Products Under My ID ({currentUser.id})
                </button>
              </>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                  Sign in to track your uploaded products under your personal Account ID.
                </p>
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="px-3 py-1.5 text-xs font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-500 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Login / Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
