import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <div className="layout">
      <header className="layout__header">
        <h1 className="layout__title">{title ?? 'PokoQC'}</h1>
      </header>
      <main className="layout__main">{children}</main>
    </div>
  );
}
