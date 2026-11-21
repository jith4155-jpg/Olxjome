import React, {useState} from 'react';
import {Home, Lock, Store, X} from 'lucide-react';
import {OwnerType, UserAccount} from '../types';

interface AuthModalProps {
  open: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onAuthenticated: (token: string, user: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  initialMode = 'login',
  onClose,
  onAuthenticated,
}) => {
  const [authTab, setAuthTab] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<OwnerType>('home');
  const [shopName, setShopName] = useState('');
  const [location, setLocation] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const endpoint = authTab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        authTab === 'login'
          ? {phone, password}
          : {name, phone, password, accountType, shopName, location};

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      onAuthenticated(data.token, data.user);
      setPassword('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-400" />
            <h2 id="auth-modal-title" className="text-base font-bold text-white">
              {authTab === 'login' ? 'Sign In (ലോഗിൻ)' : 'Create Account (രജിസ്റ്റർ)'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setAuthTab('login');
                setError('');
              }}
              className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                authTab === 'login' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Login (ലോഗിൻ)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('register');
                setError('');
              }}
              className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                authTab === 'register' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              New Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {authTab === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAccountType('home')}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium cursor-pointer ${
                      accountType === 'home'
                        ? 'border-teal-500 bg-teal-950/60 text-teal-300'
                        : 'border-slate-700 bg-slate-950 text-slate-300'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5 shrink-0" />
                    <span>Home / User</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('shop')}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium cursor-pointer ${
                      accountType === 'shop'
                        ? 'border-amber-500 bg-amber-950/50 text-amber-300'
                        : 'border-slate-700 bg-slate-950 text-slate-300'
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rajesh Nair"
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {accountType === 'shop' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Shop Name
                    </label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="e.g. Metro Hardware Hire"
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Edappally, Kochi"
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
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
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {error && <p className="text-xs font-medium text-rose-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting
                ? 'Please wait...'
                : authTab === 'login'
                ? 'Sign In (ലോഗിൻ)'
                : 'Create Account & Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
