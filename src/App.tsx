import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ClipboardList,
  Home,
  MapPin,
  Plus,
  Search,
  ShoppingBag,
  User,
  Wrench,
} from 'lucide-react';
import {
  ActionMode,
  AdSlot,
  AppPage,
  Listing,
  NeedRequest,
  UserAccount,
  UserActivity,
} from './types';
import {ListingCard} from './components/ListingCard';
import {ListingDetailModal} from './components/ListingDetailModal';
import {PostListingForm} from './components/PostListingForm';
import {NeedSection} from './components/NeedSection';
import {TermsModal} from './components/TermsModal';
import {AuthModal} from './components/AuthModal';
import {CenterUploadSheet} from './components/CenterUploadSheet';
import {OrdersView} from './components/OrdersView';
import {ProfileView} from './components/ProfileView';
import {AdminPage} from './pages/AdminPage';

const CATEGORIES = [
  'All',
  'Tools & Hardware',
  'Cameras & Audio',
  'Electronics',
  'Furniture',
  'Vehicles & Cycles',
  'Events & Party',
  'Home Appliances',
  'Other',
];

export default function App() {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return <AdminPage />;
  }

  return <PublicMarketplace />;
}

function PublicMarketplace() {
  const [activePage, setActivePage] = useState<AppPage>('home');
  const [homeSection, setHomeSection] = useState<'all' | 'rent' | 'sale'>('all');
  const [uploadFormMode, setUploadFormMode] = useState<'rent' | 'sale' | null>(null);
  const [needDefaultOpen, setNeedDefaultOpen] = useState(false);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);

  const [listings, setListings] = useState<Listing[]>([]);
  const [needs, setNeeds] = useState<NeedRequest[]>([]);
  const [adSlots, setAdSlots] = useState<AdSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Search & filters on Home
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [rentOwnerFilter, setRentOwnerFilter] = useState<'all' | 'home' | 'shop'>('all');

  // User Session & Activity (kept in React memory)
  const [userToken, setUserToken] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedTab, setSelectedTab] = useState<'action' | 'promote'>('action');
  const [termsOpen, setTermsOpen] = useState(false);

  const handleLogout = async () => {
    if (userToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {Authorization: `Bearer ${userToken}`},
      }).catch(() => {});
    }
    setUserToken('');
    setCurrentUser(null);
    setUserActivity(null);
  };

  const fetchMarketplace = useCallback(async () => {
    setLoadError('');
    try {
      const headers: Record<string, string> = {};
      if (userToken) {
        headers.Authorization = `Bearer ${userToken}`;
      }
      const res = await fetch('/api/marketplace', {headers});
      if (!res.ok) throw new Error('Failed to load marketplace');
      const data = await res.json();
      setListings(data.listings || []);
      setNeeds(data.needs || []);
      setAdSlots(data.adSlots || []);
    } catch {
      setLoadError('Unable to load listings right now.');
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  const fetchUserActivity = useCallback(async () => {
    if (!userToken) {
      setUserActivity(null);
      return;
    }
    setLoadingActivity(true);
    try {
      const res = await fetch('/api/my-activity', {
        headers: {Authorization: `Bearer ${userToken}`},
      });
      if (res.ok) {
        const json = await res.json();
        setUserActivity(json);
      }
    } finally {
      setLoadingActivity(false);
    }
  }, [userToken]);

  useEffect(() => {
    fetchMarketplace();
  }, [fetchMarketplace]);

  useEffect(() => {
    fetchUserActivity();
  }, [fetchUserActivity]);

  const refreshAll = useCallback(() => {
    fetchMarketplace();
    fetchUserActivity();
  }, [fetchMarketplace, fetchUserActivity]);

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const loc = locationFilter.trim().toLowerCase();

    return listings.filter((item) => {
      if (homeSection !== 'all' && item.listingType !== homeSection) {
        return false;
      }
      if (
        homeSection === 'rent' &&
        rentOwnerFilter !== 'all' &&
        item.ownerType !== rentOwnerFilter
      ) {
        return false;
      }
      if (categoryFilter !== 'All' && item.category !== categoryFilter) {
        return false;
      }
      if (loc && !item.pickupLocation.toLowerCase().includes(loc)) {
        return false;
      }
      if (
        q &&
        !item.title.toLowerCase().includes(q) &&
        !item.description.toLowerCase().includes(q) &&
        !item.category.toLowerCase().includes(q) &&
        !item.pickupLocation.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [listings, homeSection, searchQuery, locationFilter, categoryFilter, rentOwnerFilter]);

  const topAd = adSlots.find((a) => a.placement === 'top_strip' && a.active);
  const nativeAd = adSlots.find((a) => a.placement === 'grid_native' && a.active);

  const navigateTo = (page: AppPage) => {
    setUploadFormMode(null);
    setNeedDefaultOpen(false);
    setActivePage(page);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleSelectUploadCategory = (mode: ActionMode) => {
    setUploadSheetOpen(false);
    if (mode === 'rent') {
      setUploadFormMode(null);
      setHomeSection('rent');
      setActivePage('home');
    } else if (mode === 'buy_sell') {
      setUploadFormMode('sale');
      setActivePage('home');
    } else if (mode === 'give') {
      setUploadFormMode('rent');
      setActivePage('home');
    } else if (mode === 'need') {
      setUploadFormMode(null);
      setNeedDefaultOpen(true);
      setActivePage('need');
    }
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const headerPageTitle = uploadFormMode
    ? uploadFormMode === 'sale'
      ? 'Sell Item · വിൽക്കാൻ'
      : 'Give / List · കൊടുക്കാൻ'
    : activePage === 'home'
      ? 'Home · ഹോം'
      : activePage === 'orders'
        ? 'Orders · ഓർഡർ'
        : activePage === 'need'
          ? 'Need · ആവശ്യക്കാരൻ'
          : currentUser
            ? 'Profile · പ്രൊഫൈൽ'
            : 'Login · ലോഗിൻ';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 pb-24">
      {/* Compact Mobile-App Top Header (Zero Admin Link) */}
      <header className="sticky top-0 z-30 h-12 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-3 sm:px-5 h-full flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              setHomeSection('all');
              navigateTo('home');
            }}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            NattuHub
          </button>

          <span className="text-xs font-medium text-slate-400 truncate">
            {headerPageTitle}
          </span>

          <button
            type="button"
            onClick={() => navigateTo('profile')}
            className="min-h-[34px] inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-200 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-5 h-5 rounded-full object-cover border border-teal-500/50"
              />
            ) : (
              <User className="w-3.5 h-3.5 text-teal-400" />
            )}
            <span>{currentUser ? currentUser.name.split(' ')[0] : 'Login'}</span>
          </button>
        </div>
      </header>

      {/* Main Mobile-App Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-5 pt-3.5 pb-6 space-y-4">
        {/* Upload Form View (Opened via Center + Button -> Buy/Sell or Give/List) */}
        {uploadFormMode ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setUploadFormMode(null)}
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 cursor-pointer"
              >
                &larr; Back to Home Feed
              </button>
              <span className="text-xs text-slate-400">
                {currentUser ? `Uploading as ID: ${currentUser.id}` : 'Guest Upload'}
              </span>
            </div>
            <PostListingForm
              key={`${uploadFormMode}-${currentUser?.id || 'guest'}`}
              defaultListingType={uploadFormMode}
              currentUser={currentUser}
              authToken={userToken}
              onOpenLogin={() => setAuthModalOpen(true)}
              onOpenTerms={() => setTermsOpen(true)}
              onSuccess={() => {
                refreshAll();
              }}
              onBackToHome={() => {
                setHomeSection('all');
                navigateTo('home');
              }}
            />
          </div>
        ) : activePage === 'home' ? (
          <>
            {/* Search & Locality Filter on Home */}
            <section className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="relative sm:col-span-7">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search uploaded items (washer, camera, laptop...)"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="relative sm:col-span-5">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="City / Locality"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Section Switcher on Home so All Uploaded Products Play/Display Here */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                  {(
                    [
                      ['all', 'All Items'],
                      ['rent', 'Rent / Take'],
                      ['sale', 'Buy / Sell'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setHomeSection(val)}
                      className={`min-h-[32px] px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                        homeSection === val
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {homeSection === 'rent' && (
                  <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                    {(
                      [
                        ['all', 'All'],
                        ['home', 'Home'],
                        ['shop', 'Shop'],
                      ] as const
                    ).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setRentOwnerFilter(val)}
                        className={`min-h-[30px] px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                          rentOwnerFilter === val
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Clean Non-Intrusive Local Ad Sponsor Strip */}
            {topAd && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] font-medium text-slate-500 shrink-0">Ad</span>
                  <span className="text-slate-700" aria-hidden="true">
                    ·
                  </span>
                  <p className="text-xs text-slate-300 truncate">
                    <strong className="text-white">{topAd.sponsorName}:</strong> {topAd.headline}
                  </p>
                </div>
                <a
                  href={topAd.targetUrl}
                  className="text-xs font-semibold text-teal-400 hover:underline whitespace-nowrap shrink-0"
                >
                  {topAd.ctaLabel}
                </a>
              </div>
            )}

            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`min-h-[34px] px-3 py-1 text-xs font-medium rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-slate-100 text-slate-950 border-slate-100'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Uploaded Products Feed Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="bg-slate-900 border border-slate-800 rounded-2xl h-60 animate-pulse"
                  />
                ))}
              </div>
            ) : loadError ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-sm text-rose-400">
                {loadError}
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                <p className="text-sm font-medium text-slate-300">
                  No matching uploaded items found.
                </p>
                <div className="flex items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setLocationFilter('');
                      setCategoryFilter('All');
                      setRentOwnerFilter('all');
                      setHomeSection('all');
                    }}
                    className="min-h-[40px] px-3.5 py-2 text-xs font-medium bg-slate-800 text-slate-200 rounded-xl hover:bg-slate-700 cursor-pointer"
                  >
                    Clear Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadSheetOpen(true)}
                    className="min-h-[40px] px-3.5 py-2 text-xs font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-500 cursor-pointer"
                  >
                    + Upload Item
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredListings.map((item) => (
                  <ListingCard
                    key={item.id}
                    listing={item}
                    onSelect={(l, t = 'action') => {
                      setSelectedListing(l);
                      setSelectedTab(t);
                    }}
                  />
                ))}

                {/* Clean Native Ad Slot Card in Grid */}
                {nativeAd && (
                  <aside
                    id="service-partner"
                    className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Sponsored</span>
                        <span className="truncate">{nativeAd.locationTag}</span>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                        <Wrench className="w-4 h-4 text-teal-400" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                        {nativeAd.sponsorName}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed line-clamp-3">
                        {nativeAd.headline}
                      </p>
                    </div>
                    <a
                      href={nativeAd.targetUrl}
                      className="inline-flex items-center justify-center min-h-[36px] px-3 py-1.5 text-xs font-semibold bg-slate-950 border border-slate-700 text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      {nativeAd.ctaLabel}
                    </a>
                  </aside>
                )}
              </div>
            )}
          </>
        ) : activePage === 'orders' ? (
          <OrdersView
            currentUser={currentUser}
            activity={userActivity}
            loading={loadingActivity}
            onOpenLogin={() => navigateTo('profile')}
            onRefresh={refreshAll}
          />
        ) : activePage === 'need' ? (
          <NeedSection
            key={`${currentUser?.id || 'guest'}-${needDefaultOpen ? 'open' : 'closed'}`}
            needs={needs}
            currentUser={currentUser}
            authToken={userToken}
            defaultShowForm={needDefaultOpen}
            onOpenTerms={() => setTermsOpen(true)}
            onRefresh={refreshAll}
          />
        ) : (
          <ProfileView
            currentUser={currentUser}
            authToken={userToken}
            activity={userActivity}
            loadingActivity={loadingActivity}
            onAuthenticated={(token, user) => {
              setUserToken(token);
              setCurrentUser(user);
            }}
            onUserUpdated={(user) => {
              setCurrentUser(user);
              refreshAll();
            }}
            onLogout={handleLogout}
            onRefreshAll={refreshAll}
            onSelectListing={(l, t = 'action') => {
              setSelectedListing(l);
              setSelectedTab(t);
            }}
          />
        )}
      </main>

      {/* Clean Minimal Footer above Bottom Tab Bar (Zero Admin Link) */}
      <footer className="max-w-5xl w-full mx-auto px-3 sm:px-5 py-4 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-white">NattuHub</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">Home &amp; Shop Marketplace</span>
        </div>

        <button
          type="button"
          onClick={() => setTermsOpen(true)}
          className="font-medium text-slate-300 hover:text-white underline whitespace-nowrap shrink-0 cursor-pointer"
        >
          Terms &amp; Conditions
        </button>
      </footer>

      {/* Fixed Mobile-App Bottom Bar: Home · Orders · Center (+) Upload · Need · Login/Profile */}
      <nav
        aria-label="Mobile App Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 shadow-[0_-8px_28px_rgba(0,0,0,0.55)]"
      >
        <div className="max-w-2xl mx-auto px-2 sm:px-4 h-16 grid grid-cols-5 items-center">
          {/* Slot 1: Home */}
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
              activePage === 'home' && !uploadFormMode
                ? 'text-teal-400'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] sm:text-[11px] font-semibold leading-tight whitespace-nowrap">
              Home
            </span>
          </button>

          {/* Slot 2: Orders */}
          <button
            type="button"
            onClick={() => navigateTo('orders')}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
              activePage === 'orders'
                ? 'text-teal-400'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] sm:text-[11px] font-semibold leading-tight whitespace-nowrap">
              Orders
            </span>
          </button>

          {/* Slot 3: Center Plus (+) Upload / 4-Category Hub */}
          <div className="flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => setUploadSheetOpen(true)}
              aria-label="Open Upload and Categories Menu"
              className="w-12 h-12 -mt-5 rounded-full bg-teal-600 hover:bg-teal-500 text-white border-4 border-slate-950 shadow-lg shadow-teal-950/60 flex items-center justify-center transition-transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              <Plus className="w-6 h-6" />
            </button>
            <span className="text-[10px] font-semibold text-teal-400 mt-0.5 leading-tight whitespace-nowrap">
              Upload
            </span>
          </div>

          {/* Slot 4: Need */}
          <button
            type="button"
            onClick={() => navigateTo('need')}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
              activePage === 'need'
                ? 'text-teal-400'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-[10px] sm:text-[11px] font-semibold leading-tight whitespace-nowrap">
              Need
            </span>
          </button>

          {/* Slot 5: Login / Profile */}
          <button
            type="button"
            onClick={() => navigateTo('profile')}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
              activePage === 'profile'
                ? 'text-teal-400'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className={`w-5 h-5 rounded-full object-cover border ${
                  activePage === 'profile' ? 'border-teal-400' : 'border-slate-600'
                }`}
              />
            ) : (
              <User className="w-5 h-5" />
            )}
            <span className="text-[10px] sm:text-[11px] font-semibold leading-tight whitespace-nowrap">
              {currentUser ? 'Profile' : 'Login'}
            </span>
          </button>
        </div>
      </nav>

      {/* Center (+) Upload & 4 Categories Sheet */}
      <CenterUploadSheet
        open={uploadSheetOpen}
        currentUser={currentUser}
        activity={userActivity}
        onClose={() => setUploadSheetOpen(false)}
        onSelectCategory={handleSelectUploadCategory}
        onOpenProfile={() => {
          setUploadSheetOpen(false);
          navigateTo('profile');
        }}
      />

      {/* Detail / Rent / Buy / Boost Modal */}
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          initialTab={selectedTab}
          currentUser={currentUser}
          authToken={userToken}
          onClose={() => setSelectedListing(null)}
          onOpenTerms={() => setTermsOpen(true)}
          onSuccessRefresh={refreshAll}
        />
      )}

      {/* Quick Auth Modal (triggered from Upload Form if needed) */}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={(token, user) => {
          setUserToken(token);
          setCurrentUser(user);
        }}
      />

      {/* Terms & Conditions Modal */}
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
    </div>
  );
}
