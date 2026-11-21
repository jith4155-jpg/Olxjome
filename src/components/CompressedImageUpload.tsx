import React, {useRef, useState} from 'react';
import {ImagePlus, RefreshCw, X} from 'lucide-react';
import {compressImageToTarget, CompressedImageResult} from '../utils/imageCompress';

interface CompressedImageUploadProps {
  label: string;
  required?: boolean;
  value?: string;
  sizeKb?: number;
  onChange: (dataUrl: string, compressedKb: number) => void;
  onClear?: () => void;
  helperText?: string;
}

export const CompressedImageUpload: React.FC<CompressedImageUploadProps> = ({
  label,
  required = false,
  value,
  sizeKb,
  onChange,
  onClear,
  helperText = 'Auto-compressed in browser to 10KB–30KB',
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [stats, setStats] = useState<CompressedImageResult | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setCompressing(true);
    try {
      const result = await compressImageToTarget(file);
      setStats(result);
      onChange(result.dataUrl, result.compressedKb);
    } catch (err: any) {
      setError(err?.message || 'Could not compress image.');
    } finally {
      setCompressing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-200">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
        <span className="text-xs text-slate-400 font-mono tabular-nums">
          {stats
            ? `${stats.originalKb} KB -> ${stats.compressedKb} KB`
            : sizeKb
            ? `${sizeKb} KB`
            : helperText}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {!value ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={compressing}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-4 border border-dashed border-slate-700 rounded-lg bg-slate-950 hover:bg-slate-900 hover:border-teal-500 text-sm text-slate-300 transition-colors cursor-pointer"
        >
          {compressing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
              <span>Compressing to 10KB–30KB...</span>
            </>
          ) : (
            <>
              <ImagePlus className="w-4 h-4 text-teal-400" />
              <span>Choose photo (auto-compressed to 10–30 KB)</span>
            </>
          )}
        </button>
      ) : (
        <div className="flex items-center gap-3 p-2.5 border border-slate-700 rounded-lg bg-slate-950">
          <img
            src={value}
            alt="Compressed preview"
            className="w-16 h-12 object-cover rounded border border-slate-700 shrink-0 bg-slate-900"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-100 truncate">
              Ready for fast upload
            </p>
            <p className="text-xs text-teal-400 font-mono tabular-nums">
              {stats
                ? `Compressed: ${stats.compressedKb} KB (${stats.width}x${stats.height})`
                : `Compressed: ${sizeKb ?? '~20'} KB`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer whitespace-nowrap"
            >
              Replace
            </button>
            {onClear && (
              <button
                type="button"
                onClick={() => {
                  setStats(null);
                  onClear();
                }}
                aria-label="Remove image"
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
};
