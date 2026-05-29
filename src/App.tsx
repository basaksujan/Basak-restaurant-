import { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  UserCheck,
  Building,
  AlertCircle,
  Menu as MenuIcon
} from 'lucide-react';
import { FoodItem, Category, CartItem, BusinessConfig, Order } from './types';
import { DEFAULT_CONFIG, DEFAULT_CATEGORIES, DEFAULT_ITEMS } from './data';
import Logo from './components/Logo';
import SlideShow from './components/SlideShow';
import CategoryCards from './components/CategoryCards';
import CartHoverPopup from './components/CartHoverPopup';
import CheckoutView from './components/CheckoutView';
import AdminPanel from './components/AdminPanel';
import AdminLoginModal from './components/AdminLoginModal';

import { isFirebaseEnabled, db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

export default function App() {
  // Navigation states: 'home' | 'checkout' | 'admin'
  const [view, setView] = useState<'home' | 'checkout' | 'admin'>('home');

  // Track online/offline status
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);

  // Auto-detect compatibility for Netlify/static hosting with no companion Express API
  const [isApiSupported, setIsApiSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Business Profile Context loaded from api / fallback
  const [config, setConfig] = useState<BusinessConfig>(() => {
    try {
      const saved = localStorage.getItem('bkk_offline_config');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('bkk_offline_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  const [items, setItems] = useState<FoodItem[]>(() => {
    try {
      const saved = localStorage.getItem('bkk_offline_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return DEFAULT_ITEMS;
    } catch {
      return DEFAULT_ITEMS;
    }
  });

  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('bkk_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI state overlays
  const [isHoveredCart, setIsHoveredCart] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('bkk_admin_token');
  });

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Refs for navigation scrolling
  const menuGridRef = useRef<HTMLDivElement>(null);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('bkk_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Sync config, categories, and items to localStorage for consistent offline backup persistence
  useEffect(() => {
    localStorage.setItem('bkk_offline_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('bkk_offline_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('bkk_offline_items', JSON.stringify(items));
  }, [items]);

  // Automatically scroll to top of viewport on route/view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // Load configuration and data from API or Firebase Realtime Sync
  useEffect(() => {
    if (isFirebaseEnabled) {
      console.log("Connecting real-time Firebase listeners...");
      
      const unsubscribeConfig = onSnapshot(doc(db, 'config', 'business_config'), (snapshot) => {
        if (snapshot.exists()) {
          setConfig(snapshot.data() as BusinessConfig);
        } else {
          setConfig(DEFAULT_CONFIG);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'config/business_config');
      });

      const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
        const list: Category[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data() } as Category);
        });
        if (list.length > 0) {
          setCategories(list);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'categories');
      });

      const unsubscribeItems = onSnapshot(collection(db, 'items'), (snapshot) => {
        const list: FoodItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data() } as FoodItem);
        });
        if (list.length > 0) {
          setItems(list);
        } else {
          setItems(DEFAULT_ITEMS);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'items');
      });

      setIsApiSupported(true);

      return () => {
        unsubscribeConfig();
        unsubscribeCategories();
        unsubscribeItems();
      };
    } else {
      fetchConfig();
      fetchCategories();
      fetchItems();
    }
  }, [isFirebaseEnabled]);

  const fetchConfig = async () => {
    try {
      const resp = await fetch('/api/config');
      if (resp.ok && resp.headers.get('content-type')?.includes('application/json')) {
        const data = await resp.json();
        setConfig(data);
        localStorage.setItem('bkk_offline_config', JSON.stringify(data));
        setIsApiSupported(true);
      } else {
        throw new Error("Response is not JSON or not OK");
      }
    } catch (err) {
      console.warn("Detecting Netlify or client-only mode, disabling companion API requests:", err);
      setIsApiSupported(false);
      const saved = localStorage.getItem('bkk_offline_config');
      if (saved) setConfig(JSON.parse(saved));
    }
  };

  const fetchCategories = async () => {
    if (isApiSupported === false) {
      const saved = localStorage.getItem('bkk_offline_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
          return;
        }
      }
      setCategories(DEFAULT_CATEGORIES);
      return;
    }
    try {
      const resp = await fetch('/api/categories');
      if (resp.ok && resp.headers.get('content-type')?.includes('application/json')) {
        const data = await resp.json();
        setCategories(data);
        localStorage.setItem('bkk_offline_categories', JSON.stringify(data));
      } else {
        throw new Error("Response is not JSON or not OK");
      }
    } catch (err) {
      console.warn("Unable to fetch categories, falling back to local simulation:", err);
      const saved = localStorage.getItem('bkk_offline_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
          return;
        }
      }
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  const fetchItems = async () => {
    if (isApiSupported === false) {
      const saved = localStorage.getItem('bkk_offline_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          return;
        }
      }
      setItems(DEFAULT_ITEMS);
      return;
    }
    try {
      const resp = await fetch('/api/items');
      if (resp.ok && resp.headers.get('content-type')?.includes('application/json')) {
        const data = await resp.json();
        setItems(data);
        localStorage.setItem('bkk_offline_items', JSON.stringify(data));
      } else {
        throw new Error("Response is not JSON or not OK");
      }
    } catch (err) {
      console.warn("Unable to fetch items, falling back to local simulation:", err);
      const saved = localStorage.getItem('bkk_offline_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          return;
        }
      }
      setItems(DEFAULT_ITEMS);
    }
  };

  // Cart action utils
  const handleAddToCart = (item: FoodItem) => {
    if (item.stock === 0) return;
    setCartItems((prev) => {
      const existing = prev.find((it) => it.item.id === item.id);
      if (existing) {
        // cap at current available stock
        const newQty = Math.min(existing.quantity + 1, item.stock);
        return prev.map((it) =>
          it.item.id === item.id ? { ...it, quantity: newQty } : it
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
    // Open cart drawer/overlay momentarily to signal successful addition
    setIsHoveredCart(true);
    setTimeout(() => {
      setIsHoveredCart(false);
    }, 2500);
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((it) => it.item.id !== itemId));
  };

  const handleUpdateCartQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(itemId);
      return;
    }
    const storeItem = items.find((i) => i.id === itemId);
    const maxStock = storeItem ? storeItem.stock : 99;

    setCartItems((prev) =>
      prev.map((it) =>
        it.item.id === itemId ? { ...it, quantity: Math.min(newQty, maxStock) } : it
      )
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Send purchase request to backend or generate client-side offline order
  const handlePlaceOrder = async (customerName: string, phone: string): Promise<Order> => {
    const runOfflineSimulation = () => {
      // Simulate safe localized offline token generation
      const lastSerial = localStorage.getItem('bkk_offline_serial') || '9020';
      const nextSerial = parseInt(lastSerial) + 1;
      localStorage.setItem('bkk_offline_serial', nextSerial.toString());
      
      const newOrder: Order = {
        id: "ord_off_" + Date.now(),
        token: `BKK-OFF-${nextSerial}`,
        customerName: customerName.trim(),
        phone: phone.trim(),
        items: cartItems.map((c) => ({
          itemId: c.item.id,
          name: c.item.name,
          price: c.item.price,
          quantity: c.quantity
        })),
        totalAmount: cartSubtotal + (config.deliveryCharge || 0) + parseFloat((cartSubtotal * (config.gstPercent || 0) / 100).toFixed(2)) + (config.serviceFee || 0),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Push into client-side offline pending logs
      const savedQueue = JSON.parse(localStorage.getItem('bkk_offline_orders_queue') || '[]');
      savedQueue.unshift(newOrder);
      localStorage.setItem('bkk_offline_orders_queue', JSON.stringify(savedQueue));

      // Local State Inventory stock deduction
      setItems((prevItems) => {
        const fresh = prevItems.map((item) => {
          const matchCart = cartItems.find((c) => c.item.id === item.id);
          if (matchCart) {
            return { ...item, stock: Math.max(0, item.stock - matchCart.quantity) };
          }
          return item;
        });
        localStorage.setItem('bkk_offline_items', JSON.stringify(fresh));
        return fresh;
      });

      // Inject custom runtime descriptor
      (newOrder as any).isOfflineSimulated = true;
      return newOrder;
    };

    if (isFirebaseEnabled) {
      try {
        const orderId = "ord_" + Date.now();
        const randSerial = Math.floor(1000 + Math.random() * 9000);
        const tokenVal = `BKK-${randSerial}`;
        
        const newOrder: Order = {
          id: orderId,
          token: tokenVal,
          customerName: customerName.trim(),
          phone: phone.trim(),
          items: cartItems.map((c) => ({
            itemId: c.item.id,
            name: c.item.name,
            price: c.item.price,
            quantity: c.quantity
          })),
          totalAmount: cartSubtotal + (config.deliveryCharge || 0) + parseFloat((cartSubtotal * (config.gstPercent || 0) / 100).toFixed(2)) + (config.serviceFee || 0),
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        // Write order doc
        try {
          await setDoc(doc(db, 'orders', orderId), newOrder);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `orders/${orderId}`);
        }

        // Deduct items stocks on Firestore securely in real-time
        for (const cart of cartItems) {
          const dbItem = items.find(i => i.id === cart.item.id);
          if (dbItem) {
            const currentStock = dbItem.stock;
            const updatedStock = Math.max(0, currentStock - cart.quantity);
            try {
              await setDoc(doc(db, 'items', dbItem.id), {
                ...dbItem,
                stock: updatedStock
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.UPDATE, `items/${dbItem.id}`);
            }
          }
        }

        return newOrder;
      } catch (err) {
        console.error("Firestore order placement error, running offline simulation:", err);
        return runOfflineSimulation();
      }
    }

    if (!isOnline || isApiSupported === false) {
      return runOfflineSimulation();
    }

    try {
      const resp = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          phone,
          cartItems: cartItems.map((c) => ({
            item: { id: c.item.id, name: c.item.name },
            quantity: c.quantity
          }))
        })
      });

      if (resp.ok && resp.headers.get('content-type')?.includes('application/json')) {
        const data = await resp.json();
        // Refresh items to display correct stock left
        fetchItems();
        return data.order as Order;
      } else {
        console.warn("Server API returned non-JSON/error response, falling back to local simulation mode");
        setIsApiSupported(false);
        return runOfflineSimulation();
      }
    } catch (err) {
      console.warn("Network error reaching server API, falling back to local simulation mode", err);
      setIsApiSupported(false);
      return runOfflineSimulation();
    }
  };

  const handleAdminLoginSuccess = (token: string) => {
    setAdminToken(token);
    localStorage.setItem('bkk_admin_token', token);
    setView('admin');
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    localStorage.removeItem('bkk_admin_token');
    setView('home');
  };

  const handleCategorySelection = (catId: string | null) => {
    setActiveCategory(catId);
    // Smooth scroll to items grid
    if (menuGridRef.current) {
      menuGridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Compute stats
  const cartSubtotal = cartItems.reduce((acc, c) => acc + (c.item.price * c.quantity), 0);
  const cartItemsCount = cartItems.reduce((acc, c) => acc + c.quantity, 0);

  // Filter products by category & search criteria
  const filteredItems = items.filter((food) => {
    const matchesCategory = activeCategory ? food.category === activeCategory : true;
    const matchesQuery = food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          food.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // Render Admin View
  if (view === 'admin' && adminToken) {
    return (
      <AdminPanel
        token={adminToken}
        onLogout={handleAdminLogout}
        onBackToStore={() => setView('home')}
        config={config}
        onUpdateConfig={async (updated) => setConfig((p) => ({ ...p, ...updated }))}
        categories={categories}
        onUpdateCategories={async (freshCats) => setCategories(freshCats)}
        items={items}
        onUpdateItems={async (freshItems) => setItems(freshItems)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans select-none antialiased selection:bg-orange-600 selection:text-white">
      
      {/* 1. TOP BAR WRAPPER */}
      <header className="bg-white/95 text-stone-800 sticky top-0 z-40 shadow-sm border-b border-stone-100 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 md:px-8 h-18 flex items-center justify-between">
          {/* Logo & Name segment with offline tag */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button id="header-logo-brand" onClick={() => setView('home')} className="flex items-center gap-1.5 sm:gap-2 cursor-pointer text-left min-w-0 pr-1">
              <Logo name={config.name} customLogoUrl={config.logo} />
            </button>
            {!isOnline && (
              <span className="flex-shrink-0 bg-rose-600 border border-rose-500 text-[10px] sm:text-xs font-bold font-sans px-2.5 py-0.5 rounded-full shadow-md text-white tracking-wider uppercase animate-pulse select-none flex items-center gap-1 hover:brightness-110 cursor-default" title="Running in stand-alone offline mode">
                <span className="w-1.5 h-1.5 rounded-full bg-white block animate-ping" />
                Offline
              </span>
            )}
          </div>

          {/* Dynamic search query field (desktop only) */}
          <div className="hidden md:flex items-center bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-1.5 w-64 text-xs transition duration-200 focus-within:ring-1 focus-within:ring-orange-500">
            <Search className="w-4 h-4 text-stone-450 mr-2" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent focus:outline-none text-stone-800 text-xs placeholder:text-stone-400 w-full"
            />
          </div>

          {/* Interactive Navigation Elements */}
          <nav className="flex items-center gap-2 sm:gap-5 md:gap-7 flex-shrink-0">
            <button
              id="nav-menu-home"
              onClick={() => {
                setView('home');
                if (menuGridRef.current) menuGridRef.current.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[11px] sm:text-xs font-black tracking-wider uppercase text-stone-700 hover:text-rose-600 transition cursor-pointer px-1.5 py-1"
            >
              Menu
            </button>
            
            <a
              href="#local-contact-footer"
              className="hidden sm:inline-block text-xs font-black tracking-wider uppercase text-stone-600 hover:text-rose-600 transition cursor-pointer px-1.5 py-1"
            >
              Contact
            </a>

            {/* Admin toggle */}
            {adminToken ? (
              <button
                id="btn-goto-admin"
                onClick={() => setView('admin')}
                className="text-[11px] sm:text-xs font-black tracking-wider uppercase text-rose-600 hover:text-rose-500 flex items-center gap-1 transition cursor-pointer px-1.5 sm:px-2 py-1"
              >
                <UserCheck className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden xs:inline">Admin</span>
              </button>
            ) : (
              <button
                id="btn-trigger-signin"
                onClick={() => setShowLoginModal(true)}
                className="text-[10px] sm:text-xs font-black tracking-wider uppercase text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer bg-stone-50 px-2.5 sm:px-3 text-stone-700 hover:text-stone-900 transition cursor-pointer bg-stone-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-stone-250 flex-shrink-0"
              >
                Sign In
              </button>
            )}

            {/* Cart trigger / Hover state anchor */}
            <div
              className="relative py-2 flex-shrink-0"
              onMouseEnter={() => setIsHoveredCart(true)}
              onMouseLeave={() => setIsHoveredCart(false)}
            >
              <button
                id="btn-topbar-cart-act"
                onClick={() => setView('checkout')}
                className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:brightness-105 rounded-xl border border-rose-400/20 cursor-pointer shadow-sm transition active:scale-95 text-white"
              >
                <div className="relative">
                  <ShoppingCart className="w-4 h-4 text-white" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-2.5 -right-2.5 bg-stone-900 text-white font-mono text-[9px] font-black rounded-full w-4.5 h-4.5 flex items-center justify-center animate-bounce border border-white">
                      {cartItemsCount}
                    </span>
                  )}
                </div>
                
                <span className="text-xs font-black text-rose-50 hidden sm:inline">
                  &#8377;{cartSubtotal}
                </span>
              </button>

              {/* Hover Dropdown popup card */}
              {isHoveredCart && (
                <div className="absolute right-0 top-full pt-1 z-50 animate-fade-in shadow-2xl">
                  <CartHoverPopup
                    cartItems={cartItems}
                    onRemoveItem={handleRemoveCartItem}
                    onCheckout={() => {
                      setView('checkout');
                      setIsHoveredCart(false);
                    }}
                    onClose={() => setIsHoveredCart(false)}
                  />
                </div>
              )}
            </div>
          </nav>
        </div>
        {/* Decorative Indian Spices Multi-color Accent Bar */}
        <div className="h-[3px] bg-gradient-to-r from-[#e11d48] via-[#ea580c] via-[#ca8a04] to-[#16a34a] w-full" />
      </header>

      {/* VIEW 2: CHECKOUT SCREEN WORKSPACE */}
      {view === 'checkout' ? (
        <div className="flex-1 bg-stone-50">
          <CheckoutView
            cartItems={cartItems}
            onRemoveItem={handleRemoveCartItem}
            onUpdateQuantity={handleUpdateCartQuantity}
            onPlaceOrder={handlePlaceOrder}
            onBackToMenu={() => setView('home')}
            onClearCart={handleClearCart}
            config={config}
          />
        </div>
      ) : (
        /* VIEW 1: LANDING STOREFRONT HOME */
        <main className="flex-1 max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-12 w-full">
          
          {/* Quick Notice Banner info */}
          <div className="bg-gradient-to-r from-amber-50 to-rose-50/50 border border-amber-100 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-stone-900 text-xs shadow-xs hover:shadow-sm transition-all duration-300">
            <div className="flex items-center gap-2.5 font-medium">
              <Sparkles className="w-4 h-4 text-orange-600 flex-shrink-0 animate-pulse" />
              <span>We deliver piping-hot delicious recipes directly to your venue in <b className="font-extrabold text-orange-950 bg-orange-100/40 px-1.5 py-0.5 rounded-md">Hansquea</b>! Token system instant bookings.</span>
            </div>
            <div className="flex items-center gap-2 font-bold bg-white/90 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-amber-200/40 shadow-2xs self-start md:self-auto">
              <Phone className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
              <span className="text-stone-900 tracking-wide">Order & Collect: +91-9475476265</span>
            </div>
          </div>

          {/* Row 2: Slideshow Component */}
          <SlideShow />

          {/* Row 3: Categories selection Cards */}
          <section id="menu-categories-block" className="pt-4">
            <CategoryCards
              categories={categories}
              activeCategory={activeCategory}
              onSelectCategory={handleCategorySelection}
            />
          </section>

          {/* Row 4: Culinary Menu Items grid listing with Search and Filters */}
          <section ref={menuGridRef} className="space-y-6 pt-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
              <div>
                <h3 className="text-xl font-extrabold text-[#ea580c] font-sans tracking-tight">
                  {activeCategory 
                    ? `Freshly Cooked ${categories.find(c => c.id === activeCategory)?.name || activeCategory} Items`
                    : "Full Gastronomic Menu Board"
                  }
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Hover over the cart to review your choices. Select your delicious food and proceed below.
                </p>
              </div>

              {/* Mobile Search widget */}
              <div className="flex md:hidden items-center bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-xs w-full focus-within:ring-1 focus-within:ring-orange-500">
                <Search className="w-3.5 h-3.5 text-stone-400 mr-2" />
                <input
                  type="text"
                  placeholder="Query menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent focus:outline-none text-stone-900 w-full"
                />
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="p-16 text-center max-w-md mx-auto">
                <AlertCircle className="w-10 h-10 text-orange-500/60 mx-auto mb-3" />
                <h4 className="text-base font-bold text-stone-800 mb-1">No items match your criteria</h4>
                <p className="text-xs text-gray-400">Please try adjusting your filters, searching for something else, or viewing a different category above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredItems.map((food) => {
                  const isOutOfStock = food.stock === 0;
                  const itemInCart = cartItems.find((it) => it.item.id === food.id);
                  const isMaxAdded = itemInCart ? itemInCart.quantity >= food.stock : false;

                  return (
                    <div
                      key={food.id}
                      className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-lg transition duration-300 group relative"
                    >
                      {/* Cart increment indicator badge */}
                      {itemInCart && (
                        <span className="absolute top-3 right-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-full z-15 shadow-md flex items-center gap-1">
                          <span>Added: {itemInCart.quantity}</span>
                        </span>
                      )}

                      {/* Photo Header */}
                      <div className="relative h-44 bg-stone-100 overflow-hidden w-full">
                        {food.image ? (
                          <img
                            src={food.image}
                            alt={food.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-orange-900 bg-amber-50">
                            Basak Khana Khajana
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
                        
                        <div className="absolute bottom-3 left-3">
                          <span className="inline-block px-2.5 py-0.5 bg-white/90 text-rose-800 backdrop-blur-sm text-[10px] uppercase font-black tracking-wider rounded">
                            {categories.find(c => c.id === food.category)?.name || food.category}
                          </span>
                        </div>
                      </div>

                      {/* Text descriptions */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-stone-900 text-sm font-sans line-clamp-1" title={food.name}>
                            {food.name}
                          </h4>
                          {food.description && (
                            <p className="text-[11px] text-stone-550 line-clamp-2 leading-relaxed mt-0.5" title={food.description}>
                              {food.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-stone-500 text-[11px] font-semibold">Available Stock</span>
                            <span className={`text-[11px] font-mono font-bold ${isOutOfStock ? "text-rose-500 font-extrabold" : food.stock <= 5 ? "text-orange-600" : "text-stone-600"}`}>
                              {isOutOfStock ? "SOLD OUT" : `${food.stock} plates left`}
                            </span>
                          </div>
                        </div>

                        {/* Price & Cart option button */}
                        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                          <span className="text-base font-black text-stone-900 font-mono">
                            &#8377;{food.price}
                          </span>

                          <button
                            id={`btn-add-to-cart-${food.id}`}
                            onClick={() => handleAddToCart(food)}
                            disabled={isOutOfStock || isMaxAdded}
                            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition duration-200 cursor-pointer ${
                              isOutOfStock
                                ? "bg-stone-150 text-stone-400 cursor-not-allowed"
                                : isMaxAdded
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-100 cursor-not-allowed"
                                : "bg-gradient-to-r from-rose-500 to-orange-500 hover:brightness-105 text-white shadow hover:shadow-md active:scale-95"
                            }`}
                          >
                            {isOutOfStock ? (
                              "Out of stock"
                            ) : isMaxAdded ? (
                              "Stock reached"
                            ) : (
                              "Add to Cart +"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Quick Stats overview panel */}
          {cartItemsCount > 0 && (
            <div className="bg-gradient-to-r from-[#e11d48] via-[#ea580c] to-[#ca8a04] text-white rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div>
                <h4 className="font-bold text-sm">You have chosen delicious items ready for cooking</h4>
                <p className="text-[11px] text-rose-100 mt-1">Review your summary in the top right tray or checkout immediately below.</p>
              </div>
              <button
                id="btn-inline-checkout-trigger"
                onClick={() => setView('checkout')}
                className="px-6 py-2.5 bg-stone-950 hover:bg-stone-900 text-white font-black text-xs rounded-xl cursor-pointer self-start sm:self-auto transition active:scale-95 shadow-lg border border-stone-800"
              >
                Go to Checkout Page &rarr;
              </button>
            </div>
          )}

        </main>
      )}

      {/* 5. FOOTER LAYOUT DISPLAYING GOOGLE MAPS & CORPORATE DETAILS */}
      <footer id="local-contact-footer" className="bg-stone-900 text-gray-300 border-t border-stone-800 mt-16 pb-6">
        
        {/* ROW 1: Google Maps Area */}
        <div className="w-full h-[280px] bg-stone-800 relative select-none">
          {config.mapIframeUrl && config.mapIframeUrl.trim() !== "" ? (
            <iframe
              title="Basak Khana Khajana Hansquea Local Maps Pin"
              src={config.mapIframeUrl}
              className="w-full h-full border-0 grayscale opacity-80"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="w-full h-full bg-stone-800 flex items-center justify-center text-stone-500 font-medium">
              Loading Google Maps...
            </div>
          )}
          {/* visual card float over map */}
          <div className="absolute top-4 left-4 bg-stone-900/90 backdrop-blur-md p-4 rounded-xl border border-stone-750 max-w-xs text-xs space-y-2.5 shadow-xl select-all">
            <div className="flex items-center gap-1.5 font-bold text-white text-xs">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span>Our Kitchen Coordinates</span>
            </div>
            <p className="text-gray-300 text-[11px] leading-relaxed">
              {config.location}
            </p>
            <span className="block text-[10px] text-emerald-400 font-bold font-mono">
              ★ Highly Rated Food Spot in Tarbanda
            </span>
          </div>
        </div>

        {/* ROW 2: About us, contact information */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-10 grid grid-cols-1 md:grid-cols-12 gap-8 text-xs">
          
          {/* About Us column */}
          <div className="md:col-span-5 space-y-3">
            <h4 className="text-sm font-extrabold text-white font-sans uppercase tracking-wider">About our business</h4>
            <p className="text-gray-400 leading-relaxed font-sans pr-4">
              {config.about}
            </p>
            <div className="flex items-center gap-1.5 text-orange-400 font-bold mt-2">
              <Clock className="w-4 h-4" />
              <span>We cook fresh morning meals & late dinners &mdash; 7 AM to 10 PM daily</span>
            </div>
          </div>

          {/* Contact Details Column */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-sm font-extrabold text-white font-sans uppercase tracking-wider">Contact Information</h4>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span className="text-gray-400 leading-relaxed">{config.address}</span>
              </div>
              
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white uppercase text-[10px] tracking-widest block">Primary Order Hotlines:</span>
                  {config.contacts.map((contact, i) => (
                    <a key={i} href={`tel:${contact}`} className="font-mono text-xs text-orange-400 hover:text-orange-300 block">
                      {contact}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fast Navigation & Admin Access Disclaimer */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-sm font-extrabold text-white font-sans uppercase tracking-wider">Store Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <button id="foot-nav-breakfast" onClick={() => handleCategorySelection('breakfast')} className="hover:text-orange-400 transition cursor-pointer">
                  Breakfast specials & kachoris
                </button>
              </li>
              <li>
                <button id="foot-nav-lunch" onClick={() => handleCategorySelection('lunch')} className="hover:text-orange-400 transition cursor-pointer">
                  Traditional Bengali Lunches
                </button>
              </li>
              <li>
                <button id="foot-nav-fastfood" onClick={() => handleCategorySelection('fastfood')} className="hover:text-orange-400 transition cursor-pointer">
                  Evening Quick Momos & Chowmein
                </button>
              </li>
              <li>
                <button id="foot-nav-dinner" onClick={() => handleCategorySelection('dinner')} className="hover:text-orange-400 transition cursor-pointer">
                  Mouthwatering Naan Curries
                </button>
              </li>
            </ul>
            
            <div className="pt-3 border-t border-stone-850 flex items-center justify-between text-[10px] text-gray-500">
              <span>Basak Khana Khajana &copy; 2026</span>
              <button
                id="btn-admin-portal-link"
                onClick={() => {
                  if (adminToken) setView('admin');
                  else setShowLoginModal(true);
                }}
                className="text-[10px] text-rose-500 hover:text-rose-400 font-bold transition underline"
              >
                Access staff panel &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* copyright notes lines */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 border-t border-stone-800 mt-8 pt-6 text-center text-[10px] text-stone-500 leading-relaxed font-sans">
          This catering, takeout and meal order platform is powered by highly secured micro-services. All tokens and serial indices are printed locally for direct food reservations. Freshness, hygiene, and authentic spices cooked at Hansquea, Dulur chhat, P.O-Tarbanda, Darjeeling.
        </div>
      </footer>

      {/* ADMIN SIGN IN DIALOG PORTAL */}
      {showLoginModal && (
        <AdminLoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleAdminLoginSuccess}
        />
      )}
      
    </div>
  );
}
