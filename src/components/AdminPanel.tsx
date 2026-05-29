import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  FileText,
  Tag,
  PlusCircle,
  ShoppingBag,
  Building,
  Upload,
  Info,
  DollarSign,
  Package,
  Check,
  X,
  Trash2,
  ExternalLink,
  Edit,
  ArrowLeft,
  Lock,
  Sparkles,
  MessageSquare,
  Printer,
  Cloud,
  AlertCircle
} from 'lucide-react';
import { BusinessConfig, Category, FoodItem, Order, Slide } from '../types';
import ThermalPrintModal from './ThermalPrintModal';

import { isFirebaseEnabled, db, auth, handleFirestoreError, OperationType, activeConfig } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';

interface AdminPanelProps {
  token: string;
  onLogout: () => void;
  onBackToStore: () => void;
  config: BusinessConfig;
  onUpdateConfig: (newConfig: Partial<BusinessConfig>) => Promise<void>;
  categories: Category[];
  onUpdateCategories: (newCats: Category[]) => Promise<void>;
  items: FoodItem[];
  onUpdateItems: (newItems: FoodItem[]) => Promise<void>;
}

export default function AdminPanel({
  token,
  onLogout,
  onBackToStore,
  config,
  onUpdateConfig,
  categories,
  onUpdateCategories,
  items,
  onUpdateItems,
}: AdminPanelProps) {
  // Navigation tabs: 'orders' | 'business' | 'categories' | 'items' | 'credentials' | 'slides' | 'firebase'
  const [activeTab, setActiveTab] = useState<'orders' | 'business' | 'categories' | 'items' | 'credentials' | 'slides' | 'firebase'>('orders');

  // DB Lists fetched from endpoints
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLodingOrders, setIsLoadingOrders] = useState(false);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  // Form states
  const [bizForm, setBizForm] = useState<BusinessConfig>({ ...config });
  const [bizLogoBase64, setBizLogoBase64] = useState<string>(config.logo);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Admin Credentials form state
  const [adminUser, setAdminUser] = useState('admin');
  const [adminPass, setAdminPass] = useState('');
  const [adminPassConfirm, setAdminPassConfirm] = useState('');
  const [credStatus, setCredStatus] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSavingCreds, setIsSavingCreds] = useState(false);

  // Categories forms state
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('amber');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatColor, setEditingCatColor] = useState('amber');

  // FoodItems forms state
  const [itemForm, setItemForm] = useState<Partial<FoodItem>>({
    name: '',
    category: categories[0]?.id || 'breakfast',
    price: 0,
    stock: 20,
    image: '',
    description: ''
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemImgBase64, setItemImgBase64] = useState<string>('');

  // Slideshow Banners forms state
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isLoadingSlides, setIsLoadingSlides] = useState(false);
  const [slideForm, setSlideForm] = useState<Partial<Slide>>({
    tag: '',
    title: '',
    subtitle: '',
    image: ''
  });
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [slideImgBase64, setSlideImgBase64] = useState<string>('');
  const [slideStatus, setSlideStatus] = useState<{ text: string; isError: boolean } | null>(null);

  // Firebase Config Form UI
  const [fbApiKey, setFbApiKey] = useState('');
  const [fbAuthDomain, setFbAuthDomain] = useState('');
  const [fbProjectId, setFbProjectId] = useState('');
  const [fbAppId, setFbAppId] = useState('');
  const [fbFirestoreDatabaseId, setFbFirestoreDatabaseId] = useState('');
  const [fbStorageBucket, setFbStorageBucket] = useState('');
  const [fbMessagingSenderId, setFbMessagingSenderId] = useState('');
  const [fbIsSaving, setFbIsSaving] = useState(false);
  const [fbSaveStatus, setFbSaveStatus] = useState<{ text: string; isError: boolean } | null>(null);

  // Troubleshooting Popup Modal for Firebase Writes blockers
  const [troubleError, setTroubleError] = useState<{ origin: string; message: string } | null>(null);

  useEffect(() => {
    // Try to load local override first
    try {
      const localOverrideStr = localStorage.getItem('basak_khana_khajana_firebase_override');
      if (localOverrideStr) {
        const data = JSON.parse(localOverrideStr);
        setFbApiKey(data.apiKey || '');
        setFbAuthDomain(data.authDomain || '');
        setFbProjectId(data.projectId || '');
        setFbAppId(data.appId || '');
        setFbFirestoreDatabaseId(data.firestoreDatabaseId || '');
        setFbStorageBucket(data.storageBucket || '');
        setFbMessagingSenderId(data.messagingSenderId || '');
      }
    } catch (e) {
      console.error("Error reading localStorage:", e);
    }

    const fetchFirebaseConfig = async () => {
      try {
        const response = await fetch('/api/admin/firebase-config', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          // Only overwrite input form values if there was no custom saved override
          setFbApiKey(prev => prev || data.apiKey || '');
          setFbAuthDomain(prev => prev || data.authDomain || '');
          setFbProjectId(prev => prev || data.projectId || '');
          setFbAppId(prev => prev || data.appId || '');
          setFbFirestoreDatabaseId(prev => prev || data.firestoreDatabaseId || '');
          setFbStorageBucket(prev => prev || data.storageBucket || '');
          setFbMessagingSenderId(prev => prev || data.messagingSenderId || '');
        }
      } catch (err) {
        console.error("Failed to fetch Firebase config:", err);
      }
    };
    fetchFirebaseConfig();
  }, [token]);

  const handleUpdateFirebaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setFbIsSaving(true);
    setFbSaveStatus(null);

    const configPayload = {
      apiKey: fbApiKey.trim(),
      authDomain: fbAuthDomain.trim(),
      projectId: fbProjectId.trim(),
      appId: fbAppId.trim(),
      firestoreDatabaseId: fbFirestoreDatabaseId.trim(),
      storageBucket: fbStorageBucket.trim(),
      messagingSenderId: fbMessagingSenderId.trim()
    };

    // 1. ALWAYS persist in localStorage so client-side works immediately (including on Netlify)
    try {
      localStorage.setItem('basak_khana_khajana_firebase_override', JSON.stringify(configPayload));
    } catch (err: any) {
      console.error("Failed to save config to localStorage:", err);
    }

    // 2. Safely try to make HTTP request to save to backend (which only works in full-stack mode)
    try {
      const response = await fetch('/api/admin/firebase-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(configPayload)
      });

      if (response.ok) {
        setFbSaveStatus({ text: "Firebase credentials stored locally in your browser AND updated on the server successfully! Please reload the page to apply changes.", isError: false });
      } else {
        const data = await response.json();
        setFbSaveStatus({ text: `Parameters saved locally in your browser! Note: Server update rejected (${data.error || 'Server error'}). If you are on Netlify static hosting, this is expected - reload the page now to refresh!`, isError: false });
      }
    } catch (err: any) {
      console.log("Server API not available (expected on static Netlify). Saved locally.", err);
      setFbSaveStatus({ text: "Firebase credentials successfully saved in your browser's LocalStorage! This Netlify page is now connected directly to your custom Firebase DB. Please reload the page now.", isError: false });
    } finally {
      setFbIsSaving(false);
    }
  };

  // Track Firebase authenticated state dynamically
  const [firebaseUser, setFirebaseUser] = useState<any>(auth?.currentUser || null);

  useEffect(() => {
    if (isFirebaseEnabled && auth) {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        setFirebaseUser(user);
      });
      return () => unsubscribe();
    }
  }, []);

  // Fetch orders on load or subscribe in real-time when Firebase is active
  useEffect(() => {
    if (isFirebaseEnabled) {
      console.log("AdminPanel: Subscribing to real-time orders...");
      const colRef = collection(db, 'orders');
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data() } as Order);
        });
        // Sort descending by createdAt
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(list);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'orders');
      });
      return () => unsubscribe();
    } else {
      fetchOrders();
    }
  }, [token, isFirebaseEnabled]);

  // Sync state with parent props if config updates
  useEffect(() => {
    setBizForm({ ...config });
    setBizLogoBase64(config.logo);
  }, [config]);

  // Fetch admin username when credentials tab is active
  useEffect(() => {
    if (activeTab === 'credentials') {
      fetchAdminUsername();
    }
  }, [activeTab]);

  const fetchAdminUsername = async () => {
    try {
      const resp = await fetch('/api/admin/username', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setAdminUser(data.username);
      }
    } catch (err) {
      console.error("Error loading admin username", err);
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser.trim()) {
      setCredStatus({ text: "Username cannot be empty", isError: true });
      return;
    }
    if (!adminPass) {
      setCredStatus({ text: "Please provide a new password", isError: true });
      return;
    }
    if (adminPass !== adminPassConfirm) {
      setCredStatus({ text: "Passwords do not match", isError: true });
      return;
    }

    setIsSavingCreds(true);
    setCredStatus(null);

    try {
      const resp = await fetch('/api/admin/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: adminUser.trim(),
          password: adminPass
        })
      });

      if (resp.ok) {
        setCredStatus({ text: "Sign-in credentials changed successfully! You can sign-in with your new username and password next time.", isError: false });
        setAdminPass('');
        setAdminPassConfirm('');
      } else {
        const data = await resp.json();
        setCredStatus({ text: data.error || "Failed to update credentials", isError: true });
      }
    } catch (err) {
      setCredStatus({ text: "Connection error. Failed to save credentials", isError: true });
    } finally {
      setIsSavingCreds(false);
    }
  };

  // Load slides when 'slides' tab is active or subscribe in real-time when Firebase is active
  useEffect(() => {
    if (activeTab === 'slides') {
      if (isFirebaseEnabled) {
        console.log("AdminPanel: Subscribing to real-time slides...");
        const colRef = collection(db, 'slides');
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
          const list: Slide[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ ...docSnap.data() } as Slide);
          });
          setSlides(list);
          localStorage.setItem('bkk_offline_slides', JSON.stringify(list));
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'slides');
        });
        return () => unsubscribe();
      } else {
        fetchSlides();
      }
    }
  }, [activeTab, isFirebaseEnabled]);

  const fetchSlides = async () => {
    setIsLoadingSlides(true);
    try {
      const resp = await fetch('/api/slides');
      if (resp.ok && resp.headers.get('content-type')?.includes('application/json')) {
        const data = await resp.json();
        setSlides(data);
        localStorage.setItem('bkk_offline_slides', JSON.stringify(data));
      } else {
        const saved = localStorage.getItem('bkk_offline_slides');
        if (saved) setSlides(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Error fetching slides", err);
      const saved = localStorage.getItem('bkk_offline_slides');
      if (saved) setSlides(JSON.parse(saved));
    } finally {
      setIsLoadingSlides(false);
    }
  };

  const handleSlideImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setSlideStatus({ text: "File is too large! Please choose an image smaller than 5MB.", isError: true });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const compressed = await compressImage(base64String, 900, 450, 0.75);
        setSlideImgBase64(compressed);
        setSlideForm(prev => ({ ...prev, image: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    setSlideStatus(null);

    const imageToSave = slideForm.image || slideImgBase64;
    if (!imageToSave) {
      setSlideStatus({ text: "Please upload an image or provide an image link first", isError: true });
      return;
    }
    if (!slideForm.title?.trim()) {
      setSlideStatus({ text: "Please provide a headline title for the slide writing", isError: true });
      return;
    }

    const payload: Partial<Slide> = {
      image: imageToSave,
      title: slideForm.title.trim(),
      subtitle: (slideForm.subtitle || '').trim(),
      tag: (slideForm.tag || '').trim()
    };

    if (editingSlideId) {
      payload.id = editingSlideId;
    }

    const nextSlide: Slide = {
      id: payload.id || 'slide_off_' + Date.now(),
      image: payload.image!,
      title: payload.title!,
      subtitle: payload.subtitle || '',
      tag: payload.tag || ''
    };

    if (isFirebaseEnabled) {
      try {
        const id = payload.id || 'slide_' + Date.now();
        const finalSlide: Slide = {
          ...nextSlide,
          id
        };
        try {
          await setDoc(doc(db, 'slides', id), finalSlide);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `slides/${id}`);
        }
        setSlideStatus({ text: editingSlideId ? "Slide banner updated in Firestore successfully!" : "New slide banner created in Firestore successfully!", isError: false });
        
        // Reset state
        setSlideForm({ tag: '', title: '', subtitle: '', image: '' });
        setEditingSlideId(null);
        setSlideImgBase64('');
        return;
      } catch (err: any) {
        console.error("Firestore slide save error:", err);
        const errorReason = parseFirebaseError(err);
        setSlideStatus({ text: `Failed to save promotional banner to Firestore. Reason: ${errorReason}`, isError: true });
        if (errorReason.toLowerCase().includes("permission") || errorReason.toLowerCase().includes("auth") || errorReason.toLowerCase().includes("unauthorized")) {
          setTroubleError({ origin: "Promotional Slide Banner Save", message: errorReason });
        }
        return;
      }
    }

    try {
      const resp = await fetch('/api/slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (resp.ok && resp.headers.get('content-type')?.includes('application/json')) {
        setSlideStatus({ text: editingSlideId ? "Slide banner updated successfully!" : "New slide banner created successfully!", isError: false });
        // Reset state
        setSlideForm({ tag: '', title: '', subtitle: '', image: '' });
        setEditingSlideId(null);
        setSlideImgBase64('');
        fetchSlides();
      } else {
        let updatedSlides;
        if (editingSlideId) {
          updatedSlides = slides.map(sl => sl.id === editingSlideId ? nextSlide : sl);
        } else {
          updatedSlides = [...slides, nextSlide];
        }
        setSlides(updatedSlides);
        localStorage.setItem('bkk_offline_slides', JSON.stringify(updatedSlides));
        setSlideStatus({ text: "Saved locally (offline mode active)!", isError: false });
        setSlideForm({ tag: '', title: '', subtitle: '', image: '' });
        setEditingSlideId(null);
        setSlideImgBase64('');
      }
    } catch (err) {
      let updatedSlides;
      if (editingSlideId) {
        updatedSlides = slides.map(sl => sl.id === editingSlideId ? nextSlide : sl);
      } else {
        updatedSlides = [...slides, nextSlide];
      }
      setSlides(updatedSlides);
      localStorage.setItem('bkk_offline_slides', JSON.stringify(updatedSlides));
      setSlideStatus({ text: "Saved locally (offline mode active)!", isError: false });
      setSlideForm({ tag: '', title: '', subtitle: '', image: '' });
      setEditingSlideId(null);
      setSlideImgBase64('');
    }
  };

  const handleEditSlide = (slide: Slide) => {
    setEditingSlideId(slide.id);
    setSlideForm({
      tag: slide.tag,
      title: slide.title,
      subtitle: slide.subtitle,
      image: slide.image
    });
    setSlideImgBase64(slide.image);
    setSlideStatus(null);
  };

  const handleDeleteSlide = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this slide banner?")) {
      return;
    }
    setSlideStatus(null);

    if (isFirebaseEnabled) {
      try {
        try {
          await deleteDoc(doc(db, 'slides', id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `slides/${id}`);
        }
        setSlideStatus({ text: "Promotional slide banner deleted from Firestore successfully!", isError: false });
        if (editingSlideId === id) {
          setEditingSlideId(null);
          setSlideForm({ tag: '', title: '', subtitle: '', image: '' });
          setSlideImgBase64('');
        }
        return;
      } catch (err: any) {
        console.error("Firestore delete slide error:", err);
        const errorReason = parseFirebaseError(err);
        setSlideStatus({ text: `Failed to delete promotional slide banner from Firestore. Reason: ${errorReason}`, isError: true });
        if (errorReason.toLowerCase().includes("permission") || errorReason.toLowerCase().includes("auth") || errorReason.toLowerCase().includes("unauthorized")) {
          setTroubleError({ origin: "Promotional Banner Deletion", message: errorReason });
        }
        return;
      }
    }

    try {
      const resp = await fetch(`/api/slides/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (resp.ok && resp.headers.get('content-type')?.includes('application/json')) {
        setSlideStatus({ text: "Promotional slide banner deleted successfully!", isError: false });
        if (editingSlideId === id) {
          setEditingSlideId(null);
          setSlideForm({ tag: '', title: '', subtitle: '', image: '' });
          setSlideImgBase64('');
        }
        fetchSlides();
      } else {
        const updatedSlides = slides.filter(sl => sl.id !== id);
        setSlides(updatedSlides);
        localStorage.setItem('bkk_offline_slides', JSON.stringify(updatedSlides));
        setSlideStatus({ text: "Deleted slide locally.", isError: false });
        if (editingSlideId === id) {
          setEditingSlideId(null);
          setSlideForm({ tag: '', title: '', subtitle: '', image: '' });
          setSlideImgBase64('');
        }
      }
    } catch (err) {
      const updatedSlides = slides.filter(sl => sl.id !== id);
      setSlides(updatedSlides);
      localStorage.setItem('bkk_offline_slides', JSON.stringify(updatedSlides));
      setSlideStatus({ text: "Deleted slide locally (offline).", isError: false });
      if (editingSlideId === id) {
        setEditingSlideId(null);
        setSlideForm({ tag: '', title: '', subtitle: '', image: '' });
        setSlideImgBase64('');
      }
    }
  };

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const resp = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok && resp.headers.get('content-type')?.includes('application/json')) {
        const data = await resp.json();
        setOrders(data);
      } else {
        const savedQueue = JSON.parse(localStorage.getItem('bkk_offline_orders_queue') || '[]');
        setOrders(savedQueue);
      }
    } catch (err) {
      console.error("Error fetching admin orders data", err);
      const savedQueue = JSON.parse(localStorage.getItem('bkk_offline_orders_queue') || '[]');
      setOrders(savedQueue);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: 'completed' | 'cancelled') => {
    if (isFirebaseEnabled) {
      try {
        try {
          await setDoc(doc(db, 'orders', orderId), { status }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
        }
        showNotification(`Order status updated to ${status} in real-time!`);
        return;
      } catch (err: any) {
        console.error("Firestore order update error:", err);
        if (err.message && err.message.includes("permission")) {
          showNotification("Permission denied. Only authorized admins can manage orders.", true);
        } else {
          showNotification("Failed to update order status.", true);
        }
        return;
      }
    }
    try {
      const resp = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (resp.ok && resp.headers.get('content-type')?.includes('application/json')) {
        fetchOrders();
        showNotification("Order status updated successfully!");
        // Refresh product items (stocks might change)
        const itemResp = await fetch('/api/items');
        if (itemResp.ok && itemResp.headers.get('content-type')?.includes('application/json')) {
          const freshItems = await itemResp.json();
          onUpdateItems(freshItems);
        }
      } else {
        // Local fallback update
        const savedQueue = JSON.parse(localStorage.getItem('bkk_offline_orders_queue') || '[]');
        const updatedQueue = savedQueue.map((ord: Order) => 
          ord.id === orderId ? { ...ord, status } : ord
        );
        localStorage.setItem('bkk_offline_orders_queue', JSON.stringify(updatedQueue));
        setOrders(updatedQueue);
        showNotification("Order status updated locally!");
      }
    } catch (err) {
      console.error(err);
      // Local fallback update
      const savedQueue = JSON.parse(localStorage.getItem('bkk_offline_orders_queue') || '[]');
      const updatedQueue = savedQueue.map((ord: Order) => 
        ord.id === orderId ? { ...ord, status } : ord
      );
      localStorage.setItem('bkk_offline_orders_queue', JSON.stringify(updatedQueue));
      setOrders(updatedQueue);
      showNotification("Order status updated locally (offline)!");
    }
  };

  const parseFirebaseError = (err: any): string => {
    try {
      const errorStr = err?.message || String(err);
      if (errorStr.startsWith('{') && errorStr.endsWith('}')) {
        const parsed = JSON.parse(errorStr);
        const innerErr = parsed.error || '';
        if (innerErr.toLowerCase().includes('permission') || innerErr.toLowerCase().includes('insufficient')) {
          const userEmail = parsed.authInfo?.email;
          if (!userEmail) {
            return "Permission Denied: You are not signed into Firebase Auth. Please click Google Sign-In as Admin on the login portal.";
          } else if (userEmail !== 'sujanbasakk@gmail.com') {
            return `Permission Denied: Signed in as ${userEmail}, but only sujanbasakk@gmail.com is authorized as admin.`;
          } else {
            return "Permission Denied: Firestore rules blocked this write. Please ensure sujanbasakk@gmail.com has been verified.";
          }
        }
        return innerErr;
      }
    } catch (e) {
      // Ignore parse failure and fall back
    }
    const rawMsg = err?.message || String(err);
    if (rawMsg.toLowerCase().includes('permission') || rawMsg.toLowerCase().includes('insufficient')) {
      return "Permission Denied: Only the verified admin sujanbasakk@gmail.com signed-in via Google can perform this action.";
    }
    return rawMsg;
  };

  const showNotification = (text: string, isError = false) => {
    setStatusMessage({ text, isError });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Canvas-based image compression to avoid exceeding localStorage or firestore quotas
  const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.75): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
    });
  };

  // Base64 file reader helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'itemImg') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotification("File is too large! Please choose an image smaller than 5MB.", true);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const compressed = await compressImage(base64String, 600, 600, 0.7);
      if (target === 'logo') {
        setBizLogoBase64(compressed);
        setBizForm(p => ({ ...p, logo: compressed }));
      } else {
        setItemImgBase64(compressed);
        setItemForm(p => ({ ...p, image: compressed }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle saving general profile
  const handleSaveBizConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextConfig = { ...bizForm, logo: bizLogoBase64 || bizForm.logo };

    if (isFirebaseEnabled) {
      try {
        try {
          await setDoc(doc(db, 'config', 'business_config'), nextConfig);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'config/business_config');
        }
        await onUpdateConfig(nextConfig);
        showNotification("Business listing profile updated successfully in Firestore!");
        return;
      } catch (err: any) {
        console.error("Firestore config save error:", err);
        const errorReason = parseFirebaseError(err);
        showNotification(`Permission denied or Firebase error. Reason: ${errorReason}`, true);
        if (errorReason.toLowerCase().includes("permission") || errorReason.toLowerCase().includes("auth") || errorReason.toLowerCase().includes("unauthorized")) {
          setTroubleError({ origin: "Business Profile Save", message: errorReason });
        }
        return;
      }
    }

    try {
      const resp = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(nextConfig)
      });
      if (resp.ok && resp.headers.get('content-type')?.includes('application/json')) {
        const data = await resp.json();
        await onUpdateConfig(data.config);
        showNotification("Business listing profile updated successfully!");
      } else {
        await onUpdateConfig(nextConfig);
        showNotification("Profile configurations updated and saved locally!");
      }
    } catch (err) {
      await onUpdateConfig(nextConfig);
      showNotification("Profile configurations updated locally (simulation mode)!");
    }
  };

  // Handle Category Management
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    if (isFirebaseEnabled) {
      try {
        const id = newCatName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
        const newCat: Category = { id, name: newCatName.trim(), color: newCatColor };
        try {
          await setDoc(doc(db, 'categories', id), newCat);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `categories/${id}`);
        }
        setNewCatName('');
        setNewCatColor('amber');
        showNotification("New category created in Firestore!");
        return;
      } catch (err: any) {
        console.error("Firestore add category error:", err);
        const errorReason = parseFirebaseError(err);
        showNotification(`Failed to add category to Firestore. Reason: ${errorReason}`, true);
        if (errorReason.toLowerCase().includes("permission") || errorReason.toLowerCase().includes("auth") || errorReason.toLowerCase().includes("unauthorized")) {
          setTroubleError({ origin: "Category Creation", message: errorReason });
        }
        return;
      }
    }

    try {
      const resp = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCatName.trim(), color: newCatColor })
      });
      if (resp.ok && resp.headers.get('content-type')?.includes('application/json')) {
        const data = await resp.json();
        await onUpdateCategories(data.categories);
        setNewCatName('');
        setNewCatColor('amber');
        showNotification("New food category created!");
      } else {
        const newCat: Category = {
          id: 'cat_off_' + Date.now(),
          name: newCatName.trim(),
          color: newCatColor
        };
        const updatedCats = [...categories, newCat];
        await onUpdateCategories(updatedCats);
        setNewCatName('');
        setNewCatColor('amber');
        showNotification("New category added locally!");
      }
    } catch (err) {
      const newCat: Category = {
        id: 'cat_off_' + Date.now(),
        name: newCatName.trim(),
        color: newCatColor
      };
      const updatedCats = [...categories, newCat];
      await onUpdateCategories(updatedCats);
      setNewCatName('');
      setNewCatColor('amber');
      showNotification("New category added locally (offline)!");
    }
  };

  const handleSaveEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCatId || !editingCatName.trim()) return;

    if (isFirebaseEnabled) {
      try {
        const updatedCat: Category = { id: editingCatId, name: editingCatName.trim(), color: editingCatColor };
        try {
          await setDoc(doc(db, 'categories', editingCatId), updatedCat);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `categories/${editingCatId}`);
        }
        setEditingCatId(null);
        showNotification("Category modified in Firestore!");
        return;
      } catch (err: any) {
        console.error("Firestore edit category error:", err);
        const errorReason = parseFirebaseError(err);
        showNotification(`Failed to save changes in Firestore. Reason: ${errorReason}`, true);
        if (errorReason.toLowerCase().includes("permission") || errorReason.toLowerCase().includes("auth") || errorReason.toLowerCase().includes("unauthorized")) {
          setTroubleError({ origin: "Category Edit", message: errorReason });
        }
        return;
      }
    }

    try {
      const resp = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: editingCatId, name: editingCatName.trim(), color: editingCatColor })
      });
      if (resp.ok && resp.headers.get('content-type')?.includes('application/json')) {
        const data = await resp.json();
        await onUpdateCategories(data.categories);
        setEditingCatId(null);
        showNotification("Category modified successfully!");
      } else {
        const updatedCats = categories.map(cat => 
          cat.id === editingCatId ? { ...cat, name: editingCatName.trim(), color: editingCatColor } : cat
        );
        await onUpdateCategories(updatedCats);
        setEditingCatId(null);
        showNotification("Category updated locally!");
      }
    } catch (err) {
      const updatedCats = categories.map(cat => 
        cat.id === editingCatId ? { ...cat, name: editingCatName.trim(), color: editingCatColor } : cat
      );
      await onUpdateCategories(updatedCats);
      setEditingCatId(null);
      showNotification("Category updated locally (offline)!");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? Dishes attached will not be deleted but can become unassigned.")) return;

    if (isFirebaseEnabled) {
      try {
        try {
          await deleteDoc(doc(db, 'categories', id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
        }
        showNotification("Category deleted from Firestore.");
        return;
      } catch (err: any) {
        console.error("Firestore delete category error:", err);
        const errorReason = parseFirebaseError(err);
        showNotification(`Failed to delete category in Firestore. Reason: ${errorReason}`, true);
        if (errorReason.toLowerCase().includes("permission") || errorReason.toLowerCase().includes("auth") || errorReason.toLowerCase().includes("unauthorized")) {
          setTroubleError({ origin: "Category Deletion", message: errorReason });
        }
        return;
      }
    }

    try {
      const resp = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok && resp.headers.get('content-type')?.includes('application/json')) {
        const data = await resp.json();
        await onUpdateCategories(data.categories);
        showNotification("Category deleted.");
      } else {
        const updatedCats = categories.filter(cat => cat.id !== id);
        await onUpdateCategories(updatedCats);
        showNotification("Category removed locally.");
      }
    } catch (err) {
      const updatedCats = categories.filter(cat => cat.id !== id);
      await onUpdateCategories(updatedCats);
      showNotification("Category removed locally (offline)!");
    }
  };

  // Handle Item Management
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...itemForm,
      image: itemImgBase64 || itemForm.image
    };

    if (!payload.name || !payload.category || payload.price === undefined) {
      showNotification("Please provide Name, Category, and Price", true);
      return;
    }

    if (isFirebaseEnabled) {
      try {
        const id = editingItemId || "item_" + Date.now();
        const nextItem: FoodItem = {
          id,
          name: payload.name!,
          category: payload.category!,
          price: Number(payload.price) || 0,
          stock: Number(payload.stock) || 0,
          image: payload.image || '',
          description: payload.description || ''
        };
        try {
          await setDoc(doc(db, 'items', id), nextItem);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `items/${id}`);
        }

        // Reset state
        setItemForm({
          name: '',
          category: categories[0]?.id || 'breakfast',
          price: 0,
          stock: 20,
          image: '',
          description: ''
        });
        setItemImgBase64('');
        setEditingItemId(null);
        showNotification(editingItemId ? "Item updated in Firestore!" : "New menu item listed in Firestore!");
        return;
      } catch (err: any) {
        console.error("Firestore save item error:", err);
        const errorReason = parseFirebaseError(err);
        showNotification(`Failed to save food item in Firestore. Reason: ${errorReason}`, true);
        if (errorReason.toLowerCase().includes("permission") || errorReason.toLowerCase().includes("auth") || errorReason.toLowerCase().includes("unauthorized")) {
          setTroubleError({ origin: "Product Upload/Save", message: errorReason });
        }
        return;
      }
    }

    try {
      const resp = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (resp.ok && resp.headers.get('content-type')?.includes('application/json')) {
        const data = await resp.json();
        await onUpdateItems(data.items);
        setItemForm({
          name: '',
          category: categories[0]?.id || 'breakfast',
          price: 0,
          stock: 20,
          image: '',
          description: ''
        });
        setItemImgBase64('');
        setEditingItemId(null);
        showNotification(editingItemId ? "Item updated!" : "New menu item listed successfully!");
      } else {
        let updatedItems;
        if (editingItemId) {
          updatedItems = items.map(it => it.id === editingItemId ? { ...it, ...payload } as FoodItem : it);
        } else {
          const newItem = {
            ...payload,
            id: 'item_off_' + Date.now()
          } as FoodItem;
          updatedItems = [...items, newItem];
        }
        await onUpdateItems(updatedItems);
        setItemForm({
          name: '',
          category: categories[0]?.id || 'breakfast',
          price: 0,
          stock: 20,
          image: '',
          description: ''
        });
        setItemImgBase64('');
        setEditingItemId(null);
        showNotification(editingItemId ? "Item updated locally!" : "New menu item added locally!");
      }
    } catch (err) {
      let updatedItems;
      if (editingItemId) {
        updatedItems = items.map(it => it.id === editingItemId ? { ...it, ...payload } as FoodItem : it);
      } else {
        const newItem = {
          ...payload,
          id: 'item_off_' + Date.now()
        } as FoodItem;
        updatedItems = [...items, newItem];
      }
      await onUpdateItems(updatedItems);
      setItemForm({
        name: '',
        category: categories[0]?.id || 'breakfast',
        price: 0,
        stock: 20,
        image: '',
        description: ''
      });
      setItemImgBase64('');
      setEditingItemId(null);
      showNotification(editingItemId ? "Item updated locally (offline)!" : "New menu item added locally (offline)!");
    }
  };

  const handleEditItemClick = (food: FoodItem) => {
    setEditingItemId(food.id);
    setItemForm(food);
    setItemImgBase64(food.image);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this food dish from the menu?")) return;

    if (isFirebaseEnabled) {
      try {
        try {
          await deleteDoc(doc(db, 'items', id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `items/${id}`);
        }
        showNotification("Food item removed from Firestore.");
        return;
      } catch (err: any) {
        console.error("Firestore delete item error:", err);
        const errorReason = parseFirebaseError(err);
        showNotification(`Failed to remove food item from Firestore. Reason: ${errorReason}`, true);
        if (errorReason.toLowerCase().includes("permission") || errorReason.toLowerCase().includes("auth") || errorReason.toLowerCase().includes("unauthorized")) {
          setTroubleError({ origin: "Product Deletion", message: errorReason });
        }
        return;
      }
    }

    try {
      const resp = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok && resp.headers.get('content-type')?.includes('application/json')) {
        const data = await resp.json();
        await onUpdateItems(data.items);
        showNotification("Food item removed.");
      } else {
        const updatedItems = items.filter(it => it.id !== id);
        await onUpdateItems(updatedItems);
        showNotification("Food item removed locally.");
      }
    } catch (err) {
      const updatedItems = items.filter(it => it.id !== id);
      await onUpdateItems(updatedItems);
      showNotification("Food item removed locally (offline)!");
    }
  };

  // Analytics states
  const totalCompletedSales = orders
    .filter(o => o.status === 'completed')
    .reduce((acc, o) => acc + o.totalAmount, 0);

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Top Banner and notification banner */}
      <div className="bg-amber-950 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building className="w-6 h-6 text-amber-400" />
            <div>
              <h1 className="text-base font-black font-sans tracking-tight">
                BKK Admin Control Center
              </h1>
              <p className="text-[10px] text-amber-200">
                Logged in securely &bull; Live Hansquea Sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              id="btn-admin-goto-store"
              onClick={onBackToStore}
              className="px-3.5 py-1.5 bg-amber-800 hover:bg-amber-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer text-amber-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Store</span>
            </button>
            <button
              id="btn-admin-logout"
              onClick={onLogout}
              className="px-3 py-1.5 border border-amber-800 hover:bg-amber-900 rounded-xl text-xs font-bold transition cursor-pointer text-amber-200"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className={`text-center py-3 text-xs font-bold transition-all fixed top-4 right-4 z-50 px-6 rounded-xl shadow-2xl border ${
          statusMessage.isError 
            ? 'bg-rose-50 text-rose-800 border-rose-100 animate-bounce' 
            : 'bg-emerald-50 text-emerald-800 border-emerald-100'
        }`}>
          {statusMessage.text}
        </div>
      )}

      {isFirebaseEnabled && (!firebaseUser || firebaseUser.email !== 'sujanbasakk@gmail.com') && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 md:px-8 py-3.5 text-xs flex flex-col md:flex-row items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2.5">
            <span className="p-1 px-2.5 bg-amber-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0">
              Offline Simulation Mode
            </span>
            <span className="text-stone-700 font-medium">
              {!firebaseUser 
                ? "You authorized locally via admin credentials, but your browser is NOT authenticated to the remote Firebase Cloud database. Uploads will run offline-only."
                : `You are authenticated as ${firebaseUser.email}, but only sujanbasakk@gmail.com holds write privileges. Menu edits will fail.`}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[10px] text-amber-700 font-bold bg-amber-100/85 px-2.5 py-1 rounded-md">
              Sync Paused
            </span>
            <button
              id="btn-admin-firebase-signin"
              onClick={onLogout}
              className="px-3.5 py-1.5 bg-amber-900 hover:bg-amber-955 text-white font-extrabold rounded-xl transition text-[11px] cursor-pointer shadow-sm"
            >
              Sign-In via Google Admin Button
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Left Sidebar & Middle panel */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar Menu */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 space-y-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-3 block mb-2">Configure System</span>
            
            <button
              id="tab-admin-orders"
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-xs font-bold transition cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-amber-50 text-amber-950 border border-amber-100'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-amber-800" />
              <div className="flex-1">
                <span>Orders & Tokens</span>
                {pendingOrdersCount > 0 && (
                  <span className="ml-1.5 px-2 py-0.5 bg-rose-500 text-white rounded-full text-[9px] font-black animate-pulse">
                    {pendingOrdersCount}
                  </span>
                )}
              </div>
            </button>

            <button
              id="tab-admin-business"
              onClick={() => setActiveTab('business')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-xs font-bold transition cursor-pointer ${
                activeTab === 'business'
                  ? 'bg-amber-50 text-amber-950 border border-amber-100'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Building className="w-4 h-4 text-amber-800" />
              <span>Business Profile / About</span>
            </button>

            <button
              id="tab-admin-categories"
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-xs font-bold transition cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-amber-50 text-amber-950 border border-amber-100'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Tag className="w-4 h-4 text-amber-800" />
              <span>Menu Categories</span>
            </button>

            <button
              id="tab-admin-items"
              onClick={() => setActiveTab('items')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-xs font-bold transition cursor-pointer ${
                activeTab === 'items'
                  ? 'bg-amber-50 text-amber-950 border border-amber-100'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Package className="w-4 h-4 text-amber-800" />
              <span>Food Items & Stock</span>
            </button>

            <button
              id="tab-admin-slides"
              onClick={() => setActiveTab('slides')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-xs font-bold transition cursor-pointer ${
                activeTab === 'slides'
                  ? 'bg-amber-50 text-amber-950 border border-amber-100'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-805" />
              <span>Promotional Slideshow</span>
            </button>

            <button
              id="tab-admin-credentials"
              onClick={() => setActiveTab('credentials')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-xs font-bold transition cursor-pointer ${
                activeTab === 'credentials'
                  ? 'bg-amber-50 text-amber-950 border border-amber-100'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Lock className="w-4 h-4 text-amber-800" />
              <span>Sign-in & Passwords</span>
            </button>

            <button
              id="tab-admin-firebase"
              onClick={() => setActiveTab('firebase')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-xs font-bold transition cursor-pointer ${
                activeTab === 'firebase'
                  ? 'bg-amber-50 text-amber-950 border border-amber-100'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Cloud className="w-4 h-4 text-amber-800" />
              <span>Firebase Cloud Sync</span>
            </button>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-xl border border-stone-200">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Total Revenue</span>
              <div className="text-lg font-black font-mono text-emerald-600 mt-1">₹{totalCompletedSales}</div>
              <span className="text-[9px] text-gray-405 text-stone-400">Completed Orders</span>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-stone-200">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Total Items</span>
              <div className="text-lg font-black font-mono text-amber-950 mt-1">{items.length} dishes</div>
              <span className="text-[9px] text-stone-400">Available Menu</span>
            </div>
          </div>
        </div>

        {/* Right Working Content Section Grid */}
        <div className="lg:col-span-9">
          
          {/* TAB 1: CUSTOMER ORDERS AND SERIAL TOKENS LIST */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div>
                  <h3 className="text-base font-extrabold text-stone-900 font-sans">
                    Customer Orders & delivery Tokens
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Manage active food preparation passes, check address serial IDs, and update order statuses.
                  </p>
                </div>
                <button
                  id="btn-refresh-orders"
                  onClick={fetchOrders}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Refresh Live
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="py-16 text-center max-w-sm mx-auto">
                  <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-stone-900 mb-1">No orders listed yet</h4>
                  <p className="text-xs text-stone-400">When visitors order using the checkout desk, their records show up instantly here with a token ID.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        ord.status === 'pending'
                          ? 'border-amber-200 bg-amber-50/20'
                          : ord.status === 'completed'
                          ? 'border-emerald-100 bg-emerald-50/10'
                          : 'border-stone-200 bg-stone-50/50'
                      }`}
                    >
                      {/* Order Title Box */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dashed border-stone-200 pb-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-amber-950/10 text-amber-950 font-mono text-xs font-black rounded-lg border border-amber-900/15">
                            {ord.token}
                          </span>
                          <div>
                            <h4 className="text-sm font-extrabold text-stone-900 font-sans">
                              {ord.customerName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              <p className="text-[11px] text-stone-500 font-mono">
                                Contact: {ord.phone} &bull; {new Date(ord.createdAt).toLocaleString()}
                              </p>
                              <a
                                href={`https://api.whatsapp.com/send?phone=${ord.phone.replace(/\D/g, '').length === 10 ? '91' + ord.phone.replace(/\D/g, '') : ord.phone.replace(/\D/g, '')}&text=${encodeURIComponent(`Hello ${ord.customerName}! 🍲 This is Basak Khana Khajana regarding your order ${ord.token}. We received your order details and are cooking it fresh!`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black border border-emerald-200 transition cursor-pointer active:scale-95"
                                title="Click to start private chat with customer"
                              >
                                <MessageSquare className="w-3 h-3 text-emerald-600" />
                                <span>Chat/Notify</span>
                              </a>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            ord.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : ord.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-600'
                          }`}>
                            {ord.status}
                          </span>
                        </div>
                      </div>

                      {/* Items details table */}
                      <div className="space-y-2 mb-4">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Ordered items</span>
                        <div className="space-y-1.5 text-xs">
                          {ord.items.map((it, i) => (
                            <div key={i} className="flex justify-between max-w-md text-stone-700">
                              <span>
                                {it.name} <span className="text-[10px] text-amber-800 font-extrabold">x{it.quantity}</span>
                              </span>
                              <span className="font-mono font-semibold">&#8377;{it.price * it.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total Amount & status toggles */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-stone-200 text-xs">
                        <div>
                          <span className="text-stone-500 font-medium font-sans">Collected / Due Amount: </span>
                          <span className="text-sm font-black text-amber-950 font-mono">&nbsp;&#8377;{ord.totalAmount}</span>
                        </div>

                        {ord.status === 'pending' && (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              id={`btn-print-ord-pending-${ord.id}`}
                              onClick={() => setPrintOrder(ord)}
                              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer text-xs shadow-xs"
                              title="Print 80mm thermal receipt to Bluetooth or system printer"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-500" />
                              <span>Print Token (80mm)</span>
                            </button>

                            <button
                              id={`btn-complete-ord-${ord.id}`}
                              onClick={() => handleUpdateOrderStatus(ord.id, 'completed')}
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg flex items-center gap-1 transition cursor-pointer text-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </button>
                            
                            <a
                              id={`btn-complete-notify-ord-${ord.id}`}
                              href={`https://api.whatsapp.com/send?phone=${ord.phone.replace(/\D/g, '').length === 10 ? '91' + ord.phone.replace(/\D/g, '') : ord.phone.replace(/\D/g, '')}&text=${encodeURIComponent(
                                `Hello ${ord.customerName}! 🍲\nYour order from Basak Khana Khajana has been *Confirmed & Completed*! 🎉\n\n*Order Token:* ${ord.token}\n*Total Bill:* ₹${ord.totalAmount}\n\n*Dishes:* \n${ord.items.map(it => `- ${it.name} x${it.quantity}`).join('\n')}\n\nWe hope you love your delicious piping hot meals! ❤️`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleUpdateOrderStatus(ord.id, 'completed')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer text-xs shadow-sm"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-white" />
                              <span>Complete & Send Receipt</span>
                            </a>
                            
                            <button
                              id={`btn-cancel-ord-${ord.id}`}
                              onClick={() => handleUpdateOrderStatus(ord.id, 'cancelled')}
                              className="px-3 py-1.5 bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 font-bold rounded-lg flex items-center gap-1 transition cursor-pointer text-xs"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        )}

                        {ord.status === 'completed' && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1 mr-1">
                              ✓ Completed
                            </span>
                            <button
                              id={`btn-print-ord-complete-${ord.id}`}
                              onClick={() => setPrintOrder(ord)}
                              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer text-xs shadow-xs"
                              title="Print 80mm thermal receipt to Bluetooth or system printer"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-500" />
                              <span>Print Receipt (80mm)</span>
                            </button>
                            <a
                              id={`btn-completed-send-whatsapp-${ord.id}`}
                              href={`https://api.whatsapp.com/send?phone=${ord.phone.replace(/\D/g, '').length === 10 ? '91' + ord.phone.replace(/\D/g, '') : ord.phone.replace(/\D/g, '')}&text=${encodeURIComponent(
                                `Hello ${ord.customerName}! 🍲\nHere is your receipt from Basak Khana Khajana for your *Completed Order*! 🎉\n\n*Order Token:* ${ord.token}\n*Total Bill:* ₹${ord.totalAmount}\n\n*Items Ordered:* \n${ord.items.map(it => `- ${it.name} x${it.quantity}`).join('\n')}\n\nThank you for choosing us! ❤️`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer text-xs shadow-sm"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-white" />
                              <span>Send Receipt to Customer</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EDIT BUSINESS AND ABOUT */}
          {activeTab === 'business' && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden p-6 space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-stone-900 font-sans pb-4 border-b border-stone-100">
                  Business Directory profile Listing
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Change frontend title headers, upload local JPEG/PNG corporate logos, refine address and maps embed details.
                </p>
              </div>

              <form onSubmit={handleSaveBizConfig} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                      Business Listing Name
                    </label>
                    <input
                      type="text"
                      required
                      value={bizForm.name}
                      onChange={(e) => setBizForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-950 focus:outline-none focus:ring-1 focus:ring-amber-800 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                      Business Logo Image
                    </label>
                    <div className="flex items-center gap-4">
                      {bizLogoBase64 ? (
                        <img
                          src={bizLogoBase64}
                          alt="Logo Preview"
                          className="w-12 h-12 rounded-full object-cover border border-amber-900/20"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-amber-950/10 flex items-center justify-center font-bold text-xs text-amber-950">
                          BKK
                        </div>
                      )}
                      
                      <label className="flex items-center gap-2 px-3 py-2 bg-stone-150 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition cursor-pointer border border-stone-300">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, 'logo')}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                      Secondary Contacts (One per line)
                    </label>
                    <textarea
                      rows={2}
                      value={bizForm.contacts.join('\n')}
                      onChange={(e) => setBizForm(p => ({ ...p, contacts: e.target.value.split('\n').filter(Boolean) }))}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-950 focus:outline-none focus:ring-1 focus:ring-amber-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                      Full Address Text
                    </label>
                    <input
                      type="text"
                      required
                      value={bizForm.location}
                      onChange={(e) => setBizForm(p => ({ ...p, location: e.target.value, address: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-950 focus:outline-none focus:ring-1 focus:ring-amber-800 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                    About the Business Block Context (Shows in footer)
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={bizForm.about}
                    onChange={(e) => setBizForm(p => ({ ...p, about: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-950 focus:outline-none focus:ring-1 focus:ring-amber-800 font-sans leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                    Google Maps embed URL Link
                  </label>
                  <input
                    type="url"
                    required
                    value={bizForm.mapIframeUrl}
                    onChange={(e) => setBizForm(p => ({ ...p, mapIframeUrl: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800 font-mono"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Paste the <code>src</code> attribute from Google Maps Share iframe code representation.
                  </p>
                </div>

                <div className="border-t border-stone-100 pt-6">
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-widest mb-4">
                    Delivery & Financial Charges (GST & Service Fees)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                        Delivery Charge (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={bizForm.deliveryCharge !== undefined ? bizForm.deliveryCharge : 0}
                        onChange={(e) => setBizForm(p => ({ ...p, deliveryCharge: Number(e.target.value) }))}
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800 font-mono"
                      />
                      <p className="text-[10px] text-stone-400 mt-1">
                        Flat delivery charge applied to orders. Set to 0 for Free Delivery.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                        GST (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        required
                        value={bizForm.gstPercent !== undefined ? bizForm.gstPercent : 0}
                        onChange={(e) => setBizForm(p => ({ ...p, gstPercent: Number(e.target.value) }))}
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800 font-mono"
                      />
                      <p className="text-[10px] text-stone-400 mt-1">
                        Goods and Services Tax as a percentage of cart subtotal (e.g. 5 for 5%).
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                        Service Fee (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={bizForm.serviceFee !== undefined ? bizForm.serviceFee : 0}
                        onChange={(e) => setBizForm(p => ({ ...p, serviceFee: Number(e.target.value) }))}
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800 font-mono"
                      />
                      <p className="text-[10px] text-stone-400 mt-1">
                        Flat additional service/operational fee applied to each order.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 flex justify-end">
                  <button
                    id="btn-save-biz-settings"
                    type="submit"
                    className="px-6 py-2.5 bg-amber-900 hover:bg-amber-950 text-white font-extrabold text-xs rounded-xl cursor-pointer transition shadow-md shadow-amber-950/20 active:scale-95"
                  >
                    Save Business settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: FOOD CATEGORIES LIST */}
          {activeTab === 'categories' && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden p-6 space-y-6">
              <div className="pb-4 border-b border-stone-100">
                <h3 className="text-base font-extrabold text-stone-900 font-sans">
                  Manage Food Categories
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Re-organize breakfast, lunch, or custom category items. Modifying category names here updates client menu labels.
                </p>
              </div>

              {/* Add category form */}
              <form onSubmit={handleAddCategory} className="bg-stone-50 p-5 rounded-2xl border border-stone-200 mt-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-black text-amber-950 uppercase tracking-wider mb-1.5">
                      Create New Category
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Desserts"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800"
                    />
                  </div>
                  <button
                    id="btn-add-category-submit"
                    type="submit"
                    className="px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1.5 h-[34px] sm:h-[38px] justify-center w-full sm:w-auto"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Category</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-stone-700 uppercase tracking-wider mb-2">
                    Category Theme Color
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'amber', bg: 'bg-amber-500', border: 'border-amber-300' },
                      { name: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-300' },
                      { name: 'orange', bg: 'bg-orange-500', border: 'border-orange-300' },
                      { name: 'indigo', bg: 'bg-indigo-500', border: 'border-indigo-300' },
                      { name: 'rose', bg: 'bg-rose-500', border: 'border-rose-300' },
                      { name: 'sky', bg: 'bg-sky-500', border: 'border-sky-300' },
                      { name: 'purple', bg: 'bg-purple-500', border: 'border-purple-300' },
                      { name: 'red', bg: 'bg-red-500', border: 'border-red-300' },
                      { name: 'cyan', bg: 'bg-cyan-500', border: 'border-cyan-300' },
                      { name: 'fuchsia', bg: 'bg-fuchsia-500', border: 'border-fuchsia-300' },
                      { name: 'teal', bg: 'bg-teal-500', border: 'border-teal-300' },
                      { name: 'stone', bg: 'bg-stone-500', border: 'border-stone-300' }
                    ].map((col) => (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => setNewCatColor(col.name)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 transition border ${
                          newCatColor === col.name
                            ? 'bg-amber-950 text-white border-amber-950 scale-105 shadow-xs'
                            : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${col.bg} border ${col.border}`} />
                        <span className="capitalize">{col.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>

              {/* Categoray Rows list view */}
              <div className="divide-y divide-stone-100 whitespace-nowrap overflow-x-auto pt-2">
                {categories.map((cat) => {
                  const inlineColors = [
                    { name: 'amber', bg: 'bg-amber-500' },
                    { name: 'emerald', bg: 'bg-emerald-500' },
                    { name: 'orange', bg: 'bg-orange-500' },
                    { name: 'indigo', bg: 'bg-indigo-500' },
                    { name: 'rose', bg: 'bg-rose-500' },
                    { name: 'sky', bg: 'bg-sky-500' },
                    { name: 'purple', bg: 'bg-purple-500' },
                    { name: 'red', bg: 'bg-red-500' },
                    { name: 'cyan', bg: 'bg-cyan-500' },
                    { name: 'fuchsia', bg: 'bg-fuchsia-500' },
                    { name: 'teal', bg: 'bg-teal-500' },
                    { name: 'stone', bg: 'bg-stone-500' }
                  ];
                  const matchCol = inlineColors.find(c => c.name === cat.color) || { name: 'stone', bg: 'bg-stone-500' };

                  return (
                    <div key={cat.id} className="py-3.5 flex items-center justify-between gap-4">
                      {editingCatId === cat.id ? (
                        <form
                          onSubmit={handleSaveEditCategory}
                          className="flex-1 flex flex-col gap-3 p-3 bg-stone-50 border border-stone-200 rounded-xl"
                        >
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              required
                              value={editingCatName}
                              onChange={(e) => setEditingCatName(e.target.value)}
                              className="px-2 py-1 bg-white text-stone-900 border border-stone-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-800"
                            />
                            <button
                              id={`btn-save-cat-${cat.id}`}
                              type="submit"
                              className="px-2 py-1 bg-amber-900 text-white rounded text-xs hover:bg-amber-955"
                            >
                              Save
                            </button>
                            <button
                              id={`btn-cancel-edit-cat-${cat.id}`}
                              type="button"
                              onClick={() => setEditingCatId(null)}
                              className="px-2 py-1 bg-stone-100 text-stone-600 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className="text-[9px] font-black uppercase text-stone-500 mr-1">Edit Color:</span>
                            {inlineColors.map((col) => (
                              <button
                                key={col.name}
                                type="button"
                                onClick={() => setEditingCatColor(col.name)}
                                className={`w-5 h-5 rounded-full flex items-center justify-center transition border ${
                                  editingCatColor === col.name
                                    ? 'ring-2 ring-amber-900 border-white scale-110 shadow-xs'
                                    : 'border-transparent hover:scale-105'
                                }`}
                                title={col.name}
                              >
                                <span className={`w-3.5 h-3.5 rounded-full ${col.bg}`} />
                              </button>
                            ))}
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full ${matchCol.bg} ring-2 ring-stone-900/10`} />
                          <span className="text-xs font-bold text-stone-900 font-sans capitalize">{cat.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-wider ${matchCol.bg}`}>
                            {cat.color || 'stone'}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">(ID: {cat.id})</span>
                        </div>
                      )}

                      {!editingCatId && (
                        <div className="flex items-center gap-2">
                          <button
                            id={`btn-edit-cat-${cat.id}`}
                            onClick={() => {
                              setEditingCatId(cat.id);
                              setEditingCatName(cat.name);
                              setEditingCatColor(cat.color || 'stone');
                            }}
                            className="p-1 hover:bg-stone-100 text-stone-500 hover:text-stone-800 rounded transition cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: ADD AND EDIT FOOD MENU ITEMS AND STOCKS */}
          {activeTab === 'items' && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden p-6 space-y-6">
              <div className="pb-4 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-stone-900 font-sans">
                    Menu Inventory & Stock Control
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Edit existing recipe coordinates, set current availability limits, or introduce a new hot dish.
                  </p>
                </div>
                {editingItemId && (
                  <button
                    id="btn-admin-cancel-edit-mode"
                    onClick={() => {
                      setEditingItemId(null);
                      setItemForm({
                        name: '',
                        category: categories[0]?.id || 'breakfast',
                        price: 0,
                        stock: 20,
                        image: '',
                        description: ''
                      });
                      setItemImgBase64('');
                    }}
                    className="px-2.5 py-1.5 bg-amber-500 text-amber-950 font-bold text-[10px] uppercase tracking-wider rounded-lg transition hover:bg-amber-400"
                  >
                    Exit Edit Mode
                  </button>
                )}
              </div>

              {/* Creator or Editer Panel */}
              <form onSubmit={handleSaveItem} className="bg-stone-50 p-5 rounded-xl border border-stone-200 space-y-4">
                <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider block">
                  {editingItemId ? "Modify Selected Menu Item" : "Add/Upload New Taste Masterpiece"}
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                      Dish Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Steaming Dry Pork Momos"
                      value={itemForm.name || ''}
                      onChange={(e) => setItemForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-sans text-stone-950 focus:outline-none focus:ring-1 focus:ring-amber-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                      Menu Category Division
                    </label>
                    <select
                      value={itemForm.category || 'breakfast'}
                      onChange={(e) => setItemForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                    Small Description
                  </label>
                  <textarea
                    placeholder="e.g. Traditional home-style recipe, cooked fresh with local organic spices & select wholesome ingredients."
                    value={itemForm.description || ''}
                    rows={2}
                    onChange={(e) => setItemForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-sans text-stone-950 focus:outline-none focus:ring-1 focus:ring-amber-800 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                      Price in INR (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={itemForm.price || 0}
                      onChange={(e) => setItemForm(p => ({ ...p, price: Number(e.target.value) }))}
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono text-stone-950 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                      Available Stock quantity
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={itemForm.stock === undefined ? 20 : itemForm.stock}
                      onChange={(e) => setItemForm(p => ({ ...p, stock: Number(e.target.value) }))}
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono text-stone-950 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                      Item Photo Preview
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-lg text-xs font-bold transition cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Browse</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, 'itemImg')}
                        />
                      </label>
                      
                      {itemImgBase64 ? (
                        <img
                          src={itemImgBase64}
                          alt="Dish Preview"
                          className="w-8 h-8 rounded object-cover border border-stone-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">No image</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    id="btn-add-food-item"
                    type="submit"
                    className="px-5 py-2 bg-amber-900 hover:bg-amber-955 text-white text-xs font-extrabold rounded-lg cursor-pointer transition flex items-center gap-1.5"
                  >
                    <span>{editingItemId ? "Save Dish Changes" : "Save Meal to Menu"}</span>
                  </button>
                </div>
              </form>

              {/* Items Inventory Grid with Stocks warnings */}
              <div className="space-y-3 pt-4">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">Available Dishes in database ({items.length})</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((food) => (
                    <div key={food.id} className="p-3 bg-white rounded-xl border border-stone-200 flex gap-3 hover:shadow-sm transition">
                      <div className="w-16 h-16 rounded bg-stone-100 overflow-hidden flex-shrink-0 border">
                        {food.image ? (
                          <img
                            src={food.image}
                            alt={food.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-stone-400 bg-stone-100">
                            BKK
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-stone-900 truncate font-sans">{food.name}</h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 mb-1">
                            <span className="text-[9px] bg-stone-100 text-stone-500 font-extrabold px-1.5 py-0.5 rounded uppercase font-sans">
                              {food.category}
                            </span>
                            {food.description && (
                              <span className="text-[9px] text-stone-400 font-medium truncate max-w-[180px]" title={food.description}>
                                &bull; {food.description}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1.5">
                          <div>
                            <span className="font-mono font-bold text-stone-900 text-xs">₹{food.price}</span>
                            <span className="text-stone-350 select-none">&nbsp;&bull;&nbsp;</span>
                            <span className={`font-mono font-medium ${food.stock === 0 ? "text-rose-500 font-bold" : food.stock <= 5 ? "text-amber-550 text-amber-600 font-bold" : "text-stone-500"}`}>
                              {food.stock} left
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              id={`btn-edit-item-${food.id}`}
                              onClick={() => handleEditItemClick(food)}
                              className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded cursor-pointer"
                              title="Edit item recipe details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-delete-item-${food.id}`}
                              onClick={() => handleDeleteItem(food.id)}
                              className="p-1 text-rose-550 hover:bg-rose-50 text-rose-500 rounded cursor-pointer"
                              title="Delete food entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ADMIN SIGN-IN CREDENTIALS SETTING */}
          {activeTab === 'credentials' && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div>
                  <h3 className="text-base font-extrabold text-stone-900 font-sans">
                    Change Admin Sign-in Credentials
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Update the primary username and secret password used to access this system administrator control desk.
                  </p>
                </div>
              </div>

              {credStatus && (
                <div id="cred-status-message" className={`p-4 rounded-xl text-xs font-medium border ${
                  credStatus.isError
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  {credStatus.text}
                </div>
              )}

              <form onSubmit={handleUpdateCredentials} className="max-w-md space-y-5">
                <div>
                  <label htmlFor="cred-username" className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                    Admin Username
                  </label>
                  <input
                    id="cred-username"
                    type="text"
                    required
                    placeholder="e.g. admin"
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-250 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800"
                  />
                </div>

                <div>
                  <label htmlFor="cred-password" className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                    New Secret Password
                  </label>
                  <input
                    id="cred-password"
                    type="password"
                    required
                    placeholder="Enter new strong password"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-250 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800"
                  />
                </div>

                <div>
                  <label htmlFor="cred-password-confirm" className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <input
                    id="cred-password-confirm"
                    type="password"
                    required
                    placeholder="Re-enter password to verify"
                    value={adminPassConfirm}
                    onChange={(e) => setAdminPassConfirm(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-250 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    id="btn-save-credentials"
                    type="submit"
                    disabled={isSavingCreds}
                    className="px-5 py-2.5 bg-amber-900 hover:bg-amber-955 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingCreds ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Update Credentials</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: SLIDESHOW EDIT PANEL */}
          {activeTab === 'slides' && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div>
                  <h3 className="text-base font-extrabold text-stone-900 font-sans flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-800" />
                    <span>Promotional Slider Banner Configuration</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Manage the main homepage dynamic slideshow banners. Upload images ("by storage"), and configure overlay and hover title writing.
                  </p>
                </div>
              </div>

              {slideStatus && (
                <div id="slide-status-message" className={`p-4 rounded-xl text-xs font-medium border ${
                  slideStatus.isError
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  {slideStatus.text}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Side: Form */}
                <form id="slide-form-container" onSubmit={handleSaveSlide} className="lg:col-span-5 space-y-5 bg-stone-50/50 p-5 rounded-xl border border-stone-100">
                  <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest">
                    {editingSlideId ? "✍️ Edit Slide Details" : "✨ Add New Dynamic Slide"}
                  </h4>

                  <div>
                    <label htmlFor="slide-tag" className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                      Slide Badge / Tag
                    </label>
                    <input
                      id="slide-tag"
                      type="text"
                      placeholder="e.g. Special Offer, Hot Deal, Morning Only"
                      value={slideForm.tag || ''}
                      onChange={(e) => setSlideForm(prev => ({ ...prev, tag: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white border border-stone-250 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800"
                    />
                  </div>

                  <div>
                    <label htmlFor="slide-title" className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                      Slide Heading (Main Title)
                    </label>
                    <input
                      id="slide-title"
                      type="text"
                      required
                      placeholder="e.g. Traditional Pure Bengali Fish Thali"
                      value={slideForm.title || ''}
                      onChange={(e) => setSlideForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white border border-stone-250 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800"
                    />
                  </div>

                  <div>
                    <label htmlFor="slide-subtitle" className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                      Slide Subtitle / Description Writing
                    </label>
                    <textarea
                      id="slide-subtitle"
                      rows={3}
                      placeholder="e.g. Cooked fresh using local spices and served with piping hot premium rice."
                      value={slideForm.subtitle || ''}
                      onChange={(e) => setSlideForm(prev => ({ ...prev, subtitle: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white border border-stone-250 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                      Slide Image Upload
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-stone-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-stone-50/55 transition">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 text-stone-400 mb-2" />
                            <p className="mb-1 text-xs text-stone-500 font-medium">Click to upload photo</p>
                            <p className="text-[10px] text-stone-400 font-mono">PNG, JPG, WebP, SVG</p>
                          </div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleSlideImageUpload} 
                          />
                        </label>
                      </div>

                      {/* URL input back-up */}
                      <div>
                        <span className="text-[10px] text-stone-400 font-bold block mb-1 uppercase text-center">— OR PASTE IMAGE DIRECT URL —</span>
                        <input
                          id="slide-image-url-input"
                          type="text"
                          placeholder="e.g. https://images.unsplash.com/..."
                          value={slideForm.image || ''}
                          onChange={(e) => {
                            setSlideForm(prev => ({ ...prev, image: e.target.value }));
                            setSlideImgBase64(e.target.value);
                          }}
                          className="w-full px-4 py-2 bg-white border border-stone-250 rounded-xl text-[11px] text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800"
                        />
                      </div>

                      {slideImgBase64 && (
                        <div className="relative rounded-xl overflow-hidden border border-stone-200 mt-2 bg-stone-950 aspect-video flex items-center justify-center">
                          <img 
                            src={slideImgBase64} 
                            alt="Slide Preview" 
                            className="max-h-full max-w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSlideImgBase64('');
                              setSlideForm(prev => ({ ...prev, image: '' }));
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      id="btn-save-slide"
                      type="submit"
                      className="px-4 py-2 bg-amber-900 hover:bg-amber-955 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow transition active:scale-95"
                    >
                      {editingSlideId ? "Update Slide" : "Add Slide Banner"}
                    </button>
                    {editingSlideId && (
                      <button
                        id="btn-cancel-slide-edit"
                        type="button"
                        onClick={() => {
                          setEditingSlideId(null);
                          setSlideForm({ tag: '', title: '', subtitle: '', image: '' });
                          setSlideImgBase64('');
                          setSlideStatus(null);
                        }}
                        className="px-4 py-2 bg-stone-200 hover:bg-stone-250 text-stone-700 font-extrabold text-xs rounded-xl cursor-pointer transition"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>

                {/* Right Side: Existing Slides List */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-stone-700 uppercase tracking-wider block">
                      Active Website Slide-banners ({slides.length})
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono italic">
                      Live on dynamic front homepage slideshow
                    </span>
                  </div>

                  {isLoadingSlides ? (
                    <div className="py-12 text-center text-xs text-stone-500 font-medium">
                      Loading Slides...
                    </div>
                  ) : slides.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-stone-100 rounded-xl text-stone-400 text-xs">
                      No slides configured. Default fallbacks are displaying.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {slides.map((slide, idx) => (
                        <div 
                          key={slide.id || idx}
                          id={`slide-item-${slide.id}`}
                          className="flex gap-4 p-4 bg-white border border-stone-200 rounded-2xl hover:border-amber-200 hover:shadow-sm transition"
                        >
                          <div className="w-24 md:w-32 aspect-video bg-stone-950 rounded-xl overflow-hidden flex-shrink-0 border border-stone-100 flex items-center justify-center">
                            <img 
                              src={slide.image} 
                              alt={slide.title} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              {slide.tag && (
                                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-950 text-[10px] font-black uppercase tracking-wider rounded border border-amber-500/20">
                                  {slide.tag}
                                </span>
                              )}
                              <span className="text-[10px] text-stone-400 font-mono">#{idx+1} ID: {slide.id}</span>
                            </div>
                            <h5 className="text-xs font-bold text-stone-900 truncate">
                              {slide.title}
                            </h5>
                            <p className="text-[10.5px] text-stone-500 line-clamp-2 leading-relaxed">
                              {slide.subtitle || 'No description write-up.'}
                            </p>

                            <div className="pt-2 flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleEditSlide(slide)}
                                className="flex items-center gap-1 text-[11px] font-extrabold text-amber-900 hover:text-amber-955 cursor-pointer"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSlide(slide.id)}
                                className="flex items-center gap-1 text-[11px] font-extrabold text-rose-700 hover:text-rose-800 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: FIREBASE CUSTOM SETUP */}
          {activeTab === 'firebase' && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div>
                  <h3 className="text-base font-extrabold text-stone-900 font-sans flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-amber-800 animate-pulse" />
                    <span>Configure Firebase Sync Project</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Connect your workspace "Basak Khana Khajana" Firebase project to enable cross-device live synchronization and Google user profiles.
                  </p>
                </div>
              </div>

              {fbSaveStatus && (
                <div id="fb-status-message" className={`p-4 rounded-xl text-xs font-semibold leading-relaxed border flex items-start gap-2 ${
                  fbSaveStatus.isError
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <span className="text-base">{fbSaveStatus.isError ? "⚠️" : "🎉"}</span>
                  <div>
                    <p className="font-extrabold">{fbSaveStatus.isError ? "Modification Failed" : "Configuration Successful!"}</p>
                    <p className="font-sans font-medium mt-0.5">{fbSaveStatus.text}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Side: Connection Keys form */}
                <form onSubmit={handleUpdateFirebaseConfig} className="lg:col-span-5 space-y-5 bg-stone-50/50 p-5 rounded-xl border border-stone-100">
                  <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-stone-200/65 pb-2 font-sans">
                    <span>🔑 FIREBASE Web App SDK Config</span>
                  </h4>

                  <div>
                    <label htmlFor="fb-api-key" className="block text-[10.5px] font-black text-stone-700 uppercase tracking-wider mb-2">
                      API Key (apiKey) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="fb-api-key"
                      type="text"
                      required
                      placeholder="AIzaSy..."
                      value={fbApiKey}
                      onChange={(e) => setFbApiKey(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-stone-250 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800 font-mono shadow-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="fb-auth-domain" className="block text-[10.5px] font-black text-stone-700 uppercase tracking-wider mb-2">
                      Auth Domain (authDomain) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="fb-auth-domain"
                      type="text"
                      required
                      placeholder="basak-khana-khajana.firebaseapp.com"
                      value={fbAuthDomain}
                      onChange={(e) => setFbAuthDomain(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-stone-250 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800 font-sans shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 font-sans">
                    <div>
                      <label htmlFor="fb-project-id" className="block text-[10.5px] font-black text-stone-700 uppercase tracking-wider mb-2">
                        Project ID <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="fb-project-id"
                        type="text"
                        required
                        placeholder="basak-khana-khajana"
                        value={fbProjectId}
                        onChange={(e) => setFbProjectId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-stone-250 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800 shadow-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="fb-app-id" className="block text-[10.5px] font-black text-stone-700 uppercase tracking-wider mb-2">
                        App ID <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="fb-app-id"
                        type="text"
                        required
                        placeholder="1:39480...:web:..."
                        value={fbAppId}
                        onChange={(e) => setFbAppId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-stone-250 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800 shadow-sm font-mono text-[10px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="fb-firestore-id" className="block text-[10.5px] font-black text-stone-700 uppercase tracking-wider mb-2">
                      Firestore Database ID <span className="text-stone-400 font-normal">(Optional, defaults to empty)</span>
                    </label>
                    <input
                      id="fb-firestore-id"
                      type="text"
                      placeholder="e.g. (default)"
                      value={fbFirestoreDatabaseId}
                      onChange={(e) => setFbFirestoreDatabaseId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-stone-250 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800 shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="fb-sender-id" className="block text-[10px] font-black text-stone-700 uppercase tracking-wider mb-2">
                        Messaging Sender ID <span className="text-stone-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        id="fb-sender-id"
                        type="text"
                        placeholder="39480..."
                        value={fbMessagingSenderId}
                        onChange={(e) => setFbMessagingSenderId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-stone-250 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800 shadow-sm font-mono"
                      />
                    </div>

                    <div>
                      <label htmlFor="fb-storage-bucket" className="block text-[10px] font-black text-stone-700 uppercase tracking-wider mb-2">
                        Storage Bucket <span className="text-stone-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        id="fb-storage-bucket"
                        type="text"
                        placeholder="basak-khana-khajana.firebasestorage.app"
                        value={fbStorageBucket}
                        onChange={(e) => setFbStorageBucket(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-stone-250 rounded-xl text-[10px] text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800 shadow-sm font-sans"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      id="btn-save-firebase-config"
                      type="submit"
                      disabled={fbIsSaving}
                      className="w-full py-3 bg-amber-900 hover:bg-amber-955 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {fbIsSaving ? (
                        <>
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                          <span>Deploying Credentials...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Link & Sync Firebase Database</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Right Side: Step-by-Step Wiz & Live Info */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-5">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-2 font-sans">
                    <h5 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="text-lg">⚡</span>
                      <span>Firebase Step-by-step Setup Guide</span>
                    </h5>
                    <p className="text-xs text-amber-900 font-semibold leading-relaxed">
                      To prevent any "Permission Denied" errors and enable customer orders to persist on their mobile devices, follow these specific instructions:
                    </p>
                  </div>

                  <div className="divide-y divide-stone-100 bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden font-sans">
                    <div className="p-4 flex gap-3.5 items-start">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-stone-900 text-white font-black text-xs flex items-center justify-center">1</span>
                      <div>
                        <h6 className="text-xs font-black text-stone-900">Create / Open your Firebase Project</h6>
                        <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed font-medium">
                          Visit the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-amber-800 font-extrabold underline hover:text-amber-950">Firebase Console</a>, sign in with your Google account, and click on your workspace <strong className="text-stone-900 font-extrabold">"Basak Khana Khajana"</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 flex gap-3.5 items-start">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-stone-900 text-white font-black text-xs flex items-center justify-center">2</span>
                      <div>
                        <h6 className="text-xs font-black text-stone-900">Add a Web App (Retrieve SDK configuration config object)</h6>
                        <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed font-medium">
                          In the Project Overview dashboard, click the <strong className="text-stone-900 font-extrabold">Web icon (&lt;/&gt;)</strong> to register an app. Name it anything (e.g. `BKK-Web`) and hit register. You will see a `firebaseConfig` javascript object containing details.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 flex gap-3.5 items-start">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-stone-900 text-white font-black text-xs flex items-center justify-center">3</span>
                      <div>
                        <h6 className="text-xs font-black text-stone-900">Enable Firestore Cloud Database</h6>
                        <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed font-medium">
                          Go to <strong className="text-stone-950 font-black">Firestore Database</strong> in the left console panel, click "Create Database". Start it in <strong className="text-amber-905 font-bold">production mode</strong>. Choose standard servers (e.g., `asia-south1` or `us-central1`).
                        </p>
                      </div>
                    </div>

                    <div className="p-4 flex gap-3.5 items-start font-sans">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-stone-900 text-white font-black text-xs flex items-center justify-center">4</span>
                      <div>
                        <h6 className="text-xs font-black text-stone-900">Enable Google Sign-In Provider</h6>
                        <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed font-semibold">
                          Go to <strong className="text-stone-950 font-black">Authentication &gt; Sign-In Method</strong>, click "Add new provider" &gt; select <strong className="text-stone-900 font-extrabold">Google</strong>, slide the enable switch, and click Save.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 flex gap-3.5 items-start bg-amber-500/5">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-800 text-white font-black text-xs flex items-center justify-center">5</span>
                      <div>
                        <h6 className="text-xs font-black text-amber-955 flex items-center gap-1">
                          <span>Wholist your Web domains</span>
                          <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded text-[8px] font-black uppercase tracking-widest">Mandatory</span>
                        </h6>
                        <p className="text-[11px] text-stone-700 mt-0.5 leading-relaxed font-semibold">
                          Google Sign-In will fail if the deployment domain is not whitelisted. In Firebase console under <strong className="text-stone-900">Authentication &gt; Settings &gt; Authorized Domains</strong>, add your current host:
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <code className="bg-white border border-stone-250 px-2 py-1 rounded text-[10.5px] font-mono text-stone-900 font-bold shadow-xs">
                            {window.location.hostname}
                          </code>
                          <code className="bg-white border border-stone-250 px-2 py-1 rounded text-[10.5px] font-mono text-stone-800 font-bold shadow-xs">
                            mellow-malasada-6969a0.netlify.app
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-200/60 pb-2">
                      <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block font-sans">🔗 Diagnostics Connection State</span>
                      <button
                        type="button"
                        id="btn-toggle-firebase-mode"
                        onClick={() => {
                          const isDisabled = localStorage.getItem('basak_khana_khajana_firebase_disabled') === 'true';
                          localStorage.setItem('basak_khana_khajana_firebase_disabled', isDisabled ? 'false' : 'true');
                          showNotification(isDisabled ? "Firebase Cloud Sync activated! Reloading page..." : "Offline Storage Sandbox activated! Reloading page...");
                          setTimeout(() => {
                            window.location.reload();
                          }, 1200);
                        }}
                        className={`px-3 py-1 text-[10px] font-extrabold rounded-lg cursor-pointer transition shadow-xs active:scale-95 ${
                          localStorage.getItem('basak_khana_khajana_firebase_disabled') === 'true'
                            ? 'bg-emerald-800 text-white hover:bg-emerald-900 animate-bounce'
                            : 'bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100'
                        }`}
                      >
                        {localStorage.getItem('basak_khana_khajana_firebase_disabled') === 'true'
                          ? '⚡ BACK TO FIREBASE SYNC'
                          : '🚫 USE OFFLINE/LOCAL WORKSPACE'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[10.5px] font-sans">
                      <div>
                        <span className="text-stone-500 font-medium">Database System:</span>
                        <div className="font-bold flex items-center gap-1.5 mt-0.5">
                          <span className={`w-2 h-2 rounded-full ${isFirebaseEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                          <span>{isFirebaseEnabled ? "Active (Firebase Synced)" : "Local Storage Sandbox Fallback"}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-stone-500 font-medium">Loaded Project ID:</span>
                        <div className="font-bold text-stone-800 mt-0.5 truncate font-mono">
                          {isFirebaseEnabled && activeConfig ? activeConfig.projectId : "None (Stored Locally)"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {printOrder && (
        <ThermalPrintModal
          order={printOrder}
          config={config}
          onClose={() => setPrintOrder(null)}
        />
      )}

      {troubleError && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-stone-200 overflow-hidden relative">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-rose-600" />
            
            <div className="p-6 pb-4 flex items-center gap-3 border-b border-stone-100 bg-rose-50/50">
              <div className="p-2 bg-rose-100 text-rose-800 rounded-xl">
                <AlertCircle className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-stone-900 font-sans tracking-tight">
                  Firebase Sync Permission Blocked
                </h3>
                <p className="text-[10px] text-gray-505">
                  Attempted Action: {troubleError.origin}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl space-y-1.5 text-xs text-rose-900">
                <span className="font-bold flex items-center gap-1">
                  <span>❌ Firestore Database Error:</span>
                </span>
                <p className="font-mono bg-white p-2 rounded text-[10.5px] leading-relaxed border border-rose-100/50 max-h-32 overflow-y-auto break-all">
                  {troubleError.message}
                </p>
              </div>

              <div className="space-y-3.5 text-xs text-stone-700 leading-relaxed font-sans">
                <p className="font-semibold text-stone-800">
                  Why is this happening on Netlify?
                </p>
                <p className="text-stone-600 font-medium pl-1">
                  You are currently logged in with standard offline credentials (<code className="bg-stone-100 px-1 rounded font-bold font-mono">admin</code>). Because of this:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 font-medium text-stone-600">
                  <li>Your browser is not authenticated with Google on the Firebase project <code className="bg-stone-100 px-1 rounded font-bold font-mono">praxis-continuum-mpp0d</code>.</li>
                  <li>Since you do not own the GCP sandbox, you cannot authorize your Netlify domain in its dashboard.</li>
                  <li>Firestore's secure rules therefore reject any uploads/updates to the database in this state.</li>
                </ul>

                <div className="border-t border-stone-200/60 pt-4 space-y-3">
                  <span className="font-extrabold text-stone-950 block uppercase tracking-wider text-[10px]">
                    Choose a Solution to Proceed:
                  </span>
                  
                  {/* Option 1 */}
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 hover:bg-emerald-50/80 transition relative pointer-events-auto">
                    <span className="font-bold text-emerald-950 block text-[11.5px] mb-1">
                      ✅ Option A: Switch to Local Storage Workspace (Recommended)
                    </span>
                    <p className="text-[11px] text-emerald-800 leading-relaxed pr-1 mb-2">
                      Deactivate Firebase sync on this domain. The app will immediately operate on web LocalStorage, letting you add products, set prices, use categories, and manage configuration offline without any server blockers.
                    </p>
                    <button
                      type="button"
                      id="resolve-trouble-local-storage"
                      onClick={() => {
                        localStorage.setItem('basak_khana_khajana_firebase_disabled', 'true');
                        setTroubleError(null);
                        showNotification("Switched to offline local workspace! Reloading...");
                        setTimeout(() => {
                          window.location.reload();
                        }, 1000);
                      }}
                      className="w-full mt-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-[11px] py-1.5 rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                    >
                      🚫 DISABLE FIREBASE & USE OFFLINE STORAGE ONLY
                    </button>
                  </div>

                  {/* Option 2 */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-600">
                    <span className="font-bold text-stone-800 block text-[11.5px]">
                      ⚡ Option B: Link Your Custom Firebase Project
                    </span>
                    <p className="text-[11px] text-stone-500 leading-relaxed mt-1">
                      If you want live multi-device synchronization, select the <strong className="text-stone-700">Firebase Cloud Sync</strong> tab in your sidebar, paste your own registered Firebase project keys, whitelisting your Netlify domain, and click Save.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  id="btn-close-trouble-modal"
                  onClick={() => setTroubleError(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl cursor-pointer transition active:scale-95"
                >
                  Close & Keep Editing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
