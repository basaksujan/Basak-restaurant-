import { Trash2, AlertCircle, ShoppingBag } from 'lucide-react';
import { CartItem } from '../types';

interface CartHoverPopupProps {
  cartItems: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
  onClose?: () => void;
}

export default function CartHoverPopup({ cartItems, onRemoveItem, onCheckout, onClose }: CartHoverPopupProps) {
  const totalAmount = cartItems.reduce((acc, current) => acc + (current.item.price * current.quantity), 0);

  return (
    <div className="w-[320px] bg-white rounded-2xl shadow-2xl border border-amber-900/10 overflow-hidden flex flex-col max-h-[450px]">
      {/* Header element */}
      <div className="bg-amber-900 px-4 py-3 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-amber-300" />
          <span className="font-bold text-sm tracking-tight font-sans">Shopping Basket</span>
        </div>
        <span className="text-xs bg-amber-800 px-2 py-0.5 rounded-full font-bold">
          {cartItems.reduce((acc, c) => acc + c.quantity, 0)} items
        </span>
      </div>

      {/* Cart Content */}
      <div className="overflow-y-auto flex-1 p-3 divide-y divide-gray-100">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <AlertCircle className="w-8 h-8 text-amber-500/60 mb-2" />
            <p className="text-xs font-bold text-amber-950 font-sans">Your basket is empty</p>
            <p className="text-[11px] text-gray-400 mt-1">Select from our delicious menu items to add them here.</p>
          </div>
        ) : (
          cartItems.map((cart, idx) => (
            <div key={cart.item.id || idx} className="py-2.5 flex items-center justify-between gap-3 group">
              {/* Product Thumbnail or Fallback Icon */}
              <div className="w-10 h-10 rounded bg-amber-100 overflow-hidden flex-shrink-0">
                {cart.item.image ? (
                  <img
                    src={cart.item.image}
                    alt={cart.item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-extrabold text-amber-800">
                    BKK
                  </div>
                )}
              </div>

              {/* Product details */}
              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-bold font-sans text-amber-950 truncate" title={cart.item.name}>
                  {cart.item.name}
                </h5>
                <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                  <span>{cart.quantity}x</span>
                  <span>&bull;</span>
                  <span>&nbsp;{cart.item.price} each</span>
                </p>
              </div>

              {/* Subtotal & trash delete button */}
              <div className="flex items-center gap-2.5 text-right flex-shrink-0">
                <span className="text-xs font-extrabold text-amber-950">
                  &#8377;{cart.item.price * cart.quantity}
                </span>

                <button
                  id={`btn-remove-from-popup-${cart.item.id}`}
                  onClick={() => onRemoveItem(cart.item.id)}
                  className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-700 transition cursor-pointer"
                  title="Remove this item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer / Total and path to checkout */}
      {cartItems.length > 0 && (
        <div className="p-4 bg-amber-50 border-t border-amber-900/5 flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-amber-900 font-sans">Total Amount:</span>
            <span className="text-base font-extrabold text-amber-950">&#8377;{totalAmount}</span>
          </div>

          <button
            id="btn-popup-proceed-checkout"
            onClick={onCheckout}
            className="w-full py-2.5 bg-amber-900 text-white rounded-xl text-xs font-extrabold cursor-pointer hover:bg-amber-950 active:scale-95 transition shadow-md shadow-amber-950/20 text-center"
          >
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
}
