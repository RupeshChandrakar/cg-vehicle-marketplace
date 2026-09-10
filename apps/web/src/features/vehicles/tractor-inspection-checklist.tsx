'use client';

import { useMemo, useState } from 'react';
import { Settings } from 'lucide-react';

type ChecklistTabKey = 'exterior' | 'interior' | 'others';

type ChecklistTab = {
  key: ChecklistTabKey;
  label: string;
  items: string[];
};

const TRACTOR_CHECKLIST_TABS: ChecklistTab[] = [
  {
    key: 'exterior',
    label: 'Exterior',
    items: [
      'Bumper',
      'Toolbox',
      'Accessories',
      'Silencer',
      'Air cleaner',
      'Tyers',
      'Drawbar',
      'Exhaust smoke',
      'Linkage point',
      'Toplink',
    ],
  },
  {
    key: 'interior',
    label: 'Interior',
    items: [
      'Engine sound',
      'Fan belt condition',
      'Steering pump',
      'Water body leakage',
      'Power steering pump',
      'Fuel tank leakage',
      'Oil filter',
      'Front axel leakage',
      'Radiator water level',
      'Hydraulic filter',
      'Wheel alignment',
      'Wheel hub greasing',
      'Hydraulic level working',
      'Rear axel leakage',
      'Fuel filter',
      'Alternator working',
      'Engine back compressor',
    ],
  },
  {
    key: 'others',
    label: 'Others',
    items: [
      'Lights working',
      'Brake working',
      'PTO levels working',
      'L/M/H lever working',
      'Clutch working',
      'Self start working',
      'Handbrake working',
      'Driver console working',
      'Gear shifting',
      'Seat condition',
      'Gear lever working',
      'Seat adjustment',
      'Hand accelerator',
      '4WD lever working',
    ],
  },
];

export function TractorInspectionChecklist() {
  const [activeTab, setActiveTab] = useState<ChecklistTabKey>('exterior');

  const activeItems = useMemo(
    () =>
      TRACTOR_CHECKLIST_TABS.find((tab) => tab.key === activeTab)?.items ?? TRACTOR_CHECKLIST_TABS[0].items,
    [activeTab],
  );

  return (
    <section className="space-y-3">
      <h2 className="text-[2rem] font-extrabold tracking-tight text-foreground sm:text-[2.15rem]">
        Tractor Inspection Checklist
      </h2>

      <div className="space-y-4 rounded-md bg-primary-light/60 p-4 sm:p-5">
        <div className="flex flex-wrap gap-0.5">
          {TRACTOR_CHECKLIST_TABS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-t-md border px-6 py-2.5 text-base font-medium transition ${
                  active
                    ? 'border-foreground bg-background text-primary'
                    : 'border-line bg-background/70 text-foreground hover:bg-background'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-md bg-background p-4 sm:p-5">
          <ul className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            {activeItems.map((item) => (
              <li key={item} className="flex items-center gap-2 text-[1.08rem] font-medium text-foreground">
                <Settings className="h-[1rem] w-[1rem] shrink-0 text-error" strokeWidth={2.2} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
