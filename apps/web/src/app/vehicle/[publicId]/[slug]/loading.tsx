/** Mirrors the real vehicle detail page's two-column shape (gallery +
 *  info card) so a direct link or a fresh navigation never shows a blank
 *  page while the vehicle loads. See globals.css's `.skeleton*` primitives. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="skeleton aspect-[4/3] w-full rounded-3xl" />
        </div>

        <div className="space-y-6 lg:col-span-6">
          <div className="space-y-3 rounded-3xl border border-line bg-background p-4 shadow-card sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="skeleton skeleton-text w-24" />
              <div className="skeleton skeleton-circle h-8 w-8" />
            </div>
            <div className="skeleton skeleton-title w-4/5" />
            <div className="flex items-end gap-3">
              <div className="skeleton h-8 w-32 rounded-lg" />
              <div className="skeleton h-6 w-20 rounded-lg" />
            </div>
            <div className="skeleton skeleton-text w-2/3" />
          </div>

          <div className="space-y-3">
            <div className="skeleton skeleton-title w-32" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="skeleton h-12 flex-1 rounded-2xl" />
            <div className="skeleton h-12 flex-1 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
