export default function CoffeeCard({ cafe }) {
  return (
    <div
      className="
        bg-white rounded-3xl shadow-lg
        hover:shadow-xl hover:-translate-y-1
        transition-all duration-300 cursor-pointer
        w-[260px] p-4
      "
    >
      {/* Image */}
      <div className="relative w-full h-40 mb-3">
        <img
          src={cafe.image}
          alt={cafe.nom}
          className="w-full h-full object-cover rounded-2xl"
        />

        {/* Badge note */}
        <div
          className="
            absolute bottom-2 right-2 
            bg-black/70 text-white text-sm px-2 py-0.5 rounded-full 
            backdrop-blur-sm
          "
        >
          ⭐ {cafe.note}
        </div>
      </div>

      {/* Titre du café */}
      <h2 className="text-lg font-semibold text-neutral-900">
        {cafe.nom}
      </h2>

      {/* Arrondissement */}
      <p className="text-sm text-neutral-600 mt-1">
        {cafe.arrondissement}
      </p>

      {/* Tags */}
      <div className="flex gap-2 mt-3 flex-wrap">
        <span className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded-full">
          Café de spécialité
        </span>
        <span className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded-full">
          Wifi
        </span>
      </div>
    </div>
  );
}
