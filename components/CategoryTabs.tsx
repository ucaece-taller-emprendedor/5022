import Link from "next/link";

type Cat = { id: string; competition: string; name: string };

/** Selector de categoría (solo se muestra si hay más de una). */
export default function CategoryTabs({ categories, currentId, basePath }: { categories: Cat[]; currentId?: string; basePath: string }) {
  if (categories.length < 2) return null;
  return (
    <div className="tabs">
      {categories.map((c) => (
        <Link key={c.id} className={`tab${c.id === currentId ? " active" : ""}`} href={`${basePath}?categoria=${c.id}`}>
          {c.competition} · {c.name}
        </Link>
      ))}
    </div>
  );
}
