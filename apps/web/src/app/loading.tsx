/** Matches the real home page's shape (hero, category row, vehicle grid) so
 *  navigating here never shows a blank flash or a plain "loading…" line —
 *  see globals.css's `.skeleton*` primitives, already used the same way on
 *  My Listings / Favorites / Enquiries / Notifications. */
export default function Loading() {
  return (
    <div className="space-y-6 py-4">
      <div className="skeleton h-48 w-full rounded-2xl sm:h-56" />

      <div className="space-y-3">
        <div className="skeleton skeleton-title w-40" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex shrink-0 flex-col items-center gap-2">
              <div className="skeleton skeleton-circle h-14 w-14" />
              <div className="skeleton skeleton-text w-12" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <div className="skeleton h-9 w-32 rounded-lg" />
        <div className="skeleton h-9 w-28 rounded-lg" />
      </div>

      <div className="space-y-4">
        <div className="skeleton skeleton-title w-48" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton aspect-[16/10] w-full" />
              <div className="space-y-2.5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="skeleton skeleton-title w-2/3" />
                  <div className="skeleton skeleton-text w-14" />
                </div>
                <div className="flex gap-1.5">
                  <div className="skeleton h-6 w-16 rounded-full" />
                  <div className="skeleton h-6 w-14 rounded-full" />
                  <div className="skeleton h-6 w-20 rounded-full" />
                </div>
                <div className="skeleton skeleton-text w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
