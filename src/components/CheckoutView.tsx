import * as React from 'react';
import { useState } from 'react';
import { ShoppingBasket, Trash2, ArrowLeft, Phone, User, CheckCircle, Ticket, Calendar, Utensils, MessageSquare } from 'lucide-react';
import { CartItem, Order, BusinessConfig } from '../types';

interface CheckoutViewProps {
  cartItems: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, qty: number) => void;
  onPlaceOrder: (customerName: string, phone: string) => Promise<Order>;
  onBackToMenu: () => void;
  onClearCart: () => void;
  config: BusinessConfig;
}

export default function CheckoutView({
  cartItems,
  onRemoveItem,
  onUpdateQuantity,
  onPlaceOrder,
  onBackToMenu,
  onClearCart,
  config
}: CheckoutViewProps) {
  // Step: 'cart' | 'details' | 'success'
  const [step, setStep] = useState<'cart' | 'details' | 'success'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const subtotal = cartItems.reduce((acc, c) => acc + (c.item.price * c.quantity), 0);
  const totalItemsCount = cartItems.reduce((acc, c) => acc + c.quantity, 0);

  const deliveryCharge = config.deliveryCharge || 0;
  const gstPercent = config.gstPercent || 0;
  const serviceFee = config.serviceFee || 0;
  const gstAmount = parseFloat((subtotal * gstPercent / 100).toFixed(2));
  const finalTotal = parseFloat((subtotal + deliveryCharge + gstAmount + serviceFee).toFixed(2));

  const getWhatsAppUrl = (order: Order) => {
    const number = "919800416889";
    const itemsText = order.items
      .map(it => `- ${it.name} x${it.quantity} (₹${it.price * it.quantity})`)
      .join("\n");
    const message = `Hello Basak Khana Khajana! 🍲\n` + 
      `Please confirm my order:\n\n` +
      `*Order Token:* ${order.token}\n` +
      `*Customer:* ${order.customerName}\n` +
      `*Phone:* ${order.phone}\n` +
      `*Total Bill:* ₹${order.totalAmount}\n\n` +
      `*Dishes Selected:*\n${itemsText}\n\n` +
      `Please start cooking! Thank you.`;
    return `https://api.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(message)}`;
  };

  // Automatically attempt opening WhatsApp on success
  React.useEffect(() => {
    if (step === 'success' && completedOrder) {
      const url = getWhatsAppUrl(completedOrder);
      const timer = setTimeout(() => {
        try {
          window.open(url, '_blank');
        } catch (e) {
          console.error("Auto open blocked", e);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step, completedOrder]);

  // Automatically scroll to the top of the page when checkout steps change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const handleNextStep = () => {
    if (cartItems.length === 0) return;
    setStep('details');
  };

  const handlePlaceOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim()) {
      setError("Please fill in both name and contact phone number.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const order = await onPlaceOrder(customerName.trim(), phone.trim());
      setCompletedOrder(order);
      setStep('success');
      onClearCart();
    } catch (err: any) {
      setError(err?.message || "Something went wrong placing your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'success' && completedOrder) {
    const isOfflineOrder = (completedOrder as any).isOfflineSimulated || completedOrder.token.startsWith('BKK-OFF-');

    return (
      <div className="max-w-xl mx-auto py-8 px-4">
        <div className={`bg-white rounded-3xl border shadow-2xl overflow-hidden text-center p-8 md:p-12 relative ${isOfflineOrder ? 'border-orange-200' : 'border-emerald-100'}`}>
          <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${isOfflineOrder ? 'from-rose-500 via-orange-500 to-amber-500' : 'from-emerald-400 via-teal-500 to-emerald-500'}`} />
          
          {/* Check icon badge */}
          <div className={`w-20 h-20 border rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce ${isOfflineOrder ? 'bg-orange-50 border-orange-200 text-orange-500' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
            <CheckCircle className="w-10 h-10" />
          </div>

          <span className={`text-xs font-black tracking-widest uppercase block mb-2 ${isOfflineOrder ? 'text-orange-700' : 'text-emerald-700'}`}>
            {isOfflineOrder ? 'Offline Order Saved' : 'Order Confirmed'}
          </span>
          <h2 className="text-3xl font-extrabold font-sans text-stone-900 mb-2">
            {isOfflineOrder ? 'Saved to Local Queue' : 'Order Placed Successfully!'}
          </h2>
          <p className="text-sm text-gray-400 max-w-sm mx-auto mb-4">
            {isOfflineOrder 
              ? "You are currently offline. We saved your ticket token locally. Please show this screen on delivery or dispatch."
              : "Your fresh, delicious meal is being curated and cooked with care by Basak Khana Khajana."}
          </p>
          <p className="text-xs text-orange-800 bg-orange-50 rounded-lg p-2.5 max-w-sm mx-auto mb-6 border border-orange-100">
            {isOfflineOrder
              ? "Since you are offline, you can click submit below to draft a complete SMS or WhatsApp message to send us directly!"
              : "We are also sending your order details to us on WhatsApp via +91 9800416889. Click below to re-send if needed!"}
          </p>

          {/* Golden Ticket Token Box */}
          <div className="bg-orange-50/50 rounded-2xl border-2 border-dashed border-orange-300 p-6 mb-8 max-w-sm mx-auto shadow-inner relative overflow-hidden group">
            {/* Cutout visual notches for retro ticket feeling */}
            <div className="absolute top-1/2 -left-3 w-6 h-6 bg-white rounded-full -translate-y-1/2 border-r border-orange-350" />
            <div className="absolute top-1/2 -right-3 w-6 h-6 bg-white rounded-full -translate-y-1/2 border-l border-orange-350" />
            
            <span className="text-[11px] font-bold text-orange-700 uppercase tracking-widest block mb-1">
              {isOfflineOrder ? 'OFFLINE SERIAL TOKEN' : 'Your Serial Token Number'}
            </span>
            <div className="text-4xl font-black font-mono tracking-wider text-stone-900 flex items-center justify-center gap-2">
              <Ticket className="w-8 h-8 text-orange-600" />
              <span>{completedOrder.token}</span>
            </div>
            
            <div className="border-t border-orange-200 mt-4 pt-3 text-[11px] text-orange-850 flex items-center justify-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(completedOrder.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
              <span>&middot;</span>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {completedOrder.customerName}
              </span>
            </div>
          </div>

          {/* Quick Summary of order list */}
          <div className="bg-stone-50 rounded-xl p-4 text-left max-w-sm mx-auto mb-8 text-xs border border-stone-200">
            <h4 className="font-extrabold text-[#ea580c] mb-2 flex items-center gap-1 pb-1 border-b border-stone-250">
              <Utensils className="w-3.5 h-3.5" /> Meal Summary:
            </h4>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {completedOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-gray-600">
                  <span className="truncate max-w-[200px]">{it.name} <span className="text-[10px] text-orange-650 font-bold">x{it.quantity}</span></span>
                  <span className="font-mono font-bold">&#8377;{it.price * it.quantity}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-stone-200 mt-3 pt-2 flex justify-between font-extrabold text-stone-900">
              <span>Total Paid/Due:</span>
              <span>&#8377;{completedOrder.totalAmount}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              id="btn-send-whatsapp"
              href={getWhatsAppUrl(completedOrder)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-sm transition cursor-pointer active:scale-95 text-center shadow flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send via WhatsApp</span>
            </a>

            <button
              id="btn-goto-menu-home"
              onClick={onBackToMenu}
              className="px-6 py-3 bg-gradient-to-r from-rose-500 to-orange-500 hover:brightness-110 text-white font-extrabold rounded-xl text-sm transition cursor-pointer active:scale-95 text-center shadow"
            >
              Order Something Else
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Navigation and Title */}
      <div className="flex items-center gap-2 mb-6">
        <button
          id="btn-checkout-back-nav"
          onClick={() => {
            if (step === 'details') setStep('cart');
            else onBackToMenu();
          }}
          className="p-2 hover:bg-orange-100 rounded-lg text-stone-800 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-orange-600" />
          <span>Back</span>
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-stone-500 text-xs font-semibold">
          {step === 'cart' ? 'My Basket items' : 'Confirmation details'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: List or customer inputs */}
        <div className="lg:col-span-8 space-y-4">
          {step === 'cart' ? (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-stone-105 flex items-center justify-between bg-stone-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-orange-500/10 text-orange-950 rounded-lg">
                    <ShoppingBasket className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 font-sans">
                    Review Ordered Dishes
                  </h3>
                </div>
                <span className="text-xs text-stone-500 font-bold bg-stone-100 px-3 py-1 rounded-full">
                  {totalItemsCount} pieces
                </span>
              </div>

              {cartItems.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4">
                    <ShoppingBasket className="w-8 h-8 text-orange-650/60" />
                  </div>
                  <h4 className="text-base font-bold text-stone-800 mb-1">Your basket is feeling light</h4>
                  <p className="text-xs text-gray-400 max-w-sm mb-6">
                    Add freshly prepared morning treats, luxury noon thalis, or midnight hot bites to trigger an order.
                  </p>
                  <button
                    id="btn-basket-goto-menu"
                    onClick={onBackToMenu}
                    className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:brightness-110 text-white text-xs font-bold rounded-xl transition cursor-pointer active:scale-95 shadow"
                  >
                    Browse Local Menu
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {cartItems.map((cart, index) => (
                    <div key={cart.item.id || index} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                      <div className="flex items-center gap-4">
                        {/* Meal image box */}
                        <div className="w-14 h-14 rounded-lg bg-orange-50/50 overflow-hidden flex-shrink-0 border border-stone-200">
                          {cart.item.image ? (
                            <img
                              src={cart.item.image}
                              alt={cart.item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-extrabold text-xs text-orange-600">
                              BKK
                            </div>
                          )}
                        </div>

                        {/* Text names labels */}
                        <div>
                          <h4 className="font-bold font-sans text-sm text-stone-900">
                            {cart.item.name}
                          </h4>
                          <span className="inline-block px-2 py-0.5 bg-stone-100 text-stone-500 rounded text-[10px] font-bold capitalize mt-1">
                            {cart.item.category}
                          </span>
                        </div>
                      </div>

                      {/* Controls unit count incrementors & trash row details */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                        <div className="flex items-center gap-2">
                          <button
                            id={`btn-dec-qty-${cart.item.id}`}
                            onClick={() => onUpdateQuantity(cart.item.id, cart.quantity - 1)}
                            className="w-7 h-7 bg-stone-100 hover:bg-orange-100 text-stone-700 hover:text-orange-950 font-bold rounded-lg flex items-center justify-center transition cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-stone-800">
                            {cart.quantity}
                          </span>
                          <button
                            id={`btn-inc-qty-${cart.item.id}`}
                            onClick={() => onUpdateQuantity(cart.item.id, cart.quantity + 1)}
                            className="w-7 h-7 bg-stone-100 hover:bg-orange-100 text-stone-700 hover:text-orange-950 font-bold rounded-lg flex items-center justify-center transition cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right min-w-[70px]">
                          <div className="text-sm font-black text-stone-900 font-mono">
                            &#8377;{cart.item.price * cart.quantity}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            &#8377;{cart.item.price} each
                          </div>
                        </div>

                        <button
                          id={`btn-checkout-remove-${cart.item.id}`}
                          onClick={() => onRemoveItem(cart.item.id)}
                          className="p-2 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition cursor-pointer"
                          title="Delete line item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Details entry screen */
            <div className="bg-white rounded-2xl border border-stone-100 shadow-xl overflow-hidden p-6 md:p-8">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-lg font-extrabold text-stone-900 font-sans">
                  Enter Local Order Delivery Info
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  We use your name and contact phone number to generate tokens and verify the pick-up or standard local drops in Hansquea.
                </p>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handlePlaceOrderSubmit} className="space-y-5">
                <div>
                  <label htmlFor="customer-name" className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-2">
                    Your Full Name &nbsp;<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="customer-name"
                      type="text"
                      required
                      placeholder="e.g. Sujan Basak"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-250 hover:bg-stone-50/50 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="customer-phone" className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-2">
                    Contact Phone Number (India &nbsp;<span className="text-red-500">*</span>)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="customer-phone"
                      type="tel"
                      required
                      placeholder="e.g. +91 94754 76265"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-250 hover:bg-stone-50/50 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                    Our team will ring you at this number if items must be custom spices, or to inform cooking delivery.
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-105 flex items-center justify-between">
                  <button
                    id="btn-return-cart-step"
                    type="button"
                    onClick={() => setStep('cart')}
                    className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Review Items Basket
                  </button>

                  <button
                    id="btn-submit-checkout-order"
                    type="submit"
                    disabled={isSubmitting || cartItems.length === 0}
                    className="px-6 py-3 bg-gradient-to-r from-rose-500 to-orange-500 hover:brightness-110 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow hover:shadow-lg disabled:opacity-50 transition active:scale-95 flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                        <span>Confirming order...</span>
                      </>
                    ) : (
                      <span>Place My Order Now (&#8377;{finalTotal})</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Checkout Pricing Summary Panel */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-stone-100 shadow-xl p-6 space-y-5">
          <h3 className="text-base font-extrabold text-stone-900 font-sans pb-3 border-b border-stone-100">
            Order Financials
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Selected items:</span>
              <span>{totalItemsCount} units</span>
            </div>

            <div className="flex justify-between text-gray-500">
              <span>Subtotal:</span>
              <span className="font-mono font-bold text-stone-900">&#8377;{subtotal}</span>
            </div>

            <div className="flex justify-between text-gray-500">
              <span>Delivery Charge:</span>
              <span className={deliveryCharge === 0 ? "text-emerald-600 font-bold" : "font-mono font-bold text-stone-900"}>
                {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
              </span>
            </div>

            <div className="flex justify-between text-gray-500">
              <span>GST ({gstPercent}%):</span>
              <span className="font-mono font-bold text-stone-900">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between text-gray-500">
              <span>Service Fee:</span>
              <span className="font-mono font-bold text-stone-900">₹{serviceFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div className="border-t border-stone-100 my-4 pt-3 flex justify-between text-sm font-black text-stone-900 font-sans">
              <span>Total Bill (Due):</span>
              <span className="font-mono text-base">&#8377;{finalTotal}</span>
            </div>
          </div>

          {step === 'cart' && (
            <button
              id="btn-review-agree-proceed"
              onClick={handleNextStep}
              disabled={cartItems.length === 0}
              className="w-full py-3 bg-gradient-to-r from-rose-500 to-orange-500 hover:brightness-105 text-white font-extrabold text-xs rounded-xl cursor-pointer transition shadow hover:shadow-lg active:scale-95 disabled:opacity-50 text-center"
            >
              Proceed to Customer Details
            </button>
          )}

          <div className="text-[10px] text-gray-400 leading-relaxed pt-2">
            By clicking ordering, our cooking team immediately prints your tokens. No advance card payment is required &mdash; Pay cash/UPI on delivery in Hansquea.
          </div>
        </div>
      </div>
    </div>
  );
}
