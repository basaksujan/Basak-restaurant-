import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { BusinessConfig, Category, FoodItem, Order, Slide } from './src/types.js';

const app = express();
const PORT = 3000;

// Set up directory and database path
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'database.json');

// Ensure database file and uploads folder exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default initial data for database
const DEFAULT_CONFIG: BusinessConfig = {
  name: "basak khana khajana",
  logo: "", // default custom brand SVG gets loaded in frontend if logo is empty
  location: "Hansquea, Dulur chhat, P.O-Tarbanda, Dist-Darjeeling, Pin-734014",
  address: "Hansquea, Dulur chhat, P.O-Tarbanda, Dist-Darjeeling, Pin-734014",
  contacts: ["+91-9475476265", "+91-9800416889"],
  about: "Welcome to Basak KHANA KHAJANA! Nestled in the quiet, scenic paths of Darjeeling, we are dedicated to crafting authentic, delicious, and heartwarming home-style cooking. Whether you are craving a hearty breakfast to kickstart your day, a nourishing traditional thali lunch, spicy local fast food, or a relaxing dinner with family, we prepare every dish with pure passion, fresh local ingredients, and strict hygiene. Order now and savor the true taste of Hansquea!",
  mapIframeUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14243.601901452818!2d88.25895027581333!3d26.81125211993202!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39e440fe2df014dd%3A0xe6bf44bc0fe0bcdc!2sHansqua!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
  deliveryCharge: 0,
  gstPercent: 0,
  serviceFee: 0
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: "breakfast", name: "Breakfast" },
  { id: "lunch", name: "Lunch" },
  { id: "fastfood", name: "Fast Food" },
  { id: "dinner", name: "Dinner" },
  { id: "milk-tea", name: "Milk Tea" },
  { id: "black-tea", name: "Black Tea" },
  { id: "green-tea", name: "Green Tea" }
];

const DEFAULT_ITEMS: FoodItem[] = [
  {
    id: "item1",
    name: "Alpini Kachori Sabzi",
    category: "breakfast",
    price: 30,
    stock: 50,
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item2",
    name: "Golden Toast & Double Omelette",
    category: "breakfast",
    price: 45,
    stock: 40,
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item3",
    name: "Traditional Bengali Fish Thali",
    category: "lunch",
    price: 130,
    stock: 25,
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item4",
    name: "Special Desi Chicken Thali",
    category: "lunch",
    price: 160,
    stock: 30,
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item5",
    name: "Darjeeling Style Chicken Chowmein",
    category: "fastfood",
    price: 80,
    stock: 45,
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item6",
    name: "Double Egg Chicken Roll",
    category: "fastfood",
    price: 75,
    stock: 35,
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=600&q=80" // placeholder roll
  },
  {
    id: "item7",
    name: "Soft Butter Naan & Chicken Kasha",
    category: "dinner",
    price: 140,
    stock: 20,
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item8",
    name: "Flavourful Fried Rice & Chili Chicken",
    category: "dinner",
    price: 150,
    stock: 25,
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80"
  }
];

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

interface DBState {
  config: BusinessConfig;
  categories: Category[];
  items: FoodItem[];
  orders: Order[];
  nextOrderSerial: number;
  adminUsername?: string;
  adminPassword?: string;
  slides?: Slide[];
}

function loadDB(): DBState {
  if (!fs.existsSync(DB_PATH)) {
    const initialState: DBState = {
      config: DEFAULT_CONFIG,
      categories: DEFAULT_CATEGORIES,
      items: DEFAULT_ITEMS,
      orders: [],
      nextOrderSerial: 1001,
      adminUsername: "admin",
      adminPassword: "admin123",
      slides: DEFAULT_SLIDES
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialState, null, 2), 'utf8');
    return initialState;
  }
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(data) as DBState;
    if (!parsed.adminUsername) {
      parsed.adminUsername = "admin";
    }
    if (!parsed.adminPassword) {
      parsed.adminPassword = "admin123";
    }
    if (!parsed.slides || parsed.slides.length === 0) {
      parsed.slides = DEFAULT_SLIDES;
    }

    // Auto-inject new tea categories if they are missing
    const requiredCats = [
      { id: "milk-tea", name: "Milk Tea" },
      { id: "black-tea", name: "Black Tea" },
      { id: "green-tea", name: "Green Tea" }
    ];
    let dbUpdated = false;
    if (!parsed.categories) {
      parsed.categories = [];
    }
    for (const reqCat of requiredCats) {
      if (!parsed.categories.some(c => c.id === reqCat.id)) {
        parsed.categories.push(reqCat);
        dbUpdated = true;
      }
    }
    if (dbUpdated) {
      fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf8');
    }

    return parsed;
  } catch (err) {
    console.error("Error reading database file, returning defaults", err);
    return {
      config: DEFAULT_CONFIG,
      categories: DEFAULT_CATEGORIES,
      items: DEFAULT_ITEMS,
      orders: [],
      nextOrderSerial: 1001,
      adminUsername: "admin",
      adminPassword: "admin123",
      slides: DEFAULT_SLIDES
    };
  }
}

