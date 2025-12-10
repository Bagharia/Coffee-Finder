export default function Carousel({ cafes }) {
  const doubled = [...cafes, ...cafes]; // On duplique pour l’infini

  return (
    <div className="overflow-hidden w-full py-6">
      <div
        className="
          flex gap-4 
          animate-scroll-infinite
        "
      >
        {doubled.map((cafe, index) => (
          <div
            key={index}
            className="
              min-w-[260px] bg-white rounded-2xl shadow-md p-4
              shrink-0
            "
          >
            <img
              src={cafe.image}
              alt={cafe.nom}
              className="w-full h-40 object-cover rounded-xl"
            />
            <h2 className="mt-3 text-lg font-semibold">{cafe.nom}</h2>
            <p className="text-sm text-neutral-600">{cafe.arrondissement}</p>
            <p className="text-sm mt-2 text-neutral-800">⭐ {cafe.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
