export default function ConfirmDialog({
  message,
  confirmLabel = 'Delete',
  busy,
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="dash-dialog-overlay" onClick={onCancel}>
      <div
        className="dash-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-describedby="dash-dialog-message"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="dash-dialog-message" className="dash-dialog-message">
          {message}
        </p>
        <div className="dash-dialog-actions">
          <button type="button" className="cancel-button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="delete-button" onClick={onConfirm} disabled={busy}>
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
