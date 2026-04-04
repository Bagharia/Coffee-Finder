import Map from "../components/Map";

export default function MapPage() {
  return (
    <div className="flex flex-col bg-(--bg-page)" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="px-8 py-6 border-b border-(--border) bg-white shrink-0">
        <h1 className="text-2xl font-bold text-(--text-primary) tracking-tight">Carte des cafés</h1>
        <p className="text-(--text-secondary) text-sm mt-1">
          Filtrez et trouvez le café parfait près de chez vous
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <Map />
      </div>
    </div>
  );
}
