import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProducts, getStoredUser } from "@/lib/api";
import { ArrowLeft, ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  shop_name: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getStoredUser();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data.products || []);
    } catch (error: any) {
      toast.error("Failed to fetch products");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Please log in to view products
          </h2>
          <Link to="/user/login">
            <Button className="bg-blue-500 hover:bg-blue-600">
              Login as Customer
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-slate-400 hover:text-slate-200">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold text-white">Products</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-slate-300 text-sm">Welcome, {user.name}</div>
            <Link to="/cart">
              <Button
                variant="outline"
                className="border-slate-600 text-slate-200"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart
              </Button>
            </Link>
            <Link to="/orders">
              <Button
                variant="outline"
                className="border-slate-600 text-slate-200"
              >
                Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No products available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Link key={product.id} to={`/products/${product.id}`}>
                <Card className="bg-slate-800 border-slate-700 hover:border-blue-500/50 transition-all h-full cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-white">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-400 text-sm line-clamp-2">
                      {product.description || "No description"}
                    </p>
                    <div className="space-y-2">
                      <p className="text-slate-300 text-xs">
                        Shop: {product.shop_name || "Unknown"}
                      </p>
                      <p className="text-slate-300">
                        Stock:{" "}
                        <span
                          className={
                            product.stock > 0
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {product.stock > 0
                            ? `${product.stock} available`
                            : "Out of stock"}
                        </span>
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                      <span className="text-xl font-bold text-blue-400">
                        ${product.price.toFixed(2)}
                      </span>
                      <Button
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        View Details
                      </Button>
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
