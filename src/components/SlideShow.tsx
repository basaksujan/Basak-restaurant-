import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Slide } from '../types';

const DEFAULT_SLIDES: Slide[] = [
  {
    id: "slide_1",
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=1200&q=80",
    title: "Crispy Golden Indian Breakfasts",
    subtitle: "Made fresh in Hansquea every morning from 7 AM. Savor warm, delicious kachoris.",
    tag: "Morning Special"
  },
  {
    id: "slide_2",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80",
    title: "Authentic Darjeeling Spices",
    subtitle: "Sourced locally from small organic Himalayan gardens to bring genuine flavor.",
    tag: "Himalayan Herbs"
  },
  {
    id: "slide_3",
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1200&q=80",
    title: "Nourishing Traditional Thali Lunch",
    subtitle: "Steaming boiled rice, hearty local fish curry, cooked with traditional recipes.",
    tag: "Hearty Lunches"
  },
  {
    id: "slide_4",
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=1200&q=80",
    title: "Irresistible Sizzling Fast Food",
    subtitle: "Freshly custom rolled, seasoned to your absolute liking for evening cravings.",
    tag: "Evening Fast Food"
  }
];

export default function SlideShow() {
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    async function loadSlides() {
      try {
        const resp = await fetch('/api/slides');
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.length > 0) {
            setSlides(data);
          }
        }
      } catch (err) {
        console.error("Failed to load slides", err);
      }
    }
    loadSlides();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [slides]);

  const handlePrev = () => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  if (slides.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-[320px] md:h-[450px] overflow-hidden rounded-2xl shadow-xl bg-amber-950/20 group">
      {/* Background Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id || index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          {/* Overlay Darkener */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20 z-10" />
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover transform transition-transform duration-1000"
            referrerPolicy="no-referrer"
          />

          {/* Text overlays with staggering display layout */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-20 text-white flex flex-col justify-end h-full">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/90 text-amber-950 text-xs font-bold rounded-full w-max mb-3 uppercase tracking-wider shadow">
              <Sparkles className="w-3.5 h-3.5" />
              {slide.tag}
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold font-sans tracking-tight text-white mb-2 max-w-2xl drop-shadow">
              {slide.title}
            </h2>
            <p className="text-sm md:text-base text-gray-200/95 font-sans max-w-xl font-medium antialiased drop-shadow">
              {slide.subtitle}
            </p>
          </div>
        </div>
      ))}

      {/* Slide Navigation Left/Right Buttons */}
      {slides.length > 1 && (
        <>
          <button
            id="btn-prev-slide"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-amber-100/10 hover:bg-amber-100/30 text-white p-2.5 rounded-full z-30 transition cursor-pointer scale-90 group-hover:scale-100 focus:ring-2 focus:ring-amber-500"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            id="btn-next-slide"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-amber-100/10 hover:bg-amber-100/30 text-white p-2.5 rounded-full z-30 transition cursor-pointer scale-90 group-hover:scale-100 focus:ring-2 focus:ring-amber-500"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Bottom Dots indicators */}
          <div className="absolute bottom-4 right-6 flex items-center gap-2 z-30">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === current ? "w-6 bg-amber-500" : "w-2 bg-white/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
