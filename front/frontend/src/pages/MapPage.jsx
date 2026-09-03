import Map from "../components/Map";

export default function MapPage() {
  return (
    <div className="flex flex-col bg-papier" style={{ height: "calc(100vh - 4rem)" }}>
      <div className="shrink-0 border-b border-trait px-6 py-5">
        <h1 className="text-titre text-encre">Sur le plan</h1>
        <p className="chapo">
          chaque plaque porte le nom de l&apos;adresse. toucher une plaque ouvre sa fiche.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <Map />
      </div>
    </div>
  );
}
