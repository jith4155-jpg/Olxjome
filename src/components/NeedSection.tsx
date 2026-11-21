import React, {useState} from 'react';
import {CheckCircle2, Clock, MapPin, MessageSquarePlus, Phone} from 'lucide-react';
import {NeedRequest, OwnerType, UserAccount} from '../types';
import {CompressedImageUpload} from './CompressedImageUpload';

interface NeedSectionProps {
  needs: NeedRequest[];
  currentUser?: UserAccount | null;
  authToken?: string;
  defaultShowForm?: boolean;
  onOpenTerms: () => void;
  onRefresh: () => void;
}

export const NeedSection: React.FC<NeedSectionProps> = ({
  needs,
  currentUser,
  authToken,
  defaultShowForm = false,
  onOpenTerms,
  onRefresh,
}) => {
  const [showForm, setShowForm] = useState(defaultShowForm);

  // Post Need form state
  const [title, setTitle] = useState('');
  const [needType, setNeedType] = useState<'rent' | 'buy'>('rent');
  const [category, setCategory] = useState('Tools & Hardware');
  const [location, setLocation] = useState(currentUser?.location || '');
  const [durationOrTimeline, setDurationOrTimeline] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoSizeKb, setPhotoSizeKb] = useState(0);
  const [requesterName, setRequesterName] = useState(currentUser?.name || '');
  const [requesterPhone, setRequesterPhone] = useState(currentUser?.phone || '');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState('');
  const [formErr, setFormErr] = useState('');

  // Respond modal/inline state
  const [activeRespondId, setActiveRespondId] = useState<string | null>(null);
  const [responderName, setResponderName] = useState(currentUser?.name || '');
  const [responderPhone, setResponderPhone] = useState(currentUser?.phone || '');
  const [responderType, setResponderType] = useState<OwnerType>(currentUser?.accountType || 'home');
  const [offerPrice, setOfferPrice] = useState('');
  const [responderLocation, setResponderLocation] = useState(currentUser?.location || '');
  const [message, setMessage] = useState('');
  const [respTerms, setRespTerms] = useState(false);
  const [respErr, setRespErr] = useState('');
  const [respSaving, setRespSaving] = useState(false);

  const handlePostNeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr('');
    setFormMsg('');
    setSubmitting(true);
    try {
      const headers: Record<string, string> = {'Content-Type': 'application/json'};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const res = await fetch('/api/needs', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title,
          needType,
          category,
          location,
          durationOrTimeline,
          budget: Number(budget),
          notes,
          photoUrl: photoUrl || undefined,
          photoSizeKb: photoSizeKb || undefined,
          requesterName,
          requesterPhone,
          termsAccepted,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not post request.');

      setFormMsg(data.message || 'Need request submitted for Admin approval.');
      setTitle('');
      setLocation(currentUser?.location || '');
      setDurationOrTimeline('');
      setBudget('');
      setNotes('');
      setPhotoUrl('');
      setPhotoSizeKb(0);
      setTermsAccepted(false);
      onRefresh();
    } catch (err: any) {
      setFormErr(err?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespondSubmit = async (e: React.FormEvent, needId: string) => {
    e.preventDefault();
    setRespErr('');
    setRespSaving(true);
    try {
      const headers: Record<string, string> = {'Content-Type': 'application/json'};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const res = await fetch(`/api/needs/${needId}/respond`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          responderName,
          responderPhone,
          responderType,
          offerPrice: Number(offerPrice),
          location: responderLocation,
          message,
          termsAccepted: respTerms,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send response.');
      setActiveRespondId(null);
      setResponderName(currentUser?.name || '');
      setResponderPhone(currentUser?.phone || '');
      setOfferPrice('');
      setResponderLocation(currentUser?.location || '');
      setMessage('');
      setRespTerms(false);
      onRefresh();
    } catch (err: any) {
      setRespErr(err?.message || 'Unable to respond.');
    } finally {
      setRespSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div>
          <h2 className="text-lg font-bold text-white">
            Needed Items Board (ആവശ്യക്കാരൻ)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Post what you need to rent or buy locally. Nearby homes and shops can respond directly.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm);
            setFormMsg('');
            setFormErr('');
          }}
          className="px-4 py-2 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          {showForm ? 'Close Request Form' : '+ Post What You Need'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handlePostNeed}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 max-w-3xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">Post a Looking For / Needed Request</h3>
            <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setNeedType('rent')}
                className={`px-3 py-1 text-xs font-medium rounded cursor-pointer ${
                  needType === 'rent' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'
                }`}
              >
                Need to Rent
              </button>
              <button
                type="button"
                onClick={() => setNeedType('buy')}
                className={`px-3 py-1 text-xs font-medium rounded cursor-pointer ${
                  needType === 'buy' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'
                }`}
              >
                Need to Buy
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Item Needed <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Need 10-step Ladder for 1 day or Used Study Table"
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
                <option value="Tools & Hardware">Tools &amp; Hardware</option>
                <option value="Cameras & Audio">Cameras &amp; Audio</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Events & Party">Events &amp; Party</option>
                <option value="Vehicles & Cycles">Vehicles &amp; Cycles</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Budget (₹) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 500"
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Location <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Kakkanad, Kochi"
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Duration / When Needed
              </label>
              <input
                type="text"
                value={durationOrTimeline}
                onChange={(e) => setDurationOrTimeline(e.target.value)}
                placeholder="e.g. This weekend (2 days)"
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Your Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Contact Phone <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                required
                value={requesterPhone}
                onChange={(e) => setRequesterPhone(e.target.value)}
                placeholder="10-digit mobile"
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-200 mb-1">Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific size, model, or pickup preference..."
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="sm:col-span-2">
              <CompressedImageUpload
                label="Reference Photo (Optional)"
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
              className="mt-0.5 rounded border-slate-600 bg-slate-950 text-teal-500"
            />
            <span>
              I accept the{' '}
              <button
                type="button"
                onClick={onOpenTerms}
                className="text-teal-400 underline font-medium cursor-pointer"
              >
                Terms &amp; Conditions
              </button>
              .
            </span>
          </label>

          {formErr && <p className="text-xs font-medium text-rose-400">{formErr}</p>}
          {formMsg && (
            <p className="text-xs font-medium text-teal-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {formMsg}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-500 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Post Request'}
            </button>
          </div>
        </form>
      )}

      {/* Approved Need Requests Grid */}
      {needs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-sm text-slate-400">
          No open needed requests right now. Post the first one above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {needs.map((need) => (
            <article
              key={need.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-teal-400">
                    {need.needType === 'rent' ? 'Needed for Rent' : 'Looking to Buy'}
                  </span>
                  <span>{need.category}</span>
                </div>

                <div className="flex items-start gap-3">
                  {need.photoUrl && (
                    <img
                      src={need.photoUrl}
                      alt={need.title}
                      className="w-20 h-16 object-cover rounded-md border border-slate-700 shrink-0"
                    />
                  )}
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-base font-semibold text-white leading-snug">
                      {need.title}
                    </h3>
                    <p className="text-sm text-slate-300">{need.notes}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 pt-1">
                  <span className="font-semibold text-white font-mono tabular-nums">
                    Budget: ₹{need.budget.toLocaleString('en-IN')}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {need.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {need.durationOrTimeline}
                  </span>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {need.requesterName} · +91 {need.requesterPhone}
                  </span>
                </div>
              </div>

              {/* Responses from Owners / Shops */}
              {need.responses.length > 0 && (
                <div className="border-t border-slate-800 pt-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-300">
                    Offers Received ({need.responses.length})
                  </p>
                  <div className="space-y-2">
                    {need.responses.map((resp) => (
                      <div key={resp.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                        <div className="flex items-center justify-between font-medium text-white">
                          <span>
                            {resp.responderName} ({resp.responderType === 'shop' ? 'Shop' : 'Home'})
                          </span>
                          <span className="font-mono tabular-nums text-teal-400">
                            ₹{resp.offerPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-slate-300 mt-1">{resp.message}</p>
                        <p className="text-slate-400 mt-1 font-mono">
                          {resp.location} · +91 {resp.responderPhone}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Respond Action */}
              <div className="border-t border-slate-800 pt-3">
                {activeRespondId === need.id ? (
                  <form
                    onSubmit={(e) => handleRespondSubmit(e, need.id)}
                    className="space-y-3 bg-slate-950 p-3 rounded-lg border border-slate-800"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        required
                        value={responderName}
                        onChange={(e) => setResponderName(e.target.value)}
                        placeholder="Your Name / Shop Name"
                        className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded"
                      />
                      <input
                        type="tel"
                        required
                        value={responderPhone}
                        onChange={(e) => setResponderPhone(e.target.value)}
                        placeholder="10-digit mobile"
                        className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded font-mono"
                      />
                      <select
                        value={responderType}
                        onChange={(e) => setResponderType(e.target.value as OwnerType)}
                        className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 text-slate-100 rounded"
                      >
                        <option value="home">Home Owner / Seller</option>
                        <option value="shop">Local Shop</option>
                      </select>
                      <input
                        type="number"
                        required
                        min={1}
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                        placeholder="Offer ₹"
                        className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded font-mono"
                      />
                    </div>
                    <input
                      type="text"
                      required
                      value={responderLocation}
                      onChange={(e) => setResponderLocation(e.target.value)}
                      placeholder="Pickup location"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded"
                    />
                    <input
                      type="text"
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Item details & availability"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded"
                    />
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={respTerms}
                        onChange={(e) => setRespTerms(e.target.checked)}
                      />
                      <span>Accept Terms &amp; Conditions</span>
                    </label>
                    {respErr && <p className="text-xs text-rose-400">{respErr}</p>}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveRespondId(null)}
                        className="px-3 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={respSaving}
                        className="px-3 py-1 text-xs font-semibold bg-teal-600 text-white rounded hover:bg-teal-500 cursor-pointer"
                      >
                        {respSaving ? 'Sending...' : 'Send Offer'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRespondId(need.id);
                      setRespErr('');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 cursor-pointer"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    <span>I Have This Item — Respond</span>
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
