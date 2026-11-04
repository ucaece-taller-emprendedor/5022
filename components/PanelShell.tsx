import Link from "next/link";
import type { ReactNode } from "react";
import DemoNotice from "./DemoNotice";

export type NavItem = { key: string; label: string; href: string };

export default function PanelShell({
  title, caption, subtitle, items, active, children, backHref = "/",
}: {
  title: string;
  caption: string;
  subtitle: string;
  items: NavItem[];
  active: string;
  children: ReactNode;
  backHref?: string;
}) {
  const current = items.find((i) => i.key === active) ?? items[0]!;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="side-caption">{caption}</div>
        {items.map((i) => (
          <Link key={i.key} className={`side-link${i.key === current.key ? " active" : ""}`} href={i.href}>
            {i.label}
          </Link>
        ))}
        <div className="side-caption">CUENTA</div>
        <Link className="side-link" href={backHref}>Volver al inicio</Link>
      </aside>
      <main className="workspace">
        <div className="workhead">
          <div>
            <span className="kicker">5022 / {title.toUpperCase()}</span>
            <h1>{current.label}</h1>
            <span className="muted">{subtitle}</span>
          </div>
          <span className="badge-demo">● DEMO</span>
        </div>
        {children}
        <DemoNotice />
      </main>
    </div>
  );
}
