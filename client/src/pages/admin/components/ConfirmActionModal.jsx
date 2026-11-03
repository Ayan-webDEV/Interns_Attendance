import FullscreenModal from "./FullscreenModal.jsx";

export default function ConfirmActionModal({open,title,description,confirmLabel="Confirm",cancelLabel="Cancel",busy=false,onConfirm,onClose,danger=false,children}) {
  return (
    <FullscreenModal open={open} title={title} description={description} size="small" onClose={onClose}>
      <div className="space-y-4">
        {children}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>{cancelLabel}</button>
          <button type="button" className={danger?"btn btn-danger":"btn btn-primary"} onClick={onConfirm} disabled={busy}>{busy?"Processing…":confirmLabel}</button>
        </div>
      </div>
    </FullscreenModal>
  );
}
