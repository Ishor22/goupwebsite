export default function EmptyState({
  message,
  actionLabel,
  actionHref,
}: {
  message: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="dash-empty-state">
      <p>{message}</p>
      {actionLabel && actionHref && (
        <a href={actionHref} className="save-button">
          {actionLabel}
        </a>
      )}
    </div>
  );
}
