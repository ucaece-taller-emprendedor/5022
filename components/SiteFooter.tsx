import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footrow">
        <span>
          © 2026 5022 · Construido para clubes. Hecho para atletas. ·{" "}
          <Link href="/admin/login" className="textlink" style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>
            Administración
          </Link>
        </span>
        <span>Prototipo académico · Todos los datos son ficticios</span>
      </div>
    </footer>
  );
}
