import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrderById, getStoredUser } from "@/lib/api";
import { ArrowLeft, Loader2, Package } from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  product_id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  total_price: number;
  discount_amount: number;
  wallet_points_used: number;
  coupon_code: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  items: OrderItem[];
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const user = getStoredUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/user/login");
      return;
    }
    if (id) {
      fetchOrder();
    }
  }, [id, user, navigate]);

  const fetchOrder = async () => {
    try {
      const data = await getOrderById(id!);
      setOrder(data.order);
    } catch (error: any) {
      toast.error("Failed to fetch order");
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
      case "delivered":
        return "text-green-400";
      case "processing":
      case "pending":
      case "shipped":
        return "text-yellow-400";
      case "failed":
      case "cancelled":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "success":
      case "delivered":
        return "bg-green-500/10";
      case "processing":
      case "pending":
      case "shipped":
        return "bg-yellow-500/10";
      case "failed":
      case "cancelled":
        return "bg-red-500/10";
      default:
        return "bg-slate-500/10";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Order not found
          </h2>
          <Link to="/orders">
            <Button className="bg-blue-500 hover:bg-blue-600">
              Back to Orders
            </Button>
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
          <Link
            to="/orders"
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
        </div>
      </div>

      {/* Order Details */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          {/* Order Header */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-white text-2xl mb-2">
                    Order #{order.id.slice(0, 8)}
                  </CardTitle>
                  <p className="text-slate-400">
                    Placed on {new Date(order.created_at).toLocaleDateString()}{" "}
                    at {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <div
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBg(order.payment_status)} ${getStatusColor(order.payment_status)}`}
                  >
                    Payment: {order.payment_status.toUpperCase()}
                  </div>
                  <div
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBg(order.order_status)} ${getStatusColor(order.order_status)}`}
                  >
                    Status: {order.order_status.toUpperCase()}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Order Items */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items &&
                  order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start pb-4 border-b border-slate-700 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="text-white font-semibold">{item.name}</p>
                        <p className="text-slate-400 text-sm">
                          Quantity: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="text-blue-400 font-semibold">
                        ${(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal</span>
                  <span>
                    $
                    {(
                      order.total_price +
                      order.discount_amount +
                      order.wallet_points_used
                    ).toFixed(2)}
                  </span>
                </div>

                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>
                      Discount {order.coupon_code && `(${order.coupon_code})`}
                    </span>
                    <span>-${order.discount_amount.toFixed(2)}</span>
                  </div>
                )}

                {order.wallet_points_used > 0 && (
                  <div className="flex justify-between text-yellow-400">
                    <span>Wallet Points</span>
                    <span>-${order.wallet_points_used.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-slate-700 pt-3 flex justify-between text-white font-bold text-lg">
                  <span>Total Amount</span>
                  <span className="text-blue-400">
                    ${order.total_price.toFixed(2)}
                  </span>
                </div>
              </div>

              <Link to="/products" className="block">
                <Button
                  variant="outline"
                  className="w-full border-slate-600 text-slate-200"
                >
                  Continue Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
