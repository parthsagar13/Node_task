import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Store, TrendingUp, Lock, Zap, Star } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            ShopHub
          </div>
          <div className="flex gap-4">
            <Link to="/user/login">
              <Button
                variant="outline"
                className="border-slate-600 text-slate-200"
              >
                User Login
              </Button>
            </Link>
            <Link to="/seller/login">
              <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                Seller Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              ShopHub
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            A complete e-commerce platform for buyers and sellers. Shop amazing
            products or sell your own.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-20">
          {/* Customers Section */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 backdrop-blur-sm hover:border-blue-500/50 transition-all">
            <div className="bg-blue-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <ShoppingCart className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              For Customers
            </h2>
            <p className="text-slate-400 mb-6">
              Browse thousands of products, manage your cart, and checkout
              securely. Use wallet points and coupons for discounts.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-slate-300">
                <Zap className="w-4 h-4 text-blue-400" />
                <span>Easy product browsing</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Lock className="w-4 h-4 text-blue-400" />
                <span>Secure checkout</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Star className="w-4 h-4 text-blue-400" />
                <span>Wallet points & coupons</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/user/register" className="flex-1">
                <Button className="w-full bg-blue-500 hover:bg-blue-600">
                  Sign Up
                </Button>
              </Link>
              <Link to="/user/login" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-slate-600 text-slate-200"
                >
                  Login
                </Button>
              </Link>
            </div>
          </div>

          {/* Sellers Section */}
          <div className="bg-cyan-500/10 border border-cyan-600/30 rounded-xl p-8 backdrop-blur-sm hover:border-cyan-500/50 transition-all">
            <div className="bg-cyan-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Store className="w-6 h-6 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">For Sellers</h2>
            <p className="text-slate-400 mb-6">
              Create your shop, add products, manage inventory, and reach
              thousands of customers instantly.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-slate-300">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Grow your business</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Secure transactions</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Real-time inventory</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/seller/register" className="flex-1">
                <Button className="w-full bg-cyan-500 hover:bg-cyan-600">
                  Register Shop
                </Button>
              </Link>
              <Link to="/seller/login" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-slate-600 text-slate-200"
                >
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-8 backdrop-blur-sm">
          <h3 className="text-2xl font-bold text-white mb-8 text-center">
            Why Choose ShopHub?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">100%</div>
              <p className="text-slate-300">Secure Transactions</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-400 mb-2">24/7</div>
              <p className="text-slate-300">Platform Available</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">
                10K+
              </div>
              <p className="text-slate-300">Active Products</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Start Shopping Today
        </h2>
        <p className="text-slate-300 mb-8">
          Browse our collection or list your products
        </p>
        <Link to="/products">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          >
            Explore Products
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-slate-400">
          <p>&copy; 2024 ShopHub. All rights reserved. | E-Commerce Platform</p>
        </div>
      </footer>
    </div>
  );
}
