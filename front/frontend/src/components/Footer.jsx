export default function Footer() {
  return (
    <footer className="w-full h-16 bg-white border-t border-neutral-200 flex items-center justify-center text-neutral-700">
      <p className="text-sm">
        © {new Date().getFullYear()} SpotThePlace — Tous droits réservés.
      </p>
    </footer>
  );
}
