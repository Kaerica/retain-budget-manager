interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: string;
}

// Small summary card used on the admin dashboard.
export default function StatCard({ label, value, description, icon }: StatCardProps) {
  return (
    <article className="summary-card">
      <div className="summary-card-top">
        <span>{label}</span>
        {icon && <span className="summary-icon">{icon}</span>}
      </div>
      <h2>{value}</h2>
      {description && <p>{description}</p>}
    </article>
  );
}
