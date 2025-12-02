import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-20 h-20 text-red-400 mx-auto mb-4" />
        <h1 className="text-6xl font-bold text-white mb-2">404</h1>
        <p className="text-2xl text-slate-300 mb-2">Page Not Found</p>
        <p className="text-slate-400 mb-8 text-lg">
          The page you're looking for doesn't exist
        </p>
        <Link to="/">
          <Button className="bg-blue-500 hover:bg-blue-600">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
