import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Modal accesible compartido por Edición, Carga masiva y Diagnóstico.
 * Cierra con Escape, atrapa el foco dentro del diálogo y lo devuelve al
 * elemento que lo abrió al cerrarse.
 */
export default function Modal({ title, icon, subtitle, onClose, closeDisabled, children }) {
  const cardRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    const card = cardRef.current;
    const focusable = card?.querySelector(
      'input, textarea, select, button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    (focusable || card)?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !closeDisabled) {
        onClose();
        return;
      }
      if (e.key === 'Tab' && card) {
        const items = card.querySelectorAll(
          'input, textarea, select, button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [onClose, closeDisabled]);

  return (
    <div
      className="modal-overlay"
      onClick={() => !closeDisabled && onClose()}
      role="presentation"
    >
      <div
        className="glass modal-card animate-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={cardRef}
      >
        <div className="modal-header">
          <div style={{ minWidth: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary rounded-lg flex-center shrink-0">{icon}</div>
              <h2 className="modal-title">{title}</h2>
            </div>
            {subtitle && <p className="text-text-dim text-xs">{subtitle}</p>}
          </div>
          <button
            onClick={() => !closeDisabled && onClose()}
            className="modal-close shrink-0"
            title="Cerrar"
            aria-label="Cerrar diálogo"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