function saveDB(state: DBState) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing database file", err);
  }
}

// Support large Base64 payloads for uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Admin Verification helper
const ADMIN_TOKEN = "BASAK_ADMIN_SECURE_TOKEN_2026";
function checkAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: "Unauthorized access" });
  }
  next();
}

// API Routes

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const db = loadDB();
  if (username === db.adminUsername && password === db.adminPassword) {
    res.json({ token: ADMIN_TOKEN, success: true });
  } else {
    res.status(401).json({ error: "Invalid username or password" });
  }
});

// Get Admin Username (never return password)
app.get('/api/admin/username', checkAdminAuth, (req, res) => {
  const db = loadDB();
  res.json({ username: db.adminUsername || "admin" });
});

// Update Admin Sign-in Credentials
app.post('/api/admin/credentials', checkAdminAuth, (req, res) => {
  const db = loadDB();
  const { username, password } = req.body;
  if (!username || username.trim() === "") {
    return res.status(400).json({ error: "Username cannot be empty" });
  }
  if (!password || password.trim() === "") {
    return res.status(400).json({ error: "Password cannot be empty" });
  }
  db.adminUsername = username.trim();
  db.adminPassword = password.trim();
  saveDB(db);
  res.json({ success: true, message: "Credentials updated successfully" });
});

// Get Firebase Client Config Settings
app.get('/api/admin/firebase-config', checkAdminAuth, (req, res) => {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, 'utf8');
      const parsed = JSON.parse(raw);
      return res.json(parsed);
    } catch (e) {
      return res.status(500).json({ error: "Failed to parse firebase-applet-config.json" });
    }
  }
  return res.json({});
});

