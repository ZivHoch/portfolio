export default function ProjectSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8 px-4 md:px-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-white/10 bg-white/5 p-6 animate-pulse min-h-[220px] flex flex-col"
        >
          <div className="h-6 w-2/3 rounded bg-white/10 mb-3" />
          <div className="h-4 w-full rounded bg-white/10 mb-2" />
          <div className="h-4 w-4/5 rounded bg-white/10 mb-6 flex-grow" />
          <div className="h-1.5 w-full rounded-full bg-white/10 mt-auto" />
        </div>
      ))}
    </div>
  );
}
