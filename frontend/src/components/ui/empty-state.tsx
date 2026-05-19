export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
      <p className="font-medium text-gray-900">{title}</p>
      {description ? <p className="text-sm text-gray-600 mt-2">{description}</p> : null}
    </div>
  );
}

