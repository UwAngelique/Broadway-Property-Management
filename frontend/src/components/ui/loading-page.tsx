export function LoadingPage({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-600">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 mb-3" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