// Update Firebase Client Config Settings
app.post('/api/admin/firebase-config', checkAdminAuth, (req, res) => {
  const { apiKey, authDomain, projectId, appId, firestoreDatabaseId, storageBucket, messagingSenderId } = req.body;
  
  if (!apiKey || !authDomain || !projectId || !appId) {
    return res.status(400).json({ error: "Missing required Firebase fields (apiKey, authDomain, projectId, and appId are required)." });
  }

  const newConfig = {
    projectId: projectId.trim(),
    appId: appId.trim(),
    apiKey: apiKey.trim(),
    authDomain: authDomain.trim(),
    firestoreDatabaseId: (firestoreDatabaseId || "").trim(),
    storageBucket: (storageBucket || "").trim(),
    messagingSenderId: (messagingSenderId || "").trim(),
    measurementId: ""
  };

  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  try {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
    res.json({ success: true, message: "Firebase credentials updated successfully on server! Please reload the page." });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to write config file on server: ${err.message}` });
  }
});

// Get Business Details
app.get('/api/config', (req, res) => {
  const db = loadDB();
  res.json(db.config);
});

// Update Business Details
app.post('/api/config', checkAdminAuth, (req, res) => {
  const db = loadDB();
  db.config = { ...db.config, ...req.body };
  saveDB(db);
  res.json({ success: true, config: db.config });
});

// Get Categories
app.get('/api/categories', (req, res) => {
  const db = loadDB();
  res.json(db.categories);
});

// Create/Update Category
app.post('/api/categories', checkAdminAuth, (req, res) => {
  const db = loadDB();
  const cat: Category = req.body;
  if (!cat.name) {
    return res.status(400).json({ error: "Category name is required" });
  }
  if (!cat.id) {
    // New Category
    cat.id = cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    db.categories.push(cat);
  } else {
    // Update Category
    const index = db.categories.findIndex(c => c.id === cat.id);
    if (index !== -1) {
      db.categories[index] = cat;
    } else {
      db.categories.push(cat);
    }
  }
  saveDB(db);
  res.json({ success: true, categories: db.categories });
});

// Delete Category
app.delete('/api/categories/:id', checkAdminAuth, (req, res) => {
  const db = loadDB();
  const { id } = req.params;
  db.categories = db.categories.filter(c => c.id !== id);
  // Optional: items falling under deleted category could be moved to unassigned
  saveDB(db);
  res.json({ success: true, categories: db.categories });
});

// Get Items
app.get('/api/items', (req, res) => {
  const db = loadDB();
  res.json(db.items);
});

// Create/Update Item
app.post('/api/items', checkAdminAuth, (req, res) => {
  const db = loadDB();
  const item: FoodItem = req.body;
  
  if (!item.name || !item.category || item.price === undefined) {
    return res.status(400).json({ error: "Missing required product details" });
  }

  if (!item.id) {
    // New Item
    item.id = "item_" + Date.now();
    db.items.push(item);
  } else {
    // Update Existing
    const index = db.items.findIndex(i => i.id === item.id);
    if (index !== -1) {
      db.items[index] = item;
    } else {
      db.items.push(item);
    }
  }
  saveDB(db);
  res.json({ success: true, items: db.items });
});

// Delete Item
app.delete('/api/items/:id', checkAdminAuth, (req, res) => {
  const db = loadDB();
  const { id } = req.params;
  db.items = db.items.filter(i => i.id !== id);
  saveDB(db);
  res.json({ success: true, items: db.items });
});

// Get Orders
app.get('/api/orders', checkAdminAuth, (req, res) => {
  const db = loadDB();
  res.json(db.orders);
});

// Get slides
app.get('/api/slides', (req, res) => {
  const db = loadDB();
  res.json(db.slides || []);
});

// Create or update slide
app.post('/api/slides', checkAdminAuth, (req, res) => {
  const db = loadDB();
  const slide: Slide = req.body;
  
  if (!slide.image || !slide.title) {
    return res.status(400).json({ error: "Missing required slide details (image or title)" });
  }

  if (!db.slides) {
    db.slides = [];
  }

  if (!slide.id) {
    // New slide
    slide.id = "slide_" + Date.now();
    db.slides.push(slide);
  } else {
    // Update existing slide
    const index = db.slides.findIndex(s => s.id === slide.id);
    if (index !== -1) {
      db.slides[index] = slide;
    } else {
      db.slides.push(slide);
    }
  }

  saveDB(db);
  res.json({ success: true, slides: db.slides });
});

// Delete slide
app.delete('/api/slides/:id', checkAdminAuth, (req, res) => {
  const db = loadDB();
  const { id } = req.params;
  
  if (db.slides) {
    db.slides = db.slides.filter(s => s.id !== id);
    saveDB(db);
  }
  
  res.json({ success: true, slides: db.slides || [] });
});

// Update Order status
app.post('/api/orders/:id/status', checkAdminAuth, (req, res) => {
  const db = loadDB();
  const { id } = req.params;
  const { status } = req.body;
  const orderIdx = db.orders.findIndex(o => o.id === id);
  if (orderIdx !== -1) {
    db.orders[orderIdx].status = status;
    saveDB(db);
    res.json({ success: true, order: db.orders[orderIdx] });
  } else {
    res.status(404).json({ error: "Order not found" });
  }
});

// Create Order (customer place order)
app.post('/api/orders', (req, res) => {
  const db = loadDB();
  const { customerName, phone, cartItems } = req.body;

  if (!customerName || !phone || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ error: "Customer name, phone, and cart items are required" });
  }

  // Double check inventory and calculate total
  let subtotal = 0;
  const orderedItems: any[] = [];

  for (const cart of cartItems) {
    const dbItem = db.items.find(i => i.id === cart.item.id);
    if (!dbItem) {
      return res.status(404).json({ error: `Item ${cart.item.name} not found in inventory` });
    }
    if (dbItem.stock < cart.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${dbItem.name}. Only ${dbItem.stock} items left.` });
    }

    // Deduct stock
    dbItem.stock -= cart.quantity;
    subtotal += dbItem.price * cart.quantity;
    orderedItems.push({
      itemId: dbItem.id,
      name: dbItem.name,
      price: dbItem.price,
      quantity: cart.quantity
    });
  }

  const deliveryCharge = db.config.deliveryCharge || 0;
  const gstPercent = db.config.gstPercent || 0;
  const serviceFee = db.config.serviceFee || 0;
  const gstAmount = parseFloat((subtotal * gstPercent / 100).toFixed(2));
  const totalAmount = parseFloat((subtotal + deliveryCharge + gstAmount + serviceFee).toFixed(2));

  // Generate unique serial token with format BKK-<serial>
  const serial = db.nextOrderSerial;
  db.nextOrderSerial += 1;
  const token = `BKK-${serial}`;

  const newOrder: Order = {
    id: "ord_" + Date.now(),
    token,
    customerName,
    phone,
    items: orderedItems,
    totalAmount,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  db.orders.unshift(newOrder); // Add to beginning of order list
  saveDB(db);

  res.json({ success: true, order: newOrder });
});

// Vite Middleware for assets in local environment or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
