export default function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="dash-stat-card">
      <p className="dash-stat-value">{value}</p>
      <p className="dash-stat-label">{label}</p>
    </div>
  );
}
