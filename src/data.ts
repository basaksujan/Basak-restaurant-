import { BusinessConfig, Category, FoodItem } from './types';

export const DEFAULT_CONFIG: BusinessConfig = {
  name: "basak khana khajana",
  logo: "",
  location: "Hansquea, Dulur chhat, P.O-Tarbanda, Dist-Darjeeling, Pin-734014",
  address: "Hansquea, Dulur chhat, P.O-Tarbanda, Dist-Darjeeling, Pin-734014",
  contacts: ["+91-9475476265", "+91-9800416889"],
  about: "Welcome to Basak KHANA KHAJANA! Nestled in the quiet, scenic paths of Darjeeling, we are dedicated to crafting authentic, delicious, and heartwarming home-style cooking. Whether you are craving a hearty breakfast to kickstart your day, a nourishing traditional thali lunch, spicy local fast food, or a relaxing dinner with family, we prepare every dish with pure passion, fresh local ingredients, and strict hygiene. Order now and savor the true taste of Hansquea!",
  mapIframeUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14243.601901452818!2d88.25895027581333!3d26.81125211993202!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39e440fe2df014dd%3A0xe6bf44bc0fe0bcdc!2sHansqua!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
  deliveryCharge: 0,
  gstPercent: 0,
  serviceFee: 0
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "breakfast", name: "Breakfast" },
  { id: "lunch", name: "Lunch" },
  { id: "fastfood", name: "Fast Food" },
  { id: "dinner", name: "Dinner" },
  { id: "milk-tea", name: "Milk Tea" },
  { id: "black-tea", name: "Black Tea" },
  { id: "green-tea", name: "Green Tea" }
];

export const DEFAULT_ITEMS: FoodItem[] = [
  {
    id: "item1",
    name: "Alpini Kachori Sabzi",
    category: "breakfast",
    price: 30,
    stock: 50,
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=600&q=80",
    description: "Crispy fried kachoris served with tasty potato curry."
  },
  {
    id: "item2",
    name: "Golden Toast & Double Omelette",
    category: "breakfast",
    price: 45,
    stock: 40,
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80",
    description: "Golden brown toasted bread served with a double egg fluffy omelette."
  },
  {
    id: "item3",
    name: "Traditional Bengali Fish Thali",
    category: "lunch",
    price: 130,
    stock: 25,
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
    description: "Traditional thali featuring hot rice, spiced fish curry, dal, and vegetables."
  },
  {
    id: "item4",
    name: "Special Desi Chicken Thali",
    category: "lunch",
    price: 160,
    stock: 30,
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
    description: "Hearty chicken curry served with steamed rice, rich aromatic dal, and seasonal side dishes."
  },
  {
    id: "item5",
    name: "Darjeeling Style Chicken Chowmein",
    category: "fastfood",
    price: 80,
    stock: 45,
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80",
    description: "Wok-tossed stir fry noodles with tender chicken strips, fresh veggies, and local Himalayan spices."
  },
  {
    id: "item6",
    name: "Double Egg Chicken Roll",
    category: "fastfood",
    price: 75,
    stock: 35,
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=600&q=80",
    description: "Delicious flatbread rolled with a layer of egg, spiced juicy chicken chunks, crisp sliced onions, and tangy sauce."
  },
  {
    id: "item7",
    name: "Soft Butter Naan & Chicken Kasha",
    category: "dinner",
    price: 140,
    stock: 20,
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80",
    description: "Fluffy, butter-brushed tandoor-style naan served with highly rich, semi-dry chicken curry."
  },
  {
    id: "item8",
    name: "Flavourful Fried Rice & Chili Chicken",
    category: "dinner",
    price: 150,
    stock: 25,
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80",
    description: "Classical Indo-Chinese style vegetable fried rice paired perfectly with spicy, saucy sweet & sour chili chicken."
  }
];
