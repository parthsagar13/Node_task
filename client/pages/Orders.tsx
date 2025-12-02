import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrders, getStoredUser } from "@/lib/api";
import { ArrowLeft, Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  total_price: number;
  payment_status: string;
  order_status: string;
  created_at: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getStoredUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/user/login");
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data.orders || []);
    } catch (error: any) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-400";
      case "processing":
      case "pending":
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
        return "bg-green-500/10";
      case "processing":
      case "pending":
        return "bg-yellow-500/10";
      case "failed":
      case "cancelled":
        return "bg-red-500/10";
      default:
        return "bg-slate-500/10";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/products" className="flex items-center gap-2 text-slate-400 hover:text-slate-200">
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
          <h1 className="text-2xl font-bold text-white">My Orders</h1>
          <div className="w-32"></div>
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-4">No orders yet</p>
            <Link to="/products">
              <Button className="bg-blue-500 hover:bg-blue-600">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order.id} to={`/orders/${order.id}`}>
                <Card className="bg-slate-800 border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <p className="text-white font-semibold">Order #{order.id.slice(0, 8)}</p>
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBg(order.payment_status)} ${getStatusColor(order.payment_status)}`}>
                            {order.payment_status.toUpperCase()}
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBg(order.order_status)} ${getStatusColor(order.order_status)}`}>
                            {order.order_status.toUpperCase()}
                          </div>
                        </div>
                        <p className="text-slate-400 text-sm">
                          {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-sm mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-blue-400">
                          ${order.total_price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
