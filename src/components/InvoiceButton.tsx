import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { downloadInvoicePdf, type InvoiceInput } from '@/lib/invoice';

export function InvoiceButton({
  invoice,
  label = 'Download invoice',
  className = '',
}: {
  invoice: InvoiceInput;
  label?: string;
  className?: string;
}) {
  const [generating, setGenerating] = useState(false);

  const handleClick = () => {
    setGenerating(true);
    try {
      downloadInvoicePdf(invoice);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={generating}
      className={`inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-400 dark:hover:text-gray-200 ${className}`}
    >
      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {label}
    </button>
  );
}
