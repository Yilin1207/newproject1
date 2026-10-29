import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="eyebrow">Кажется, вы свернули не туда</p>
      <h1 className="mt-4 text-4xl font-semibold">
        Такого адреса в районе нет
      </h1>
      <p className="mt-4 text-muted">Но дорогу домой всегда можно найти.</p>
      <Link href="/" className="button-primary mt-8">
        На главную
      </Link>
    </div>
  );
}
