import { ShieldCheck, MapPin, MessageCircle, CirclePlus, type LucideIcon } from 'lucide-react';

interface Reason {
  icon: LucideIcon;
  tint: string;
  iconColor: string;
  title: string;
  description: string;
}

/**
 * Every point here maps to a real, already-shipped feature — same
 * discipline as PromoTicker's own rule (never a placeholder/unshipped
 * claim). Reuses the exact 5 pastel tints category-filter.tsx already
 * established (blue/orange/purple/success/rose) for the same
 * colored-icon-badge visual language, rather than inventing new colors
 * for a section that's really the same "why us" idea in a bigger format.
 */
const REASONS: Reason[] = [
  {
    icon: ShieldCheck,
    tint: 'bg-success/10',
    iconColor: 'text-success',
    title: 'Verified Listings',
    description: 'Har listing ki RC, insurance aur challan status approve hone se pehle check ki jaati hai.',
  },
  {
    icon: MapPin,
    tint: 'bg-blue-50',
    iconColor: 'text-blue-600',
    title: 'Chhattisgarh Focus',
    description: 'Sirf Chhattisgarh ki gaadiyan — aapke district ke hisaab se pehle dikhayi jaati hain.',
  },
  {
    icon: MessageCircle,
    tint: 'bg-orange-50',
    iconColor: 'text-orange-600',
    title: 'Direct Agent Support',
    description: 'Chat ya Call se seedha hamare agent se baat karein — koi confusion nahi.',
  },
  {
    icon: CirclePlus,
    tint: 'bg-purple-50',
    iconColor: 'text-purple-600',
    title: 'Aasan Selling Process',
    description: 'Apni gaadi sirf 6 simple steps mein list karein, bina kisi jhanjhat ke.',
  },
];

export function WhyChooseUs() {
  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">CG Auto Mart Kyun?</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {REASONS.map((reason) => (
          <div key={reason.title} className="space-y-2.5 rounded-2xl bg-background p-4 shadow-card">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${reason.tint}`}>
              <reason.icon className={`h-5 w-5 ${reason.iconColor}`} strokeWidth={1.75} />
            </span>
            <p className="text-sm font-semibold text-foreground">{reason.title}</p>
            <p className="text-xs text-muted">{reason.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
