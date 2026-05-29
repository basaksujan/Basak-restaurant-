interface LogoProps {
  customLogoUrl?: string;
  name?: string;
  className?: string;
}

export default function Logo({ customLogoUrl, name = "Basak Khana Khajana", className = "h-8 w-8 sm:h-10 sm:w-10" }: LogoProps) {
  if (customLogoUrl && customLogoUrl.trim() !== "") {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <img
          src={customLogoUrl}
          alt={name}
          className={`${className} object-cover rounded-full border-2 border-orange-500/50 shadow-md flex-shrink-0`}
          referrerPolicy="no-referrer"
        />
        <span className="font-sans font-black text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl tracking-tight capitalize leading-tight max-w-[130px] xs:max-w-[180px] sm:max-w-[240px] md:max-w-[280px] lg:max-w-[340px] xl:max-w-none line-clamp-2 select-none text-[#ea580c] drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          {name}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Handcrafted Gastronome Vector Logo with Saffron/Orange gradient border/bg */}
      <div className="flex items-center justify-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-tr from-[#e11d48] via-[#ea580c] via-[#ca8a04] to-[#16a34a] p-[2px] shadow-lg flex-shrink-0">
        <div className="bg-slate-900 rounded-md sm:rounded-lg p-1 sm:p-1.5 flex items-center justify-center">
          <svg
            className="w-4 h-4 sm:w-5.5 sm:h-5.5 text-white animate-pulse"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 00-4 4h8a4 4 0 00-4-4z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12h14c0 4-4 6-7 6s-7-2-7-6z"
            />
          </svg>
        </div>
      </div>
      <span className="font-sans font-black text-xs xs:text-sm sm:text-base md:text-lg lg:text-2xl tracking-tight capitalize leading-tight max-w-[130px] xs:max-w-[180px] sm:max-w-[240px] md:max-w-[280px] lg:max-w-[340px] xl:max-w-none line-clamp-2 select-none text-[#ea580c] drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
        {name}
      </span>
    </div>
  );
}
