import React, {useEffect, useState} from 'react';
import {
  Camera,
  CheckCircle2,
  Home,
  Lock,
  LogOut,
  MapPin,
  Package,
  Phone,
  Save,
  Store,
  Trash2,
  User,
} from 'lucide-react';
import {Listing, OwnerType, UserAccount, UserActivity} from '../types';
import {CompressedImageUpload} from './CompressedImageUpload';

interface ProfileViewProps {
  currentUser: UserAccount | null;
  authToken: string;
  activity: UserActivity | null;
  loadingActivity: boolean;
  onAuthenticated: (token: string, user: UserAccount) => void;
  onUserUpdated: (user: UserAccount) => void;
  onLogout: () => void;
  onRefreshAll: () => void;
  onSelectListing: (listing: Listing, tab?: 'action' | 'promote') => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  authToken,
  activity,
  loadingActivity,
  onAuthenticated,
  onUserUpdated,
  onLogout,
  onRefreshAll,
  onSelectListing,
}) => {
  // Login / Register state
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [regName, setRegName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [regAccountType, setRegAccountType] = useState<OwnerType>('home');
  const [regShopName, setRegShopName] = useState('');
  const [regLocation, setRegLocation] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authErr, setAuthErr] = useState('');

  // Logged-in Profile Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editLocation, setEditLocation] = useState(currentUser?.location || '');
  const [editAccountType, setEditAccountType] = useState<OwnerType>(
    currentUser?.accountType || 'home'
  );
  const [editShopName, setEditShopName] = useState(currentUser?.shopName || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [editAvatarSizeKb, setEditAvatarSizeKb] = useState(currentUser?.avatarSizeKb || 0);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  // Uploaded Products / Needs Tab
  const [uploadsTab, setUploadsTab] = useState<'products' | 'needs'>('products');

  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditLocation(currentUser.location);
      setEditAccountType(currentUser.accountType);
      setEditShopName(currentUser.shopName || '');
      setEditBio(currentUser.bio || '');
      setEditAvatarUrl(currentUser.avatarUrl || '');
      setEditAvatarSizeKb(currentUser.avatarSizeKb || 0);
    }
  }, [currentUser]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErr('');
    setAuthSubmitting(true);
    try {
      const endpoint = authTab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        authTab === 'login'
          ? {phone, password}
          : {
              name: regName,
              phone,
              password,
              accountType: regAccountType,
              shopName: regShopName,
              location: regLocation,
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed.');
      onAuthenticated(data.token, data.user);
      setPassword('');
    } catch (err: any) {
      setAuthErr(err?.message || 'Unable to sign in.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErr('');
    setProfileMsg('');
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: editName,
          location: editLocation,
          accountType: editAccountType,
          shopName: editAccountType === 'shop' ? editShopName : '',
          bio: editBio,
          avatarUrl: editAvatarUrl,
          avatarSizeKb: editAvatarSizeKb || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile.');
      onUserUpdated(data.user);
      setProfileMsg('Profile updated successfully.');
      setEditOpen(false);
    } catch (err: any) {
      setProfileErr(err?.message || 'Unable to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRemoveListing = async (listingId: string) => {
    const res = await fetch(`/api/my-listings/${listingId}`, {
      method: 'DELETE',
      headers: {Authorization: `Bearer ${authToken}`},
    });
    if (res.ok) {
      onRefreshAll();
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600/20 border border-teal-500/40 flex items-center justify-center">
            <Lock className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {authTab === 'login' ? 'Sign In (ലോഗിൻ)' : 'Create Account (രജിസ്റ്റർ)'}
            </h2>
            <p className="text-xs text-slate-400">
              Sign in to manage your profile photo, details, and uploaded products
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setAuthTab('login');
              setAuthErr('');
            }}
            className={`min-h-[38px] py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              authTab === 'login' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Login (ലോഗിൻ)
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab('register');
              setAuthErr('');
            }}
            className={`min-h-[38px] py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              authTab === 'register'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            New Account
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-3.5">
          {authTab === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRegAccountType('home')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer ${
                    regAccountType === 'home'
                      ? 'border-teal-500 bg-teal-950/60 text-teal-300'
                      : 'border-slate-800 bg-slate-950 text-slate-300'
                  }`}
                >
                  <Home className="w-3.5 h-3.5 shrink-0" />
                  <span>Home / User</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRegAccountType('shop')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer ${
                    regAccountType === 'shop'
                      ? 'border-amber-500 bg-amber-950/50 text-amber-300'
                      : 'border-slate-800 bg-slate-950 text-slate-300'
                  }`}
                >
                  <Store className="w-3.5 h-3.5 shrink-0" />
                  <span>Local Shop</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Rajesh Nair"
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {regAccountType === 'shop' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Shop Name</label>
                  <input
                    type="text"
                    value={regShopName}
                    onChange={(e) => setRegShopName(e.target.value)}
                    placeholder="e.g. Metro Hardware Hire"
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Locality / City <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regLocation}
                  onChange={(e) => setRegLocation(e.target.value)}
                  placeholder="e.g. Edappally, Kochi"
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              10-Digit Mobile Number <span className="text-rose-400">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98470XXXXX"
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password <span className="text-rose-400">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={authTab === 'register' ? 'Minimum 6 characters' : 'Enter your password'}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {authErr && <p className="text-xs font-medium text-rose-400">{authErr}</p>}

          <button
            type="submit"
            disabled={authSubmitting}
            className="w-full min-h-[44px] py-2.5 text-sm font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-500 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {authSubmitting
              ? 'Please wait...'
              : authTab === 'login'
                ? 'Sign In (ലോഗിൻ)'
                : 'Create Account & Sign In'}
          </button>
        </form>
      </div>
    );
  }

  const uploadedProducts = activity?.listings || [];
  const uploadedNeeds = activity?.needs || [];

  return (
    <div className="space-y-4">
      {/* Profile Identity Card with Avatar & Details */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => setEditOpen(!editOpen)}
              title="Upload / Change Photo"
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-950 border-2 border-teal-500/50 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer group"
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-teal-400" />
              )}
              <span className="absolute inset-x-0 bottom-0 bg-black/70 py-0.5 text-[10px] font-medium text-white flex items-center justify-center gap-1">
                <Camera className="w-2.5 h-2.5" />
                Photo
              </span>
            </button>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white truncate">
                  {currentUser.name}
                </h2>
                <span className="text-[11px] font-mono text-teal-300 bg-teal-950/70 border border-teal-700/50 px-2 py-0.5 rounded-md">
                  ID: {currentUser.id}
                </span>
              </div>

              {currentUser.shopName && (
                <p className="text-xs font-medium text-amber-400 truncate">
                  Shop: {currentUser.shopName}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3" />
                  +91 {currentUser.phone}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {currentUser.location}
                </span>
                <span>{currentUser.accountType === 'shop' ? 'Local Shop' : 'Home Account'}</span>
              </div>

              {currentUser.bio && (
                <p className="text-xs text-slate-300 pt-0.5">{currentUser.bio}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditOpen(!editOpen);
                setProfileMsg('');
                setProfileErr('');
              }}
              className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold bg-slate-950 border border-slate-700 text-slate-100 hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              {editOpen ? 'Close Editor' : 'Edit Profile & Photo'}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/50 border border-rose-800/50 hover:bg-rose-900/60 rounded-xl cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {profileMsg && (
          <p className="text-xs font-medium text-teal-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {profileMsg}
          </p>
        )}

        {/* Inline Profile Photo & Details Editor */}
        {editOpen && (
          <form
            onSubmit={handleSaveProfile}
            className="pt-4 border-t border-slate-800 space-y-4"
          >
            <CompressedImageUpload
              label="Profile Photo (പ്രൊഫൈൽ ഫോട്ടോ)"
              value={editAvatarUrl}
              sizeKb={editAvatarSizeKb}
              onChange={(url, kb) => {
                setEditAvatarUrl(url);
                setEditAvatarSizeKb(kb);
              }}
              onClear={() => {
                setEditAvatarUrl('');
                setEditAvatarSizeKb(0);
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  City / Locality <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Account Type
                </label>
                <select
                  value={editAccountType}
                  onChange={(e) => setEditAccountType(e.target.value as OwnerType)}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="home">Home / Individual</option>
                  <option value="shop">Local Shop</option>
                </select>
              </div>

              {editAccountType === 'shop' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Shop Name
                  </label>
                  <input
                    type="text"
                    value={editShopName}
                    onChange={(e) => setEditShopName(e.target.value)}
                    placeholder="Your shop name"
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Bio / Pickup Instructions
                </label>
                <input
                  type="text"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="e.g. Available after 5 PM near Edappally Toll"
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {profileErr && <p className="text-xs font-medium text-rose-400">{profileErr}</p>}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-500 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingProfile ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Uploaded Products Linked to This Account ID */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Uploaded Products &amp; Requests
            </h3>
            <p className="text-xs text-slate-400">
              Showing items uploaded from Account ID{' '}
              <span className="font-mono text-teal-400">{currentUser.id}</span>
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl self-start">
            <button
              type="button"
              onClick={() => setUploadsTab('products')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer ${
                uploadsTab === 'products' ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              Products ({uploadedProducts.length})
            </button>
            <button
              type="button"
              onClick={() => setUploadsTab('needs')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer ${
                uploadsTab === 'needs' ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              Need Requests ({uploadedNeeds.length})
            </button>
          </div>
        </div>

        {loadingActivity && !activity ? (
          <p className="text-sm text-slate-400 text-center py-6">Loading uploaded items...</p>
        ) : uploadsTab === 'products' ? (
          uploadedProducts.length === 0 ? (
            <div className="text-center py-6 space-y-1">
              <Package className="w-7 h-7 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">
                No products uploaded under ID {currentUser.id} yet.
              </p>
              <p className="text-xs text-slate-500">
                Tap the center + button below to upload an item for Rent or Sale.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploadedProducts.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-16 h-12 object-cover rounded-lg border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-slate-500" />
                      </div>
                    )}
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                      <p className="text-xs text-slate-300 font-mono">
                        ₹{item.price.toLocaleString('en-IN')}
                        {item.listingType === 'rent' ? '/day' : ''} ·{' '}
                        <span className="capitalize text-teal-400">{item.status}</span>
                        {item.isPromoted ? ' · Featured' : ''}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">
                        Product ID: {item.id} · Uploader ID: {item.ownerUserId || currentUser.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {item.status === 'approved' && (
                      <button
                        type="button"
                        onClick={() => onSelectListing(item, 'promote')}
                        className="px-2.5 py-1.5 text-xs font-medium bg-slate-900 border border-slate-700 text-teal-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                      >
                        Boost
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveListing(item.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-300 bg-rose-950/60 hover:bg-rose-900/70 border border-rose-800/50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : uploadedNeeds.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">
            No need requests posted under ID {currentUser.id} yet.
          </p>
        ) : (
          <div className="space-y-2.5">
            {uploadedNeeds.map((n) => (
              <div
                key={n.id}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500">
                    {n.id} · ID: {n.requesterUserId || currentUser.id}
                  </span>
                  <span className="capitalize font-semibold text-teal-400">{n.status}</span>
                </div>
                <p className="text-sm font-semibold text-white">{n.title}</p>
                <p className="text-xs text-slate-400 font-mono">
                  Budget ₹{n.budget.toLocaleString('en-IN')} · {n.responses.length} offer(s)
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
