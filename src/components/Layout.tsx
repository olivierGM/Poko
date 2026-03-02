import { useState } from 'react';
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  userName?: string;
  onNameChange?: (name: string) => void;
}

export function Layout({ children, title, userName, onNameChange }: LayoutProps) {
  const [editingName, setEditingName] = useState(false);
  const [editValue, setEditValue] = useState(userName ?? '');

  function openEdit() {
    setEditValue(userName ?? '');
    setEditingName(true);
  }

  function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = editValue.trim();
    if (trimmed && onNameChange) {
      onNameChange(trimmed);
      setEditingName(false);
    }
  }

  return (
    <div className="layout">
      <header className="layout__header">
        <h1 className="layout__title">{title ?? 'Poko'}</h1>
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
                onChange={(e) => setEditValue(e.target.value)}
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
