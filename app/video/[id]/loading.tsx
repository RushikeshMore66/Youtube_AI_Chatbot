export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-4 px-4 py-8" role="status" aria-label="Loading">
      <div className="h-6 w-3/4 rounded bg-muted" />
      <div className="h-10 rounded-lg bg-muted" />
      <div className="h-48 rounded-lg bg-muted" />
    </div>
  );
}
