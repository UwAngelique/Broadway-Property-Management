export function StatusBanner({ message, error }: { message?: string; error?: string }) {
  if (!message && !error) return null;
  return (
    <p
      className={`text-sm rounded-lg p-3 border ${
        error ? "text-red-800 bg-red-50 border-red-100" : "text-blue-800 bg-blue-50 border-blue-100"
      }`}
    >
      {error ?? message}
    </p>
  );
}

