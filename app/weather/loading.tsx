export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 pt-10 pb-24">
      <div className="h-8 w-40 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse mb-6" />
      <div className="h-44 bg-blue-100 dark:bg-blue-900/20 rounded-3xl animate-pulse mb-4" />
      <div className="h-52 bg-neutral-200 dark:bg-neutral-800 rounded-3xl animate-pulse mb-4">
        <div className="flex gap-3 p-4">
          {[1,2,3].map(i => <div key={i} className="w-[120px] h-40 bg-neutral-300 dark:bg-neutral-700 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    </div>
  );
}
