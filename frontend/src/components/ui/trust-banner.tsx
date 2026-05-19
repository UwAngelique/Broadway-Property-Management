export function TrustBanner({ variant = "tax" }: { variant?: "tax" | "payment" }) {
  if (variant === "payment") {
    return (
      <div className="mb-4 rounded-lg border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-semibold">Manual payment pilot (MoMo / bank)</p>
        <p className="mt-1">
          Tenants pay outside the app, then upload proof or paste the MoMo SMS. You approve in Payments. Live bank/MoMo APIs will plug in when partners approve your request.
        </p>
      </div>
    );
  }
  return (
    <div className="mb-4 rounded-lg border-2 border-amber-400 bg-amber-50 p-4 text-sm text-amber-950">
      <p className="font-semibold">Tracker only — not tax filing</p>
      <p className="mt-1">
        Amounts and deadlines here are for your internal records. Filing and assessments are done through{" "}
        <a href="https://www.rra.gov.rw" className="underline font-medium" target="_blank" rel="noreferrer">
          Rwanda Revenue Authority (RRA)
        </a>
        . RRA live integration is pending permission.
      </p>
    </div>
  );
}

