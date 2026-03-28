export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 pt-10 pb-24">
      <div className="h-8 w-56 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse mb-6" />
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="h-24 bg-emerald-100 dark:bg-emerald-900/20 rounded-2xl animate-pulse" />
        <div className="h-24 bg-rose-100 dark:bg-rose-900/20 rounded-2xl animate-pulse" />
      </div>
      <div className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded-2xl animate-pulse mb-4" />
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[1,2,3].map(i => <div key={i} className="h-16 bg-neutral-200 dark:bg-neutral-800 rounded-2xl animate-pulse" />)}
      </div>
      <div className="h-56 bg-neutral-200 dark:bg-neutral-800 rounded-3xl animate-pulse mb-4" />
      {[1,2,3,4].map(i => (
        <div key={i} className="h-16 bg-neutral-200 dark:bg-neutral-800 rounded-2xl animate-pulse mb-2" />
      ))}
    </div>
  );
}
