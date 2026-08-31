'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Users, MessageCircle, type LucideIcon } from 'lucide-react';

interface PromoItem {
  icon: LucideIcon;
  text: string;
}

/**
 * Every message here maps to a real, already-shipped feature — never a
 * placeholder claim. Add a new one only once its feature is actually live;
 * remove one the moment its feature is retired.
 */
const PROMOS: PromoItem[] = [
  { icon: ShieldCheck, text: '500+ Verified Sellers Chhattisgarh Mein' },
  { icon: Users, text: 'Dost Ko Invite Karo — WhatsApp Pe Share Karein' },
  { icon: MessageCircle, text: 'Seedha Agent Se Baat Karein — Chat Ya Call' },
];

const ROTATE_INTERVAL_MS = 4000;

/**
 * A small, self-rotating promo badge — sits where the old static "500+
 * Verified Sellers" pill lived on the home hero. Auto-advances on a plain
 * setInterval (no carousel library) and pauses on hover so a reader mid-line
 * doesn't have the text swap under them.
 */
export function PromoTicker() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % PROMOS.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isPaused]);

  const { icon: Icon, text } = PROMOS[index];

  return (
    <span
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="promo-badge shadow-glow-primary inline-flex max-w-full items-center gap-2 rounded-full py-1 pr-3.5 pl-1 text-xs font-medium text-primary"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white">
        <Icon className="h-3 w-3" strokeWidth={2} />
      </span>
      <span key={index} className="animate-promo-fade-in truncate">
        {text}
      </span>
    </span>
  );
}
