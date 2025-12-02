import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  calculateTotal,
  placeOrder,
  updatePaymentStatus,
  getStoredUser,
  getCart,
} from "@/lib/api";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Checkout() {
  const [couponCode, setCouponCode] = useState("");
  const [walletPoints, setWalletPoints] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [totals, setTotals] = useState({
    subtotal: 0,
    discount: 0,
    wallet_deduction: 0,
    total: 0,
  });
  const [cartEmpty, setCartEmpty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const user = getStoredUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/user/login");
      return;
    }
    setWalletPoints(user.wallet_points || 0);
    loadCart();
  }, [user, navigate]);

  const loadCart = async () => {
    try {
      const cartData = await getCart();
      if (!cartData.items || cartData.items.length === 0) {
        setCartEmpty(true);
        setLoading(false);
        return;
      }
      calculateCheckoutTotal(couponCode, useWallet ? walletPoints : 0);
    } catch (error) {
      toast.error("Failed to load cart");
      setLoading(false);
    }
  };

  const calculateCheckoutTotal = async (coupon?: string, points?: number) => {
    try {
      const data = await calculateTotal(coupon, points);
      setTotals(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to calculate total");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = () => {
    calculateCheckoutTotal(couponCode, useWallet ? walletPoints : 0);
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const orderData = await placeOrder(
        couponCode || undefined,
        useWallet ? walletPoints : 0
      );

      // Simulate payment - in real app, would integrate with payment gateway
      const paymentStatus = Math.random() > 0.3 ? "success" : "failed";
      const paymentDelay = 2000;

      setTimeout(async () => {
        try {
          await updatePaymentStatus(orderData.order.id, paymentStatus);
          if (paymentStatus === "success") {
            toast.success("Order placed successfully!");
            navigate(`/orders/${orderData.order.id}`);
          } else {
            toast.error("Payment failed. Please try again.");
            navigate("/cart");
          }
        } catch (error: any) {
          toast.error("Error processing payment");
        }
      }, paymentDelay);

      toast.loading("Processing payment...");
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
      setPlacing(false);
    }
  };

  if (!user) {
    return null;
  }

  if (cartEmpty && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Your cart is empty</h2>
          <Link to="/products">
            <Button className="bg-blue-500 hover:bg-blue-600">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/cart" className="flex items-center gap-2 text-slate-400 hover:text-slate-200">
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Link>
        </div>
      </div>

      {/* Checkout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Left - Discounts & Payment */}
            <div className="md:col-span-2 space-y-6">
              {/* Coupon Section */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Apply Coupon Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="coupon" className="text-slate-300">Coupon Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="coupon"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      <Button
                        onClick={handleApplyCoupon}
                        variant="outline"
                        className="border-slate-600 text-slate-200"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                  {totals.discount > 0 && (
                    <div className="text-green-400 text-sm">
                      Discount applied: ${totals.discount.toFixed(2)}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Wallet Points Section */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Use Wallet Points</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-300">Available Points</p>
                      <p className="text-2xl font-bold text-yellow-400">{walletPoints}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="wallet"
                        checked={useWallet}
                        onCheckedChange={(checked) => {
                          setUseWallet(checked as boolean);
                          const points = checked ? walletPoints : 0;
                          calculateCheckoutTotal(couponCode, points);
                        }}
                      />
                      <Label htmlFor="wallet" className="text-slate-300 cursor-pointer">
                        Use wallet points
                      </Label>
                    </div>
                  </div>
                  {useWallet && (
                    <div className="text-green-400 text-sm">
                      Points deduction: ${walletPoints.toFixed(2)}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400">
                    Click "Complete Order" to proceed with payment simulation (90% success rate)
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Right - Order Summary */}
            <div>
              <Card className="bg-slate-800 border-slate-700 sticky top-4">
                <CardHeader>
                  <CardTitle className="text-white">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-300">
                      <span>Subtotal</span>
                      <span>${totals.subtotal.toFixed(2)}</span>
                    </div>
                    {totals.discount > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>Discount</span>
                        <span>-${totals.discount.toFixed(2)}</span>
                      </div>
                    )}
                    {totals.wallet_deduction > 0 && (
                      <div className="flex justify-between text-yellow-400">
                        <span>Wallet Points</span>
                        <span>-${totals.wallet_deduction.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-700 pt-4">
                    <div className="flex justify-between text-white font-bold text-lg mb-4">
                      <span>Total</span>
                      <span className="text-blue-400">${totals.total.toFixed(2)}</span>
                    </div>

                    <Button
                      onClick={handlePlaceOrder}
                      disabled={placing || totals.total === 0}
                      className="w-full bg-blue-500 hover:bg-blue-600 py-6"
                    >
                      {placing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Complete Order"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
