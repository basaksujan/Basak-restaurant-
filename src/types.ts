export interface BusinessConfig {
  name: string;
  logo: string; // Base64 or image URL
  location: string;
  address: string;
  contacts: string[];
  about: string;
  mapIframeUrl: string;
  deliveryCharge?: number;
  gstPercent?: number;
  serviceFee?: number;
}

export interface Category {
  id: string;
  name: string;
  color?: string; // e.g. 'amber', 'emerald', etc.
}

export interface FoodItem {
  id: string;
  name: string;
  category: string; // matches Category.id or Category.name
  price: number;
  stock: number;
  image: string; // Base64 or image URL
  description?: string;
}

export interface CartItem {
  item: FoodItem;
  quantity: number;
}

export interface Order {
  id: string;
  token: string; // e.g. BKK-1001 style
  customerName: string;
  phone: string;
  items: {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Slide {
  id: string;
  image: string; // base64 or url
  title: string;
  subtitle: string;
  tag: string;
}
