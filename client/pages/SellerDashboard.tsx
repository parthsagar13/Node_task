import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSellerProducts, getStoredSeller } from "@/lib/api";
import { ArrowLeft, Loader2, Plus, Edit2, Package } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
}

export default function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const seller = getStoredSeller();
  const navigate = useNavigate();

  useEffect(() => {
    if (!seller) {
      navigate("/seller/login");
      return;
    }
    fetchProducts();
  }, [seller, navigate]);

  const fetchProducts = async () => {
    try {
      const data = await getSellerProducts();
      setProducts(data.products || []);
    } catch (error: any) {
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = products.reduce((sum, p) => sum + (p.price * (100 - p.stock)), 0);
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-200">
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {seller?.shop_name || "Seller Dashboard"}
          </h1>
          <Button
            variant="outline"
            onClick={() => {
              localStorage.removeItem("seller_token");
              localStorage.removeItem("seller");
              navigate("/seller/login");
            }}
            className="border-slate-600 text-slate-200"
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-400 text-sm font-medium">
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{products.length}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-400 text-sm font-medium">
                Total Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-400">{totalStock}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-400 text-sm font-medium">
                Shop Name
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-cyan-400">{seller?.shop_name}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-400 text-sm font-medium">
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold text-slate-300">{seller?.email}</p>
            </CardContent>
          </Card>
        </div>

        {/* Products Section */}
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Your Products</h2>
          <Link to="/seller/products/add">
            <Button className="bg-cyan-500 hover:bg-cyan-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-4">No products added yet</p>
            <Link to="/seller/products/add">
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Product
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {products.map((product) => (
              <Card key={product.id} className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                      <p className="text-slate-400 text-sm line-clamp-1 mb-3">
                        {product.description || "No description"}
                      </p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Price</p>
                          <p className="text-blue-400 font-semibold">
                            ${product.price.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Stock</p>
                          <p className={`font-semibold ${product.stock > 10 ? "text-green-400" : product.stock > 0 ? "text-yellow-400" : "text-red-400"}`}>
                            {product.stock} units
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">ID</p>
                          <p className="text-slate-300 text-xs">{product.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </div>
                    <Link to={`/seller/products/${product.id}/edit`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-slate-200"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
