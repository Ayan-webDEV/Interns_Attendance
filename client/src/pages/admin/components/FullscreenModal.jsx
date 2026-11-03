import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./FullscreenModal.module.css";

export default function FullscreenModal({
  open = true, title, description, onClose, children, footer,
  size = "medium", closeOnBackdrop = true,
}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const activeElement = document.activeElement;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", onKeyDown);
      activeElement?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className={styles.backdrop} role="presentation" onMouseDown={(event) => {
      if (closeOnBackdrop && event.target === event.currentTarget) closeRef.current?.();
    }}>
      <section className={`${styles.dialog} ${styles[size] || styles.medium}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className={styles.header}>
          <div className="min-w-0"><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close dialog"><X size={19}/></button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </section>
    </div>,
    document.body
  );
}
