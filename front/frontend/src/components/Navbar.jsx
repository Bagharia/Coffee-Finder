export default function Navbar() {
  return (
    <nav className="w-full h-16 bg-white/80 backdrop-blur-md border-b border-neutral-200 flex items-center px-10 justify-between sticky top-0 z-50">

      <h1 className="text-xl font-semibold text-neutral-800">
        ☕ SpotThePlace
      </h1>

      <div className="flex gap-8">
        <a href="/" className="text-neutral-700 hover:text-black transition-all duration-300 inline-block hover:-translate-y-[3px]">Accueil</a>
        <a href="/cafes" className="text-neutral-700 hover:text-black transition-all duration-300 inline-block hover:-translate-y-[3px]">Cafés</a>
        <a href="/category/matcha" className="text-neutral-700 hover:text-black transition-all duration-300 inline-block hover:-translate-y-[3px]">Matcha</a>
        <a href="/category/bubble-tea" className="text-neutral-700 hover:text-black transition-all duration-300 inline-block hover:-translate-y-[3px]">Bubble Tea</a>
        <a href="/category/the" className="text-neutral-700 hover:text-black transition-all duration-300 inline-block hover:-translate-y-[3px]">Thé</a>
      </div>

    <div className="flex items-center gap-4">
      <a
        href="/login"
        className="
          flex items-center justify-center
          w-9 h-9 rounded-full
          transition-all duration-300
          hover:-translate-y-[3px]
          cursor-pointer
        "
      >
        <svg
          viewBox="0 0 32 32"
          className="w-6 h-6 fill-neutral-700 hover:fill-black transition"
        >
          <path d="M16,16A7,7,0,1,0,9,9,7,7,0,0,0,16,16ZM16,4a5,5,0,1,1-5,5A5,5,0,0,1,16,4Z"></path>
          <path d="M17,18H15A11,11,0,0,0,4,29a1,1,0,0,0,1,1H27a1,1,0,0,0,1-1A11,11,0,0,0,17,18ZM6.06,28A9,9,0,0,1,15,20h2a9,9,0,0,1,8.94,8Z"></path>
        </svg>
      </a>

      <div className="relative flex items-center max-w-[190px]">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="absolute left-4 w-4 h-4 fill-[#bdbecb] pointer-events-none z-10"
        >
          <g>
            <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"></path>
          </g>
        </svg>
        

        <input
          type="search"
          placeholder="Search..."
          className="
            w-full h-[33px] pl-10 pr-4 rounded-4xl
            bg-white text-black
            shadow-[0_0_0_1.5px_#2b2c37,0_0_25px_-17px_#000]
            outline-none border-0
            transition-all duration-300 ease-out
            focus:shadow-[0_0_0_2.5px_#2f303d]
            hover:shadow-[0_0_0_2.5px_#2f303d,0_0_25px_-15px_#000]
          "
        />
      </div>
    </div>
    </nav>
  );
}
