import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCart, removeFromCart, getStoredUser, updateCartItem } from "@/lib/api";
import { ArrowLeft, Loader2, Trash2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const user = getStoredUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/user/login");
      return;
    }
    fetchCart();
  }, [user, navigate]);

  const fetchCart = async () => {
    try {
      const data = await getCart();
      setItems(data.items || []);
    } catch (error: any) {
      toast.error("Failed to fetch cart");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeFromCart(itemId);
      setItems(items.filter(item => item.id !== itemId));
      toast.success("Item removed from cart");
    } catch (error: any) {
      toast.error("Failed to remove item");
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemove(itemId);
      return;
    }

    setUpdating(itemId);
    try {
      await updateCartItem(itemId, newQuantity);
      setItems(items.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
      toast.success("Cart updated");
    } catch (error: any) {
      toast.error("Failed to update cart");
    } finally {
      setUpdating(null);
    }
  };

  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/products" className="flex items-center gap-2 text-slate-400 hover:text-slate-200">
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
          <h1 className="text-2xl font-bold text-white">Shopping Cart</h1>
          <div className="w-32"></div>
        </div>
      </div>

      {/* Cart Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-4">Your cart is empty</p>
            <Link to="/products">
              <Button className="bg-blue-500 hover:bg-blue-600">Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{item.name}</h3>
                        <p className="text-slate-400 text-sm">
                          Price: ${item.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="space-y-2">
                          <label className="text-slate-300 text-xs">Qty</label>
                          <Input
                            type="number"
                            min="1"
                            max={item.stock}
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                            disabled={updating === item.id}
                            className="bg-slate-700 border-slate-600 text-white w-16"
                          />
                        </div>

                        <div className="text-right">
                          <p className="text-slate-400 text-xs">Subtotal</p>
                          <p className="text-blue-400 font-bold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        <Button
                          onClick={() => handleRemove(item.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Cart Summary */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-sm">
                    <span>Items: {items.length}</span>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>Total</span>
                    <span className="text-blue-400">${totalPrice.toFixed(2)}</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-2">
                    You can apply coupons and wallet points at checkout
                  </p>
                </div>

                <Link to="/checkout" className="block">
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 py-6">
                    Proceed to Checkout
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
