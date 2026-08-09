import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Users, AlertTriangle } from "lucide-react";
import SEO from "../components/SEO";

function NotFound() {
  return (
    <>
      <SEO title="404 — Page Not Found" description="The page you are looking for does not exist." noindex={true} />
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass max-w-md w-full p-8 rounded-2xl flex flex-col items-center"
      >
        <div className="w-20 h-20 bg-highlight/30 rounded-full flex items-center justify-center mb-6 text-primary">
          <AlertTriangle size={40} />
        </div>
        
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          Page Not Found
        </h1>
        <p className="text-text-muted mb-8 text-sm">
          We couldn't find the page you were looking for. It might have been moved or doesn't exist.
        </p>

        <div className="flex flex-col w-full gap-3">
          <Link to="/" className="btn-primary w-full justify-center">
            <Home size={18} />
            Go Home
          </Link>
          <Link to="/setup" className="btn-secondary w-full justify-center">
            <Users size={18} />
            Join or Create Group
          </Link>
        </div>
      </motion.div>
    </div>
    </>
  );
}

export default NotFound;
