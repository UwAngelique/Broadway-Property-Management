export function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="bg-white rounded-xl border shadow-sm p-4">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-lg font-semibold mt-2 text-gray-900">{value}</p>
    </article>
  );
}

