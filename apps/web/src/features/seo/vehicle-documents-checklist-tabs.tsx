'use client';

import { useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

type DocTabKey = 'ownership' | 'vehicle' | 'transfer';

type DocTab = {
  key: DocTabKey;
  label: string;
  items: string[];
};

const DOCUMENT_TABS: DocTab[] = [
  {
    key: 'ownership',
    label: 'Ownership',
    items: [
      'Original RC (Registration Certificate)',
      'Seller ID proof match',
      'Chassis number match with RC',
      'Engine number match with RC',
      'Owner count clarity',
      'Hypothecation status check',
      'Duplicate key availability',
      'Previous sale deed (if any)',
    ],
  },
  {
    key: 'vehicle',
    label: 'Vehicle Docs',
    items: [
      'Valid insurance policy copy',
      'Pollution certificate (PUC)',
      'Road tax receipt copy',
      'Service history records',
      'Major repair invoices',
      'Accident history declaration',
      'Pending challan check',
      'Warranty papers (if active)',
    ],
  },
  {
    key: 'transfer',
    label: 'Transfer',
    items: [
      'Signed Form 29 and Form 30',
      'NOC for interstate transfer (if needed)',
      'Bank NOC if financed earlier',
      'Insurance transfer request',
      'Delivery note with date',
      'Payment receipt acknowledgment',
      'Two witness details',
      'RTO transfer follow-up proof',
    ],
  },
];

export function VehicleDocumentsChecklistTabs() {
  const [activeTab, setActiveTab] = useState<DocTabKey>('ownership');

  const activeItems = useMemo(
    () => DOCUMENT_TABS.find((tab) => tab.key === activeTab)?.items ?? DOCUMENT_TABS[0].items,
    [activeTab],
  );

  return (
    <section className="space-y-3 rounded-2xl bg-primary-light/60 p-4 sm:p-5">
      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        Used Vehicle Document Checklist
      </h2>

      <div className="flex flex-wrap gap-1">
        {DOCUMENT_TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`press-chip rounded-md border px-5 py-2 text-sm font-medium transition ${
                active
                  ? 'border-foreground bg-background text-primary'
                  : 'border-line bg-background/80 text-foreground hover:bg-background'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-md bg-background p-4 sm:p-5">
        <ul className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          {activeItems.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm font-medium text-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={2} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
