import React from 'react';
import {X} from 'lucide-react';

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({open, onClose}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-title"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 id="terms-title" className="text-base font-semibold text-white">
            Terms &amp; Conditions
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Terms"
            className="p-1.5 text-slate-400 hover:text-white rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 text-sm text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto">
          <p>
            <strong className="text-white">1. Direct Customer Meetup Platform:</strong>{' '}
            NattuHub acts strictly as a local discovery and direct meetup coordination platform connecting home owners, shops, buyers, and renters.
          </p>
          <p>
            <strong className="text-white">2. Condition Inspection at Handover:</strong>{' '}
            Both parties must physically inspect the item&apos;s working condition, accessories, and identity proof at pickup or sale handover before final payment or use.
          </p>
          <p>
            <strong className="text-white">3. Accurate Pickup &amp; Usage Locations:</strong>{' '}
            Accurate pickup, delivery, and usage/drop locations are mandatory for all listings, rentals, and needed requests.
          </p>
          <p>
            <strong className="text-white">4. Zero Commission &amp; Paid Ad Promotions:</strong>{' '}
            Customer-to-owner rentals and sales have 0% platform commission and are settled directly between both parties at meetup. Platform payments apply only to optional Paid Listing Promotions (Ad Boosts) and Sponsored Ads, verified via UPI screenshot and non-refundable once active.
          </p>
          <p>
            <strong className="text-white">5. Zero-Tolerance Fraud &amp; Blocking Policy:</strong>{' '}
            Submitting fake promotion UPI screenshots, false item details, or abusive behavior will result in immediate rejection and permanent phone number blocking.
          </p>
        </div>

        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
