import React, {useEffect, useState} from 'react';
import QRCode from 'qrcode';
import {Check, Copy} from 'lucide-react';

interface UpiQrBoxProps {
  amount: number;
  note: string;
  upiId?: string;
  merchantName?: string;
}

export const UpiQrBox: React.FC<UpiQrBoxProps> = ({
  amount,
  note,
  upiId = 'nattuhub@okaxis',
  merchantName = 'NattuHub',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    merchantName
  )}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(upiUri, {
      width: 180,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [upiUri]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-950 border border-slate-800 rounded-lg">
      {/* Keep QR square high-contrast white so camera scanners read reliably */}
      <div className="w-32 h-32 bg-white border border-slate-700 rounded-md flex items-center justify-center shrink-0 p-1.5">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`UPI QR for ₹${amount}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-xs text-slate-500">Generating QR</span>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
        <div>
          <p className="text-xs text-slate-400">Scan via GPay, PhonePe, or Paytm</p>
          <p className="text-lg font-semibold text-white font-mono tabular-nums">
            ₹{amount.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="flex items-center justify-center sm:justify-start gap-2">
          <code className="text-xs font-mono text-slate-200 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded">
            {upiId}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-teal-300 bg-teal-950/70 hover:bg-teal-900/70 border border-teal-700/60 rounded transition-colors cursor-pointer whitespace-nowrap"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy ID'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Upload the Ad Promotion UPI screenshot below. Your boost activates once verified.
        </p>
      </div>
    </div>
  );
};
