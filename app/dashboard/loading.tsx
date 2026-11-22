export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-4 px-4 py-8" role="status" aria-label="Loading">
      <div className="h-8 w-1/2 rounded bg-muted" />
      <div className="h-12 rounded-lg bg-muted" />
      <div className="h-16 rounded-lg bg-muted" />
      <div className="h-16 rounded-lg bg-muted" />
    </div>
  );
}
