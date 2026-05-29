import { Coffee, UtensilsCrossed, FlameKindling, MoonStar, Leaf, Sprout } from 'lucide-react';
import { Category } from '../types';

interface CategoryCardsProps {
  categories: Category[];
  activeCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}

export default function CategoryCards({ categories, activeCategory, onSelectCategory }: CategoryCardsProps) {
  // Let's pair categories with appropriate high-contrast visual illustrations and gradient themes
  const getCategoryTheme = (id: string, customColor?: string) => {
    const key = (customColor || id).toLowerCase();
    switch (key) {
      case 'breakfast':
      case 'emerald':
        return {
          bg: "bg-emerald-50 hover:bg-emerald-100/80 border-emerald-100",
          iconBg: "bg-emerald-600 text-white",
          text: "text-emerald-900",
          desc: "Warm & healthy morning starters",
          icon: Coffee,
          selected: "ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50 text-emerald-950"
        };
      case 'lunch':
      case 'amber':
        return {
          bg: "bg-amber-50 hover:bg-amber-100/80 border-amber-100",
          iconBg: "bg-amber-500 text-white",
          text: "text-amber-950",
          desc: "Nourishing lunch thalis & curries",
          icon: UtensilsCrossed,
          selected: "ring-2 ring-amber-500 border-amber-300 bg-amber-50 text-amber-950"
        };
      case 'fastfood':
      case 'fast_food':
      case 'orange':
        return {
          bg: "bg-rose-50 hover:bg-rose-100/80 border-rose-100",
          iconBg: "bg-rose-600 text-white",
          text: "text-rose-955",
          desc: "Sizzling rolls, chowmein & snacks",
          icon: FlameKindling,
          selected: "ring-2 ring-rose-500 border-rose-300 bg-rose-50 text-rose-950"
        };
      case 'dinner':
      case 'indigo':
        return {
          bg: "bg-orange-50 hover:bg-orange-100/80 border-orange-100",
          iconBg: "bg-orange-600 text-white",
          text: "text-orange-950",
          desc: "Gourmet dishes to end your evening",
          icon: MoonStar,
          selected: "ring-2 ring-orange-500 border-orange-300 bg-orange-50 text-orange-95"
        };
      case 'rose':
        return {
          bg: "bg-rose-50 hover:bg-rose-100/80 border-rose-100",
          iconBg: "bg-rose-600 text-white",
          text: "text-rose-955",
          desc: "Delectable recipes and spicy grills",
          icon: FlameKindling,
          selected: "ring-2 ring-rose-500 border-rose-300 bg-rose-50 text-rose-95"
        };
      case 'sky':
        return {
          bg: "bg-sky-50 hover:bg-sky-100/80 border-sky-100",
          iconBg: "bg-sky-600 text-white",
          text: "text-sky-955",
          desc: "Chilled beverages and refreshing ice items",
          icon: Coffee,
          selected: "ring-2 ring-sky-500 border-sky-300 bg-sky-50 text-sky-95"
        };
      case 'purple':
        return {
          bg: "bg-purple-50 hover:bg-purple-100/80 border-purple-100",
          iconBg: "bg-purple-600 text-white",
          text: "text-purple-955",
          desc: "Chef special momos & premium platters",
          icon: UtensilsCrossed,
          selected: "ring-2 ring-purple-600 border-purple-300 bg-purple-50 text-purple-95"
        };
      case 'red':
        return {
          bg: "bg-red-50 hover:bg-red-100/80 border-red-100",
          iconBg: "bg-red-600 text-white",
          text: "text-red-955",
          desc: "Spicy condiments, local chutneys and gravies",
          icon: FlameKindling,
          selected: "ring-2 ring-red-500 border-red-300 bg-red-50 text-red-95"
        };
      case 'cyan':
        return {
          bg: "bg-cyan-50 hover:bg-cyan-100/80 border-cyan-100",
          iconBg: "bg-cyan-600 text-white",
          text: "text-cyan-955",
          desc: "Cool mocktails, soft drinks and refreshments",
          icon: Coffee,
          selected: "ring-2 ring-cyan-500 border-cyan-300 bg-cyan-50 text-cyan-95"
        };
      case 'fuchsia':
        return {
          bg: "bg-fuchsia-50 hover:bg-fuchsia-100/80 border-fuchsia-100",
          iconBg: "bg-fuchsia-600 text-white",
          text: "text-fuchsia-955",
          desc: "Sweet desserts and house pastries",
          icon: UtensilsCrossed,
          selected: "ring-2 ring-fuchsia-600 border-fuchsia-300 bg-fuchsia-50 text-fuchsia-95"
        };
      case 'teal':
        return {
          bg: "bg-teal-50 hover:bg-teal-100/80 border-teal-100",
          iconBg: "bg-teal-600 text-white",
          text: "text-teal-955",
          desc: "Healthy salads, greens, and side stir-fries",
          icon: UtensilsCrossed,
          selected: "ring-2 ring-teal-500 border-teal-300 bg-teal-50 text-teal-95"
        };
      case 'milk-tea':
        return {
          bg: "bg-amber-50 hover:bg-amber-100/80 border-amber-100",
          iconBg: "bg-amber-800 text-white",
          text: "text-amber-950",
          desc: "Fresh, aromatic traditional milk tea brew",
          icon: Coffee,
          selected: "ring-2 ring-amber-500 border-amber-300 bg-amber-50 text-amber-95"
        };
      case 'black-tea':
        return {
          bg: "bg-stone-50 hover:bg-stone-100/80 border-stone-250",
          iconBg: "bg-stone-850 bg-stone-900 text-white",
          text: "text-stone-950",
          desc: "Bold, strong & premium black tea leaves",
          icon: Leaf,
          selected: "ring-2 ring-stone-500 border-stone-300 bg-stone-50 text-stone-95"
        };
      case 'green-tea':
        return {
          bg: "bg-emerald-50 hover:bg-emerald-100/80 border-emerald-100",
          iconBg: "bg-emerald-700 text-with-glow text-white",
          text: "text-emerald-950",
          desc: "Pure organic herbal green tea leaves",
          icon: Sprout,
          selected: "ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50 text-emerald-95"
        };
      case 'stone':
      default:
        return {
          bg: "bg-stone-50 hover:bg-stone-100 border-stone-150",
          iconBg: "bg-stone-600 text-white",
          text: "text-stone-900",
          desc: "Freshly prepared local delicacies",
          icon: UtensilsCrossed,
          selected: "ring-2 ring-orange-500 border-orange-300 bg-orange-50 text-orange-95"
        };
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-orange-600 text-xs font-bold uppercase tracking-wider">Delectable Delights</span>
          <h3 className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight font-sans">
            Explore Dishes by Category
          </h3>
        </div>
        
        {activeCategory && (
          <button
            id="btn-clear-category-filter"
            onClick={() => onSelectCategory(null)}
            className="text-xs font-bold text-orange-850 text-orange-800 hover:text-orange-900 bg-orange-50 px-3.5 py-1.5 rounded-full transition cursor-pointer self-start md:self-auto hover:bg-orange-100/80 border border-orange-100"
          >
            Show All Categories
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const theme = getCategoryTheme(cat.id, cat.color);
          const IconComponent = theme.icon;
          const isSelected = activeCategory === cat.id;

          return (
            <button
              id={`category-card-${cat.id}`}
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex flex-col items-start p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 w-full relative overflow-hidden hover:scale-[1.025] hover:shadow-md hover:-translate-y-0.5 ${
                isSelected 
                  ? `${theme.selected || "ring-2 ring-orange-500 border-orange-300"} shadow-md transform scale-[1.025] -translate-y-0.5` 
                  : `${theme.bg} shadow-sm border`
              }`}
            >
              {/* Selective Background Glow for Active Category */}
              {isSelected && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full" />
              )}
              
              <div className={`p-3 rounded-xl mb-4 transition ${theme.iconBg} ${isSelected ? "scale-110 shadow-lg" : ""}`}>
                <IconComponent className="w-5 h-5" />
              </div>

              <h4 className={`text-base font-bold font-sans ${theme.text} mb-1 flex items-center justify-between w-full`}>
                {cat.name}
              </h4>
              <p className="text-xs text-gray-500 line-clamp-2 md:line-clamp-none">
                {theme.desc}
              </p>

              <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-850">
                <span>View items &rarr;</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
