import Map from "../components/Map";
import { useTitrePage } from "../hooks/useTitrePage";

export default function MapPage() {
  useTitrePage("Sur le plan", "Les adresses du guide sur la carte de Paris, pour retrouver un café une fois dans la rue.");
  // La barre du haut fait 5rem (`h-20`), pas 4 : avec 4, la page dépassait
  // l'écran de 16 px et c'est le bas de la carte qui sortait — là où se trouve
  // l'attribution, que la licence des tuiles impose de montrer. `dvh` suit la
  // hauteur réelle sur téléphone, barres du navigateur comprises.
  return (
    <div className="flex flex-col bg-papier" style={{ height: "calc(100dvh - 5rem)" }}>
      <div className="shrink-0 border-b border-trait px-6 py-5">
        <h1 className="text-titre text-encre">sur le plan</h1>
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
