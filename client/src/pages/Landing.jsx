import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Shield,
  BarChart3,
  ArrowRight,
  Users,
} from "lucide-react";
import { useSEO } from "../utils/seo";
import useDocumentTitle from "../hooks/useDocumentTitle";
import SignInModal from "../components/auth/SignInModal";
import GuestJoinModal from "../components/auth/GuestJoinModal";
import { useAuth } from "../hooks/useAuth";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

export default function Landing() {
  const navigate = useNavigate();
  useSEO({
    title: "ExpenseFlow — Free Expense Sharing App for Roommates & Couples",
    description: "Track shared expenses fairly over months, not just per bill. See who's contributing fairly with category insights, fairness scores, and scenario planning.",
    url: "/"
  });

  const { user, isLoaded, authMode } = useAuth();
  
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isGuestJoinOpen, setIsGuestJoinOpen] = useState(false);

  // If already authenticated, redirect
  useEffect(() => {
    if (isLoaded && user) {
      if (authMode === "clerk") {
        navigate("/setup"); // Or a group selection dashboard
      } else if (authMode === "guest") {
        // Guests only have access to one group, so redirect to it
        // We'll just go to dashboard if group context handles it, but typically guests need the code.
        // Actually, GuestJoinModal sets up Firebase Auth, the app will handle fetching group info in a protected route.
        // For now, redirect to a safe place. Wait, how do we know the group code?
        // App.jsx routing relies on currentGroup context. We might need a bridge, but for now just navigate to a placeholder or let App handle it.
        navigate("/setup"); // They can't access setup, but we'll secure it in App.jsx
      }
    }
  }, [user, isLoaded, authMode, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
      <GuestJoinModal isOpen={isGuestJoinOpen} onClose={() => setIsGuestJoinOpen(false)} />

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="ExpenseFlow logo">💸</span>
          <span className="font-heading font-bold text-xl text-text-dark">
            ExpenseFlow
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSignInOpen(true)}
            className="text-text-muted hover:text-text-dark text-sm font-medium transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => setIsGuestJoinOpen(true)}
            className="btn-primary text-sm"
          >
            Join Group
          </button>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-20 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
                <Shield size={14} />
                Fair sharing, clear minds.
              </span>
              <h1 className="font-heading font-extrabold text-4xl md:text-5xl lg:text-6xl text-text-dark leading-tight mb-4">
                Stop arguing about
                <span className="text-primary"> who paid what</span>.
              </h1>
              <p className="text-lg text-text-muted leading-relaxed mb-8 max-w-lg">
                ExpenseFlow tracks shared expenses over weeks and months,
                showing you who's contributing fairly — not just who owes what
                right now.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-3 mb-10"
            >
              <button onClick={() => setIsSignInOpen(true)} className="btn-primary text-base px-6 py-3">
                Create a Group
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => setIsGuestJoinOpen(true)}
                className="btn-secondary text-base px-6 py-3"
              >
                <Users size={18} />
                Join a Group
              </button>
            </motion.div>
          </div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="hidden lg:flex items-center justify-center"
          >
            <div className="relative">
              <div className="w-72 h-72 rounded-3xl glass p-6 shadow-xl">
                <div className="space-y-3">
                  {[
                    { name: "Alex", amount: "+₹3,400", color: "#009A6E" },
                    { name: "Jamie", amount: "-₹2,100", color: "#767F7D" },
                    { name: "Sam", amount: "+₹700", color: "#009A6E" },
                    { name: "Taylor", amount: "-₹2,000", color: "#767F7D" },
                  ].map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm"
                    >
                      <span className="text-sm font-medium text-text-dark">
                        {p.name}
                      </span>
                      <span
                        className={`font-mono text-sm font-bold ${
                          p.color === "#4CAF82"
                            ? "text-success"
                            : "text-text-muted"
                        }`}
                      >
                        {p.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-highlight rounded-2xl rotate-12 opacity-30" />
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-primary/20 rounded-xl -rotate-12" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Value Props */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-heading font-bold text-2xl md:text-3xl text-text-dark text-center mb-12"
        >
          Why ExpenseFlow?
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: TrendingUp,
              title: "Long-term fairness",
              desc: "Track who pays what over months, not just per bill. See the big picture.",
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              icon: BarChart3,
              title: "Category insights",
              desc: "See fairness patterns by category. Who's covering groceries? Who pays rent?",
              color: "text-success",
              bg: "bg-success/10",
            },
            {
              icon: Shield,
              title: "Scenario planning",
              desc: "Simulate future expenses before they happen. Plan ahead with confidence.",
              color: "text-accent",
              bg: "bg-accent/10",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              className="card-hover p-6"
            >
              <div
                className={`w-12 h-12 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-4`}
              >
                <item.icon size={24} />
              </div>
              <h3 className="font-heading font-bold text-lg text-text-dark mb-2">
                {item.title}
              </h3>
              <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border mt-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-text-muted text-sm">
            <span>⚖️</span>
            <span>ExpenseFlow — Fair sharing, clear minds.</span>
          </div>
          <p className="text-text-muted text-xs">
            Made for roommates, couples, and close friends.
          </p>
        </div>
      </footer>
    </div>
  );
}
