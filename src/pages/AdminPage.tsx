import React, {useCallback, useEffect, useState} from 'react';
import {
  Ban,
  Check,
  Eye,
  Lock,
  LogOut,
  ShieldAlert,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import {
  AdminStats,
  AdSlot,
  BlockedUser,
  BookingOrder,
  Listing,
  NeedRequest,
  PromotionRequest,
} from '../types';

type AdminTab = 'overview' | 'moderation' | 'screenshots' | 'users_ads';

interface AdminPayload {
  stats: AdminStats;
  listings: Listing[];
  needs: NeedRequest[];
  bookings: BookingOrder[];
  promotions: PromotionRequest[];
  adSlots: AdSlot[];
  blockedUsers: BlockedUser[];
}

export const AdminPage: React.FC = () => {
  const [token, setToken] = useState<string>('');
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [data, setData] = useState<AdminPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<AdminTab>('overview');
  const [modFilter, setModFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [inspectImage, setInspectImage] = useState<{title: string; src: string; meta: string} | null>(null);

  const [blockPhone, setBlockPhone] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetch('/api/admin/status')
      .then((r) => r.json())
      .then((j) => setConfigured(Boolean(j.configured)))
      .catch(() => setConfigured(true));
  }, []);

  const fetchOverview = useCallback(async (authToken: string) => {
    setLoading(true);
    setActionError('');
    try {
      const res = await fetch('/api/admin/overview', {
        headers: {Authorization: `Bearer ${authToken}`},
      });
      if (res.status === 401) {
        setToken('');
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setActionError('Failed to load admin overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchOverview(token);
    }
  }, [token, fetchOverview]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      if (configured === false) {
        if (passcode.length < 6) {
          throw new Error('Passcode must be at least 6 characters.');
        }
        if (passcode !== confirmPasscode) {
          throw new Error('Passcodes do not match.');
        }
        const setupRes = await fetch('/api/admin/setup', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({passcode}),
        });
        const setupJson = await setupRes.json();
        if (!setupRes.ok) {
          throw new Error(setupJson.error || 'Setup failed');
        }
        setConfigured(true);
        setToken(setupJson.token);
        setPasscode('');
        setConfirmPasscode('');
        return;
      }

      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({passcode}),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Invalid passcode');
      }
      setToken(json.token);
      setPasscode('');
    } catch (err: any) {
      setLoginError(err?.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const adminFetch = async (url: string, method: string, body?: object) => {
    setActionError('');
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Request failed');
      await fetchOverview(token);
    } catch (err: any) {
      setActionError(err?.message || 'Action failed');
    }
  };

  const handleLogout = () => {
    setToken('');
    setData(null);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-xl space-y-5">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-white">
              {configured === false ? 'Claim NattuHub Admin Access' : 'NattuHub Admin Access'}
            </h1>
            <p className="text-xs text-slate-400">
              {configured === false
                ? 'Set your initial admin passcode to protect moderation and the ad ledger.'
                : 'Restricted moderation, Ad promotion UPI verification, and revenue ledger.'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                {configured === false ? 'Create Admin Passcode' : 'Admin Passcode'}
              </label>
              <input
                type="password"
                required
                minLength={configured === false ? 6 : 1}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder={configured === false ? 'Minimum 6 characters' : 'Enter passcode'}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            {configured === false && (
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Confirm Admin Passcode
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  placeholder="Re-enter passcode"
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>
            )}

            {loginError && <p className="text-xs font-medium text-rose-400">{loginError}</p>}

            <button
              type="submit"
              disabled={loggingIn || configured === null}
              className="w-full py-2.5 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loggingIn
                ? 'Verifying...'
                : configured === false
                ? 'Set Passcode & Open Admin'
                : 'Sign In to Admin'}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 text-center">
            <a href="/" className="text-xs text-slate-400 hover:text-white underline">
              Return to Public Marketplace
            </a>
          </div>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const filteredListings = (data?.listings || []).filter(
    (l) => l.status !== 'removed' && (modFilter === 'all' || l.status === modFilter)
  );
  const filteredNeeds = (data?.needs || []).filter(
    (n) => n.status !== 'removed' && (modFilter === 'all' || n.status === modFilter)
  );

  const verifiedPromos = (data?.promotions || []).filter((p) => p.status === 'Approved');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Admin Top Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
              NattuHub Admin
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">/ Moderation &amp; Ledger</span>
          </div>

          <nav className="flex items-center gap-5 text-sm font-medium overflow-x-auto">
            {(
              [
                ['overview', 'Overview & Ad Revenue'],
                ['moderation', 'Listings & Needs'],
                ['screenshots', 'Ad Promos & Meetups'],
                ['users_ads', 'Users & Sponsors'],
              ] as [AdminTab, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  tab === key
                    ? 'border-teal-500 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/"
              className="text-xs font-medium text-slate-400 hover:text-white whitespace-nowrap hidden md:inline"
            >
              Public Store
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {actionError && (
          <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-lg text-xs text-rose-200">
            {actionError}
          </div>
        )}

        {loading && !data ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-sm text-slate-400">
            Loading marketplace records...
          </div>
        ) : (
          <>
            {/* 8 Summary Stats Grid */}
            {stats && (
              <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {label: 'Rental Listings', value: stats.rentalListings, prefix: ''},
                  {label: 'Sale Listings', value: stats.saleListings, prefix: ''},
                  {label: 'Need Requests', value: stats.needRequests, prefix: ''},
                  {
                    label: 'Pending Approvals',
                    value: stats.pendingApprovals,
                    prefix: '',
                    highlight: stats.pendingApprovals > 0,
                  },
                  {label: 'Direct Meetups', value: stats.bookingsCount, prefix: ''},
                  {
                    label: 'Pending Promo Proofs',
                    value: stats.pendingScreenshots,
                    prefix: '',
                    highlight: stats.pendingScreenshots > 0,
                  },
                  {
                    label: 'Featured Listings',
                    value: (data?.listings || []).filter((l) => l.isPromoted && l.status !== 'removed').length,
                    prefix: '',
                  },
                  {label: 'Ad Promo Revenue', value: stats.promotionRevenue, prefix: '₹'},
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-1"
                  >
                    <p className="text-xs text-slate-400">{kpi.label}</p>
                    <p
                      className={`text-2xl font-bold font-mono tabular-nums ${
                        kpi.highlight ? 'text-amber-400' : 'text-white'
                      }`}
                    >
                      {kpi.prefix}
                      {kpi.value.toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </section>
            )}

            {/* Tab 1: Overview & Ad Revenue Ledger */}
            {tab === 'overview' && (
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-white">
                      Promotion Revenue Ledger (UPI Boosts)
                    </h2>
                    <span className="text-xs font-mono font-semibold text-teal-400 tabular-nums">
                      Total: ₹{(stats?.promotionRevenue || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-2.5 font-medium">Listing &amp; Plan</th>
                          <th className="px-4 py-2.5 font-medium">Owner</th>
                          <th className="px-4 py-2.5 font-medium text-right">Ad Fee</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {verifiedPromos.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                              No approved promotions yet.
                            </td>
                          </tr>
                        ) : (
                          verifiedPromos.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-950/60">
                              <td className="px-4 py-2.5">
                                <p className="font-medium text-slate-100 truncate max-w-[210px]">
                                  {p.listingTitle}
                                </p>
                                <p className="text-slate-400">{p.planLabel}</p>
                              </td>
                              <td className="px-4 py-2.5 text-slate-400">
                                {p.ownerName} · {p.ownerPhone}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold text-teal-400">
                                ₹{p.feeAmount.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-white">
                      Direct Customer Meetup Requests
                    </h2>
                    <span className="text-xs font-mono font-semibold text-slate-300 tabular-nums">
                      Total: {(data?.bookings || []).length}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-2.5 font-medium">Item / Customer</th>
                          <th className="px-4 py-2.5 font-medium">Meetup / Drop</th>
                          <th className="px-4 py-2.5 font-medium text-right">Est. Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {(data?.bookings || []).length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                              No direct customer meetup requests yet.
                            </td>
                          </tr>
                        ) : (
                          (data?.bookings || []).slice(0, 8).map((b) => (
                            <tr key={b.id} className="hover:bg-slate-950/60">
                              <td className="px-4 py-2.5">
                                <p className="font-medium text-slate-100 truncate max-w-[180px]">
                                  {b.listingTitle}
                                </p>
                                <p className="text-slate-400">
                                  {b.customerName} ({b.customerPhone})
                                </p>
                              </td>
                              <td className="px-4 py-2.5 text-slate-300 truncate max-w-[160px]">
                                {b.usageOrDropLocation}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono tabular-nums text-teal-400">
                                ₹{b.baseAmount.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* Tab 2: Approvals & Moderation (Rentals, Sales, Needs) */}
            {tab === 'moderation' && (
              <section className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="text-base font-bold text-white">
                    Listings &amp; Need Requests Moderation
                  </h2>
                  <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setModFilter(f)}
                        className={`px-3 py-1 text-xs font-medium rounded-md capitalize cursor-pointer ${
                          modFilter === f ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rental & Sale Listings */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-800 text-xs font-semibold text-slate-300">
                    Rental &amp; Sale Listings ({filteredListings.length})
                  </div>
                  <div className="divide-y divide-slate-800">
                    {filteredListings.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <img
                            src={item.photoUrl}
                            alt={item.title}
                            className="w-16 h-12 object-cover rounded border border-slate-700 shrink-0 bg-slate-950"
                          />
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <span className="font-medium text-slate-200">
                                {item.listingType === 'rent'
                                  ? item.ownerType === 'shop'
                                    ? 'Rent - Shop'
                                    : 'Rent - Home'
                                  : 'Sale'}
                              </span>
                              <span>·</span>
                              <span className="capitalize font-medium">{item.status}</span>
                              {item.isPromoted && (
                                <>
                                  <span>·</span>
                                  <span className="text-amber-400 font-semibold">Featured</span>
                                </>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-white truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-400 font-mono tabular-nums">
                              ₹{item.price.toLocaleString('en-IN')} · {item.pickupLocation} ·{' '}
                              {item.ownerName} ({item.ownerPhone})
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {item.status !== 'approved' && (
                            <button
                              type="button"
                              onClick={() =>
                                adminFetch(`/api/admin/listings/${item.id}`, 'PATCH', {
                                  status: 'approved',
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-teal-600 text-white rounded hover:bg-teal-500 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approve
                            </button>
                          )}
                          {item.status !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() =>
                                adminFetch(`/api/admin/listings/${item.id}`, 'PATCH', {
                                  status: 'rejected',
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-800 text-slate-200 rounded hover:bg-slate-700 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              adminFetch(`/api/admin/listings/${item.id}`, 'PATCH', {
                                isPromoted: !item.isPromoted,
                              })
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded cursor-pointer border ${
                              item.isPromoted
                                ? 'border-amber-600/60 bg-amber-950/60 text-amber-300'
                                : 'border-slate-700 bg-slate-950 text-slate-300'
                            }`}
                          >
                            <Star className="w-3.5 h-3.5" />
                            {item.isPromoted ? 'Unfeature' : 'Feature'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              adminFetch(`/api/admin/listings/${item.id}`, 'PATCH', {
                                status: 'removed',
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Need Requests Moderation */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-800 text-xs font-semibold text-slate-300">
                    Needed Item Requests ({filteredNeeds.length})
                  </div>
                  <div className="divide-y divide-slate-800">
                    {filteredNeeds.map((need) => (
                      <div
                        key={need.id}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="font-medium text-teal-400">
                              Need ({need.needType})
                            </span>
                            <span>·</span>
                            <span className="capitalize font-medium">{need.status}</span>
                          </div>
                          <p className="text-sm font-semibold text-white">{need.title}</p>
                          <p className="text-xs text-slate-400 font-mono">
                            Budget ₹{need.budget.toLocaleString('en-IN')} · {need.location} ·{' '}
                            {need.requesterName} ({need.requesterPhone})
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {need.status !== 'approved' && (
                            <button
                              type="button"
                              onClick={() =>
                                adminFetch(`/api/admin/needs/${need.id}`, 'PATCH', {
                                  status: 'approved',
                                })
                              }
                              className="px-2.5 py-1.5 text-xs font-medium bg-teal-600 text-white rounded hover:bg-teal-500 cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          {need.status !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() =>
                                adminFetch(`/api/admin/needs/${need.id}`, 'PATCH', {
                                  status: 'rejected',
                                })
                              }
                              className="px-2.5 py-1.5 text-xs font-medium bg-slate-800 text-slate-200 rounded hover:bg-slate-700 cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              adminFetch(`/api/admin/needs/${need.id}`, 'PATCH', {
                                status: 'removed',
                              })
                            }
                            className="px-2.5 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/50 rounded cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Tab 3: Ad Promotion Screenshots & Direct Meetup Requests */}
            {tab === 'screenshots' && (
              <section className="space-y-6">
                {/* Promotion Fee Screenshots (Only UPI Payment Flow) */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-800">
                    <h2 className="text-sm font-bold text-white">
                      Listing Promotion UPI Screenshots (Ad Boost Revenue)
                    </h2>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {(data?.promotions || []).map((p) => (
                      <div
                        key={p.id}
                        className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="font-mono">{p.id}</span>
                            <span>·</span>
                            <span
                              className={`font-semibold ${
                                p.status === 'Approved'
                                  ? 'text-teal-400'
                                  : p.status === 'Rejected'
                                  ? 'text-rose-400'
                                  : 'text-amber-400'
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-white">{p.listingTitle}</p>
                          <p className="text-xs text-slate-400 font-mono">
                            {p.planLabel} · ₹{p.feeAmount} · {p.ownerName} ({p.ownerPhone})
                            {p.upiRef ? ` · UTR: ${p.upiRef}` : ''}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setInspectImage({
                                title: `Promotion ${p.id} Screenshot`,
                                src: p.screenshotDataUrl,
                                meta: `${p.planLabel} (₹${p.feeAmount}) · ${p.screenshotSizeKb} KB`,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Inspect Screenshot
                          </button>

                          {p.status === 'Pending Verification' && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  adminFetch(`/api/admin/promotions/${p.id}`, 'PATCH', {
                                    status: 'Approved',
                                  })
                                }
                                className="px-2.5 py-1.5 text-xs font-medium bg-teal-600 text-white rounded hover:bg-teal-500 cursor-pointer"
                              >
                                Approve &amp; Boost
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  adminFetch(`/api/admin/promotions/${p.id}`, 'PATCH', {
                                    status: 'Rejected',
                                  })
                                }
                                className="px-2.5 py-1.5 text-xs font-medium bg-rose-950/60 text-rose-300 border border-rose-800/50 rounded hover:bg-rose-900/60 cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Direct Meetup Requests */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-800">
                    <h2 className="text-sm font-bold text-white">
                      Direct Customer-to-Owner Meetup Requests
                    </h2>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {(data?.bookings || []).map((b) => (
                      <div
                        key={b.id}
                        className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span className="font-mono text-slate-300">{b.id}</span>
                            <span>·</span>
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
                            <span>·</span>
                            <span>Status: {b.fulfillmentStatus}</span>
                          </div>
                          <p className="text-sm font-semibold text-white">{b.listingTitle}</p>
                          <p className="text-xs text-slate-400">
                            Customer: {b.customerName} ({b.customerPhone}) · Pickup:{' '}
                            {b.pickupLocation} · Meetup/Drop: {b.usageOrDropLocation}
                          </p>
                          <p className="text-xs font-mono tabular-nums text-slate-200">
                            Est. Value: ₹{b.baseAmount.toLocaleString('en-IN')} · 0% Platform Fee
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {b.screenshotDataUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setInspectImage({
                                  title: `Legacy Record ${b.id}`,
                                  src: b.screenshotDataUrl || '',
                                  meta: `Amount ₹${b.baseAmount}`,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Proof
                            </button>
                          )}

                          <select
                            value={b.fulfillmentStatus}
                            onChange={(e) =>
                              adminFetch(`/api/admin/bookings/${b.id}`, 'PATCH', {
                                fulfillmentStatus: e.target.value,
                              })
                            }
                            className="px-2.5 py-1.5 text-xs border border-slate-700 rounded bg-slate-950 text-slate-100"
                          >
                            <option value="Confirmed">Confirmed</option>
                            <option value="Picked Up">Picked Up</option>
                            <option value="Returned">Returned</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Tab 4: Blocked Users & Local Sponsor Ad Slots */}
            {tab === 'users_ads' && (
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Blocking */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <h2 className="text-sm font-bold text-white">
                      User Phone Moderation &amp; Blocking
                    </h2>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await adminFetch('/api/admin/block-user', 'POST', {
                        phone: blockPhone,
                        reason: blockReason || 'Fake payment screenshot / Policy violation',
                      });
                      setBlockPhone('');
                      setBlockReason('');
                    }}
                    className="space-y-2.5"
                  >
                    <input
                      type="tel"
                      required
                      value={blockPhone}
                      onChange={(e) => setBlockPhone(e.target.value)}
                      placeholder="10-digit phone number to block"
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg font-mono"
                    />
                    <input
                      type="text"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="Reason (e.g. Fake UPI screenshot)"
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-500 cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Block User Phone
                    </button>
                  </form>

                  <div className="border-t border-slate-800 pt-3 space-y-2">
                    <p className="text-xs font-semibold text-slate-300">
                      Blocked Numbers ({data?.blockedUsers.length || 0})
                    </p>
                    {(data?.blockedUsers || []).length === 0 ? (
                      <p className="text-xs text-slate-500">No blocked users.</p>
                    ) : (
                      data?.blockedUsers.map((u) => (
                        <div
                          key={u.phone}
                          className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs"
                        >
                          <div>
                            <p className="font-mono font-semibold text-white">{u.phone}</p>
                            <p className="text-slate-400">{u.reason}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => adminFetch(`/api/admin/block-user/${u.phone}`, 'DELETE')}
                            className="px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 cursor-pointer"
                          >
                            Unblock
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Ad Monetization Slots */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <h2 className="text-sm font-bold text-white">
                    Ad Monetization Placements
                  </h2>
                  <div className="space-y-3">
                    {(data?.adSlots || []).map((ad) => (
                      <div key={ad.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">
                            {ad.sponsorName} ({ad.placement})
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              adminFetch(`/api/admin/ads/${ad.id}`, 'PATCH', {
                                active: !ad.active,
                              })
                            }
                            className={`px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${
                              ad.active
                                ? 'bg-teal-950/70 text-teal-300 border border-teal-700/60'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {ad.active ? 'Active' : 'Paused'}
                          </button>
                        </div>
                        <p className="text-xs text-slate-300">{ad.headline}</p>
                        <p className="text-[11px] text-slate-500">
                          CTA: {ad.ctaLabel} · {ad.locationTag}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Screenshot Inspection Lightbox */}
      {inspectImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setInspectImage(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">{inspectImage.title}</h3>
                <p className="text-xs text-slate-400 font-mono">{inspectImage.meta}</p>
              </div>
              <button
                type="button"
                onClick={() => setInspectImage(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex justify-center">
              <img
                src={inspectImage.src}
                alt={inspectImage.title}
                className="max-h-[65vh] object-contain rounded border border-slate-800 bg-slate-900"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
