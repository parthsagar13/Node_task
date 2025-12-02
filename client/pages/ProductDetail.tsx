import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getProductById, addToCart, getStoredUser } from "@/lib/api";
import { ArrowLeft, Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  shop_name: string;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const user = getStoredUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const data = await getProductById(id!);
      setProduct(data.product);
    } catch (error: any) {
      toast.error("Failed to fetch product");
      navigate("/products");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please log in to add items to cart");
      navigate("/user/login");
      return;
    }

    setAdding(true);
    try {
      await addToCart(id!, quantity);
      toast.success("Added to cart!");
      navigate("/cart");
    } catch (error: any) {
      toast.error(error.message || "Failed to add to cart");
    } finally {
      setAdding(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Product not found
          </h2>
          <Link to="/products">
            <Button className="bg-blue-500 hover:bg-blue-600">
              Back to Products
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
            to="/products"
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
        </div>
      </div>

      {/* Product Detail */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Product Image Placeholder */}
              <div className="bg-gradient-to-br from-slate-700 to-slate-600 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center">
                  <ShoppingCart className="w-16 h-16 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-400">Product Image</p>
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {product.name}
                  </h1>
                  <p className="text-slate-300 text-sm">
                    Shop: {product.shop_name || "Unknown"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-slate-400">Description:</p>
                  <p className="text-slate-300">
                    {product.description || "No description available"}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Price</p>
                    <p className="text-4xl font-bold text-blue-400">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-sm mb-1">
                      Stock Available
                    </p>
                    <p
                      className={`text-lg font-semibold ${product.stock > 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {product.stock > 0
                        ? `${product.stock} items`
                        : "Out of stock"}
                    </p>
                  </div>
                </div>

                {product.stock > 0 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-slate-300 text-sm block mb-2">
                        Quantity
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max={product.stock}
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(
                            Math.max(1, parseInt(e.target.value) || 1),
                          )
                        }
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>

                    <Button
                      onClick={handleAddToCart}
                      disabled={adding || quantity > product.stock}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-6"
                    >
                      {adding ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
