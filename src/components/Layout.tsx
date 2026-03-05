import { useState } from 'react';
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  userName?: string;
  onNameChange?: (name: string) => void;
  onNewSession?: () => void;
  /** Bouton « Devenir observateur » / « Participer au vote » affiché à gauche de « Nouvelle partie » */
  observerButton?: { label: string; onClick: () => void };
}

export function Layout({ children, title, userName, onNameChange, onNewSession, observerButton }: LayoutProps) {
  const [editingName, setEditingName] = useState(false);
  const [editValue, setEditValue] = useState(userName ?? '');

  function openEdit() {
    setEditValue((userName ?? '').slice(0, 20));
    setEditingName(true);
  }

  function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = editValue.trim().slice(0, 20);
    if (trimmed && onNameChange) {
      onNameChange(trimmed);
      setEditingName(false);
    }
  }

  return (
    <div className="layout">
      <header className="layout__header">
        <h1 className="layout__title">{title ?? 'Poko'}</h1>
        <div className="layout__header-actions">
          {observerButton && (
            <div className="layout__user">
              <button
                type="button"
                className="layout__user-name layout__user-name--secondary"
                onClick={observerButton.onClick}
                title={observerButton.label}
              >
                <span className="layout__user-label">{observerButton.label}</span>
              </button>
            </div>
          )}
          {onNewSession && (
            <div className="layout__user">
              <button
                type="button"
                className="layout__user-name"
                onClick={onNewSession}
                title="Créer une nouvelle partie"
              >
                <span className="layout__user-label">Nouvelle partie</span>
              </button>
            </div>
          )}
          {userName != null && onNameChange && (
            <div className="layout__user">
              <button
                type="button"
                className="layout__user-name"
                onClick={openEdit}
                title="Modifier mon nom"
              >
                <span className="layout__user-label">{userName || 'Sans nom'}</span>
                <span className="layout__user-edit" aria-hidden>✎</span>
              </button>
            </div>
          )}
        </div>
      </header>
      {editingName && onNameChange && (
        <div className="layout__name-modal-overlay" role="dialog" aria-labelledby="edit-name-title">
          <div className="layout__name-modal">
            <h2 id="edit-name-title" className="layout__name-modal-title">Modifier mon nom</h2>
            <form onSubmit={submitEdit} className="layout__name-modal-form">
              <input
                type="text"
                className="input layout__name-modal-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value.slice(0, 20))}
                maxLength={20}
                placeholder="Ton prénom ou pseudo"
                autoFocus
              />
              <div className="layout__name-modal-actions">
                <button type="button" className="button button--secondary" onClick={() => setEditingName(false)}>
                  Annuler
                </button>
                <button type="submit" className="button button--primary" disabled={!editValue.trim()}>
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <main className="layout__main">{children}</main>
    </div>
  );
}
