import React, {useCallback, useEffect, useState} from 'react';
import {LogOut, MapPin, Phone, Trash2, User, X} from 'lucide-react';
import {UserAccount, UserActivity} from '../types';

interface AccountDrawerModalProps {
  open: boolean;
  user: UserAccount | null;
  token: string;
  onClose: () => void;
  onLogout: () => void;
  onRefreshMarketplace: () => void;
}

export const AccountDrawerModal: React.FC<AccountDrawerModalProps> = ({
  open,
  user,
  token,
  onClose,
  onLogout,
  onRefreshMarketplace,
}) => {
  const [tab, setTab] = useState<'listings' | 'bookings' | 'needs' | 'promotions'>('listings');
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [loading, setLoading] = useState(false);

  const loadActivity = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/my-activity', {
        headers: {Authorization: `Bearer ${token}`},
      });
      if (res.ok) {
        const json = await res.json();
        setActivity(json);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (open && token) {
      loadActivity();
    }
  }, [open, token, loadActivity]);

  if (!open || !user) return null;

  const handleRemoveListing = async (listingId: string) => {
    const res = await fetch(`/api/my-listings/${listingId}`, {
      method: 'DELETE',
      headers: {Authorization: `Bearer ${token}`},
    });
    if (res.ok) {
      await loadActivity();
      onRefreshMarketplace();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[88vh] flex flex-col">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-teal-950/70 border border-teal-700/60 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-teal-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white truncate">
                {user.name} {user.shopName ? `(${user.shopName})` : ''}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3" />
                  {user.phone}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3" />
                  {user.location}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 text-slate-400 hover:text-white rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-navigation */}
        <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          {(
            [
              ['listings', `Listings (${activity?.listings.length || 0})`],
              ['bookings', `Bookings & Orders (${activity?.bookings.length || 0})`],
              ['needs', `Needs (${activity?.needs.length || 0})`],
              ['promotions', `Boosts (${activity?.promotions.length || 0})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap cursor-pointer ${
                tab === key ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {loading && !activity ? (
            <p className="text-sm text-slate-400 text-center py-6">Loading your activity...</p>
          ) : tab === 'listings' ? (
            (activity?.listings.length || 0) === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                No listings posted with {user.phone} yet.
              </p>
            ) : (
              activity?.listings.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.photoUrl}
                      alt={item.title}
                      className="w-14 h-11 object-cover rounded border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                      <p className="text-xs text-slate-400 font-mono">
                        ₹{item.price.toLocaleString('en-IN')} · Status:{' '}
                        <span className="capitalize font-semibold text-teal-400">
                          {item.status}
                        </span>
                        {item.isPromoted ? ' · Featured' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveListing(item.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-300 bg-rose-950/70 hover:bg-rose-900/70 border border-rose-800/60 rounded cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              ))
            )
          ) : tab === 'bookings' ? (
            (activity?.bookings.length || 0) === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No bookings or orders yet.</p>
            ) : (
              activity?.bookings.map((b) => (
                <div key={b.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400">{b.id}</span>
                    <span className="font-semibold text-teal-400">{b.paymentStatus}</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{b.listingTitle}</p>
                  <p className="text-xs text-slate-400 font-mono">
                    Total: ₹{b.totalPayable.toLocaleString('en-IN')} · Fulfillment:{' '}
                    {b.fulfillmentStatus}
                  </p>
                </div>
              ))
            )
          ) : tab === 'needs' ? (
            (activity?.needs.length || 0) === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No needed requests yet.</p>
            ) : (
              activity?.needs.map((n) => (
                <div key={n.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize font-semibold text-teal-400">{n.status}</span>
                    <span className="font-mono text-slate-300">
                      Budget ₹{n.budget.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white">{n.title}</p>
                  <p className="text-xs text-slate-400">
                    {n.responses.length} offer(s) received
                  </p>
                </div>
              ))
            )
          ) : (activity?.promotions.length || 0) === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No boost payments yet.</p>
          ) : (
            activity?.promotions.map((p) => (
              <div key={p.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-teal-400">{p.status}</span>
                  <span className="font-mono text-slate-200">₹{p.feeAmount}</span>
                </div>
                <p className="text-sm font-semibold text-white">{p.listingTitle}</p>
                <p className="text-xs text-slate-400">{p.planLabel}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
