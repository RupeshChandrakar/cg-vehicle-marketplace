import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

const WHATSAPP_PHONE = '917000144638';
const DEFAULT_MESSAGE =
  'Namaste, mujhe aapke WhatsApp channel me direct add kar dijiye.';

export function WhatsAppChannelFab() {
  const href = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp channel join help"
      className="fixed right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-95 active:scale-[0.98] bottom-[calc(6.25rem+env(safe-area-inset-bottom))] sm:bottom-6"
    >
      <MessageCircle className="h-4.5 w-4.5" strokeWidth={2} />
      WhatsApp
    </Link>
  );
}
