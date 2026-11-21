import React, {useState} from 'react';
import {
  CheckCircle2,
  Clock,
  LogIn,
  MapPin,
  PackageCheck,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import {UserAccount, UserActivity} from '../types';

interface OrdersViewProps {
  currentUser: UserAccount | null;
  activity: UserActivity | null;
  loading: boolean;
  onOpenLogin: () => void;
  onRefresh: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  currentUser,
  activity,
  loading,
  onOpenLogin,
  onRefresh,
}) => {
  const [tab, setTab] = useState<'my_orders' | 'received' | 'boosts'>('my_orders');

  if (!currentUser) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-6 h-6 text-teal-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">Your Orders (ഓർഡറുകൾ)</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Sign in to view your direct meetup requests, customer inquiries on your items, and Ad Promotion boost status.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenLogin}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-500 transition-colors cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In / Login (ലോഗിൻ)</span>
        </button>
      </div>
    );
  }

  const myOrders = activity?.bookings || [];
  const receivedOrders = activity?.receivedBookings || [];
  const promotions = activity?.promotions || [];

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            Orders &amp; Bookings (ഓർഡർ)
          </h2>
          <p className="text-xs text-slate-400">
            Account ID: <span className="font-mono text-teal-400">{currentUser.id}</span> · {currentUser.name}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="self-start sm:self-auto px-3 py-1.5 text-xs font-medium bg-slate-950 border border-slate-800 text-slate-200 hover:bg-slate-800 rounded-xl cursor-pointer"
        >
          Refresh Orders
        </button>
      </div>

      {/* Sub-Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
        <button
          type="button"
          onClick={() => setTab('my_orders')}
          className={`min-h-[38px] px-2 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap truncate ${
            tab === 'my_orders' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          My Orders ({myOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('received')}
          className={`min-h-[38px] px-2 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap truncate ${
            tab === 'received' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          On My Items ({receivedOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('boosts')}
          className={`min-h-[38px] px-2 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap truncate ${
            tab === 'boosts' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Boosts ({promotions.length})
        </button>
      </div>

      {loading && !activity ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-400">
          Loading orders...
        </div>
      ) : tab === 'my_orders' ? (
        myOrders.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-400">
            No bookings or purchase orders placed yet.
          </div>
        ) : (
          <div className="space-y-3">
            {myOrders.map((b) => (
              <div
                key={b.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-slate-400">
                    {b.id} · {b.listingId}
                  </span>
                  <span
                    className={`font-semibold ${
                      b.paymentStatus === 'Verified' || b.paymentStatus === 'Direct Contact'
                        ? 'text-teal-400'
                        : b.paymentStatus === 'Rejected'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                    }`}
                  >
                    {b.paymentStatus === 'Direct Contact' ? 'Direct Meetup' : b.paymentStatus}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{b.listingTitle}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">Pickup: {b.pickupLocation}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <PackageCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">Usage/Drop: {b.usageOrDropLocation}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-mono font-bold text-white">
                    Est. ₹{b.baseAmount.toLocaleString('en-IN')} · Pay Owner at Meetup
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-300">
                    {b.fulfillmentStatus === 'Completed' || b.fulfillmentStatus === 'Confirmed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    {b.fulfillmentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === 'received' ? (
        receivedOrders.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-400">
            No customer orders received on your uploaded products yet.
          </div>
        ) : (
          <div className="space-y-3">
            {receivedOrders.map((b) => (
              <div
                key={b.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400">
                    Order {b.id} · Item {b.listingId}
                  </span>
                  <span className="font-semibold text-teal-400">{b.fulfillmentStatus}</span>
                </div>
                <h3 className="text-sm font-bold text-white">{b.listingTitle}</h3>
                <p className="text-xs text-slate-300">
                  Customer: <strong className="text-white">{b.customerName}</strong> · +91{' '}
                  {b.customerPhone}
                </p>
                <p className="text-xs text-slate-400">
                  Drop / Usage: {b.usageOrDropLocation} · Settlement:{' '}
                  {b.paymentStatus === 'Direct Contact' ? 'Direct Meetup' : b.paymentStatus}
                </p>
                <p className="text-xs font-mono font-bold text-teal-400">
                  Agreed / Listed Rate: ₹{b.baseAmount.toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        )
      ) : promotions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-400">
          No promotion boost orders yet.
        </div>
      ) : (
        <div className="space-y-3">
          {promotions.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-400">
                  {p.id} · {p.listingId}
                </span>
                <span className="font-semibold text-teal-400">{p.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-400 shrink-0" />
                <h3 className="text-sm font-bold text-white">{p.listingTitle}</h3>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                {p.planLabel} · ₹{p.feeAmount}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
