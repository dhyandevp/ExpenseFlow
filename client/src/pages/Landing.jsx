import SEO from "../components/SEO";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Shield,
  BarChart3,
  ArrowRight,
  Users,
  Home,
  Star,
  LogIn,
  CheckCircle2,
  PieChart,
  Calculator,
  RefreshCw,
  FileText,
  Download,
  Lock,
  ChevronDown,
  UserPlus,
  ArrowDownUp,
  Check,
  Building2,
  Plane,
  Heart,
  Settings,
  Image as ImageIcon
} from "lucide-react";
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

const AccordionItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
        aria-expanded={isOpen}
      >
        <span className="font-heading font-semibold text-text-dark text-lg">{question}</span>
        <ChevronDown
          size={20}
          className={`text-text-muted transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-text-muted leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function Landing() {
  const navigate = useNavigate();
  const { user, isLoaded, authMode } = useAuth();
  
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isGuestJoinOpen, setIsGuestJoinOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  // If already authenticated, redirect
  useEffect(() => {
    if (isLoaded && user) {
      if (authMode === "clerk" || authMode === "guest") {
        navigate("/home"); 
      }
    }
  }, [user, isLoaded, authMode, navigate]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden">
      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
      <GuestJoinModal isOpen={isGuestJoinOpen} onClose={() => setIsGuestJoinOpen(false)} />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50"
      >
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="ExpenseFlow logo">
              <path d="M6 22C6 22 10 18 16 18C22 18 26 22 26 22" stroke="#105D5E" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
              <path d="M4 17C4 17 9 12 16 12C23 12 28 17 28 17" stroke="#105D5E" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
              <path d="M2 12C2 12 8 6 16 6C24 6 30 12 30 12" stroke="#105D5E" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="font-heading font-bold text-xl text-text-dark tracking-tight">
              ExpenseFlow
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-muted">
            <button onClick={() => scrollTo('features')} className="hover:text-text-dark transition-colors">Features</button>
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-text-dark transition-colors">How it works</button>
            <button onClick={() => scrollTo('faq')} className="hover:text-text-dark transition-colors">FAQ</button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSignInOpen(true)}
              className="text-[#105D5E] font-semibold hover:bg-white/50 px-4 py-2 rounded-xl transition-all text-sm hidden sm:block"
            >
              Sign In
            </button>
            <button
              onClick={() => setIsGuestJoinOpen(true)}
              className="btn-primary text-sm"
            >
              Join with Code
            </button>
          </div>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="px-6 pt-16 pb-20 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
                <Shield size={14} />
                Fair sharing, clear minds.
              </span>
              <h1 className="font-heading font-extrabold text-4xl md:text-5xl lg:text-6xl text-text-dark leading-tight mb-6">
                Stop arguing about
                <span className="text-primary"> who paid what</span>.
              </h1>
              <p className="text-lg md:text-xl text-text-muted leading-relaxed mb-10 max-w-lg">
                ExpenseFlow tracks shared expenses over weeks and months,
                showing you who's contributing fairly — not just who owes what
                right now.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button onClick={() => setIsSignInOpen(true)} className="btn-primary text-base px-8 py-4">
                Sign In to Create
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => setIsGuestJoinOpen(true)}
                className="btn-secondary text-base px-8 py-4 bg-white/60 hover:bg-white border border-border"
              >
                <Users size={18} />
                Join with Code & PIN
              </button>
            </motion.div>
          </div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="hidden lg:flex items-center justify-center relative"
          >
            <div className="relative z-10 w-80 rounded-[2rem] glass p-6 shadow-2xl" style={{ border: '1px solid rgba(255,255,255,0.8)' }}>
              <div className="space-y-4">
                <div className="pb-2 border-b border-border/50 flex justify-between items-end">
                  <div>
                    <div className="text-xs text-text-muted mb-1">Group Balance</div>
                    <div className="text-2xl font-bold font-mono text-text-dark">₹12,850</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-text-muted mb-1">Fairness Score</div>
                    <div className="text-lg font-bold text-primary flex items-center gap-1 justify-end">
                      87/100
                    </div>
                  </div>
                </div>
                
                {[
                  { name: "Alex", amount: "+₹3,400", color: "#009A6E" },
                  { name: "Jamie", amount: "-₹2,100", color: "#767F7D" },
                  { name: "Sam", amount: "+₹700", color: "#009A6E" },
                  { name: "Taylor", amount: "-₹2,000", color: "#767F7D" },
                ].map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm border border-border/30"
                  >
                    <span className="text-sm font-medium text-text-dark flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {p.name.charAt(0)}
                      </div>
                      {p.name}
                    </span>
                    <span
                      className={`font-mono text-sm font-bold ${
                        p.color === "#009A6E"
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
            
            {/* Decorative background blobs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-highlight rounded-3xl rotate-12 opacity-40 -z-10" />
            <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-success/20 rounded-2xl -rotate-12 -z-10" />
          </motion.div>
        </div>
      </section>

      {/* Why ExpenseFlow? */}
      <section className="px-6 py-20 max-w-4xl mx-auto text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
        >
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-text-dark mb-6">
            More than just "who owes whom"
          </h2>
          <p className="text-lg text-text-muted leading-relaxed mb-16 max-w-2xl mx-auto">
            Traditional expense splitting focuses on today's debt, which often leads to awkward conversations. ExpenseFlow helps you understand the bigger picture, offering calm financial visibility for real groups.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Built for real groups",
              desc: "Designed for roommates, couples, families, and travel groups sharing ongoing expenses.",
              icon: Users
            },
            {
              title: "Calm visibility",
              desc: "See exactly where money goes without confrontation. The goal is clarity, not arguments.",
              icon: Shield
            },
            {
              title: "Long-term fairness",
              desc: "Understand contribution patterns over months, making it easier to balance things out naturally.",
              icon: TrendingUp
            }
          ].map((item, i) => (
            <motion.div 
              key={i} 
              custom={i} 
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-border flex items-center justify-center mb-6 text-primary">
                <item.icon size={28} />
              </div>
              <h3 className="font-heading font-bold text-xl text-text-dark mb-3">{item.title}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="px-6 py-24 bg-white/50 border-y border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-text-dark mb-4">
              How ExpenseFlow works
            </h2>
            <p className="text-text-muted text-lg max-w-xl mx-auto">
              Four simple steps to financial clarity for your shared expenses.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: "01", title: "Create or join a group", desc: "Set up a group and securely invite members with a unique code and PIN.", icon: UserPlus },
              { num: "02", title: "Track shared expenses", desc: "Record who paid, how much, and securely attach receipts if needed.", icon: Calculator },
              { num: "03", title: "See balances & fairness", desc: "View real-time balances and an overall fairness score for the group.", icon: BarChart3 },
              { num: "04", title: "Settle up with clarity", desc: "Follow simplified settlement suggestions to clear debts efficiently.", icon: ArrowDownUp }
            ].map((step, i) => (
              <motion.div 
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                className="relative"
              >
                {i !== 3 && <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-px bg-dashed border-t-2 border-dashed border-border/80 z-0"></div>}
                <div className="relative z-10 flex flex-col items-start bg-surface/50 p-6 rounded-3xl border border-border h-full">
                  <div className="flex items-center justify-between w-full mb-6">
                    <span className="font-mono text-4xl font-black text-primary/10">{step.num}</span>
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                      <step.icon size={24} />
                    </div>
                  </div>
                  <h3 className="font-heading font-bold text-xl text-text-dark mb-3">{step.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="px-6 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-text-dark mb-4">
            Everything you need. Nothing you don't.
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            ExpenseFlow provides the precise tools needed to manage shared finances without the bloat of traditional accounting software.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-x-12 gap-y-16">
          {[
            {
              title: "Shared expense tracking",
              desc: "Record who paid, how much, what it was for, and how it should be split. Keep a transparent history accessible to all group members.",
              icon: FileText
            },
            {
              title: "Flexible splitting",
              desc: "Support for equal splits, custom amounts, custom percentages, and specific models like room-size or income-weighted splits.",
              icon: PieChart
            },
            {
              title: "Fairness insights",
              desc: "ExpenseFlow looks beyond immediate balances, offering a 0-100 Fairness Score that helps you understand longer-term contribution patterns.",
              icon: Star
            },
            {
              title: "Automatic balance calculation",
              desc: "Instantly see exactly who is ahead or behind. We handle the complex math of multiple payers and mixed splits automatically.",
              icon: Calculator
            },
            {
              title: "Settlement suggestions",
              desc: "Simplifies complex webs of group debt into the minimum number of practical settlement transactions to square everyone up.",
              icon: ArrowDownUp
            },
            {
              title: "Scenario planning",
              desc: "Simulate hypothetical future expenses (like an upcoming trip or large purchase) to see how they would affect balances before spending.",
              icon: RefreshCw
            },
            {
              title: "Receipt management",
              desc: "Upload and view images of receipts alongside expenses to maintain a clear, indisputable record of shared purchases.",
              icon: ImageIcon
            },
            {
              title: "Reports and exports",
              desc: "Generate comprehensive fairness reports and export your entire group ledger to CSV for external records or printing.",
              icon: Download
            }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              custom={i % 2}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="flex gap-6"
            >
              <div className="shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mt-1">
                <feature.icon size={24} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-xl text-text-dark mb-2">{feature.title}</h3>
                <p className="text-text-muted leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Product Preview */}
      <section className="px-6 py-20 bg-text-dark text-background overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsIDI1NSLCAyNTUsIDAuMSkiLz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="max-w-6xl mx-auto relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mb-6">
              See the big picture instantly
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-8">
              Your dashboard presents a clean, unified view of your group's financial health. No digging through menus to find out where you stand.
            </p>
            <ul className="space-y-4">
              {['Total spending summaries', 'Per-member balance views', 'Category breakdowns', 'One-click settlements'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white/90">
                  <CheckCircle2 size={20} className="text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-[#1C2321] rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl relative"
          >
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
              <div>
                <div className="text-white/50 text-sm mb-1">Your group's financial picture</div>
                <div className="text-xl font-heading font-bold text-white">Apartment 4B</div>
              </div>
              <div className="text-right">
                <div className="text-white/50 text-sm mb-1">Total spending</div>
                <div className="font-mono text-xl font-bold text-white">₹24,800</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                <div className="text-white/50 text-sm mb-2">Fairness Score</div>
                <div className="text-3xl font-bold text-primary">87 <span className="text-lg text-white/30 font-normal">/ 100</span></div>
              </div>
              <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                <div className="text-white/50 text-sm mb-2">Your Balance</div>
                <div className="text-3xl font-bold font-mono text-success">+₹1,240</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">A</div>
                  <span className="text-white/90">Alex</span>
                </div>
                <span className="text-success font-mono font-medium">+₹1,240</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">T</div>
                  <span className="text-white/90">Taylor</span>
                </div>
                <span className="text-white/50 font-mono font-medium">-₹1,240</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Who is it for? */}
      <section className="px-6 py-24 bg-white/50 border-b border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-text-dark mb-4">
              Built for shared expenses
            </h2>
            <p className="text-text-muted text-lg">
              Designed specifically for groups that share costs repeatedly.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Roommates", desc: "Track rent, groceries, utilities, and household expenses fairly.", icon: Building2 },
              { title: "Couples", desc: "Keep shared spending visible without turning every purchase into a discussion.", icon: Heart },
              { title: "Trips", desc: "Track shared travel costs and settle them easily at the end of the journey.", icon: Plane },
              { title: "Shared households", desc: "Understand long-term contribution across multiple categories and responsibilities.", icon: Home }
            ].map((audience, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="bg-white p-6 rounded-2xl shadow-sm border border-border"
              >
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-text-dark mb-4">
                  <audience.icon size={20} />
                </div>
                <h3 className="font-heading font-bold text-lg text-text-dark mb-2">{audience.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{audience.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features at a Glance */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <h2 className="font-heading font-bold text-2xl text-center text-text-dark mb-10">Features at a Glance</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
          {[
            { label: "Expense tracking", icon: FileText },
            { label: "Custom splits", icon: PieChart },
            { label: "Receipt uploads", icon: ImageIcon },
            { label: "Balance calculation", icon: Calculator },
            { label: "Fairness insights", icon: Star },
            { label: "Settlement suggestions", icon: ArrowDownUp },
            { label: "Scenario planning", icon: RefreshCw },
            { label: "Reports & CSV export", icon: Download },
            { label: "PIN-protected access", icon: Lock }
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <feature.icon size={18} className="text-primary shrink-0" />
              <span className="text-sm font-medium text-text-dark">{feature.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-24 bg-white/50 border-y border-border/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-text-dark mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-border px-6 py-2">
            {[
              {
                q: "What is ExpenseFlow?",
                a: "ExpenseFlow is a minimal, professional web application that helps groups track shared expenses, automatically calculate balances, and understand long-term fairness."
              },
              {
                q: "Is ExpenseFlow only for roommates?",
                a: "While it's perfect for roommates, it's also designed for couples sharing living costs, travel groups splitting vacation expenses, and any small team managing shared finances."
              },
              {
                q: "Can I split an expense unevenly?",
                a: "Yes. ExpenseFlow supports equal splits, custom exact amounts, percentage-based splits, and advanced models like income-weighted or room-size weighted splits depending on your group configuration."
              },
              {
                q: "Can I join a group without creating an account?",
                a: "Yes! Group owners can generate a unique 6-character Group Code and an optional secure PIN. You can join directly as a Guest using only this code and PIN without signing up."
              },
              {
                q: "How does fairness work?",
                a: "Fairness evaluates long-term contribution patterns. If one person constantly pays for large expenses and another only pays for small ones, the Fairness Score reflects this imbalance, encouraging groups to share the burden naturally over time."
              },
              {
                q: "Does ExpenseFlow automatically calculate who owes whom?",
                a: "Yes. It tracks all expenses and payments, calculates individual net balances, and generates simplified settlement suggestions to clear debts with the fewest possible transactions."
              },
              {
                q: "Can I upload receipts?",
                a: "Yes, you can securely attach images of receipts to any expense for transparency and record-keeping."
              },
              {
                q: "Can I simulate future expenses?",
                a: "Yes! The Scenario Planner allows you to add hypothetical expenses to see how they would impact the group's balances before you actually spend the money."
              },
              {
                q: "Can I export my data?",
                a: "Absolutely. You can view detailed Fairness Reports and export your entire group's expense ledger to a CSV file at any time."
              },
              {
                q: "Is my group's data private?",
                a: "Yes. Access is strictly controlled via secure authentication. Group data is isolated in Firestore, meaning only authenticated members of your specific group can read or write its expenses."
              },
              {
                q: "Do I need to install an app?",
                a: "No installation is required. ExpenseFlow is a responsive web application that works directly in your browser on desktop, tablet, and mobile devices."
              }
            ].map((faq, i) => (
              <AccordionItem
                key={i}
                question={faq.q}
                answer={faq.a}
                isOpen={openFaq === i}
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Privacy */}
      <section className="px-6 py-20 max-w-4xl mx-auto text-center">
        <div className="w-16 h-16 bg-background rounded-full mx-auto flex items-center justify-center mb-6 text-primary">
          <Lock size={32} />
        </div>
        <h2 className="font-heading font-bold text-2xl text-text-dark mb-4">
          Secure & Private
        </h2>
        <p className="text-text-muted leading-relaxed max-w-2xl mx-auto">
          We use secure, standard authentication practices. Your group's financial data is strictly isolated—only invited members can view your ledger. We don't include unnecessary social features or public feeds, keeping your finances exactly where they belong: between you and your group.
        </p>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto bg-primary text-white rounded-[2.5rem] p-10 md:p-16 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsIDI1NSLCAyNTUsIDAuMTkiLz48L3N2Zz4=')] opacity-20"></div>
          
          <div className="relative z-10">
            <h2 className="font-heading font-bold text-3xl md:text-5xl mb-6 leading-tight">
              Ready to make shared expenses simpler?
            </h2>
            <p className="text-white/80 text-lg md:text-xl mb-10 max-w-xl mx-auto">
              Create a group, invite your people, and start tracking.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => setIsSignInOpen(true)}
                className="bg-white text-primary font-bold px-8 py-4 rounded-xl hover:bg-white/90 transition-colors"
              >
                Create a Group
              </button>
              <button 
                onClick={() => setIsGuestJoinOpen(true)}
                className="bg-primary-dark/30 border border-white/20 text-white font-bold px-8 py-4 rounded-xl hover:bg-primary-dark/50 transition-colors"
              >
                Join with Code
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 pt-16 pb-24 md:pb-12 bg-white border-t border-border mt-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 22C6 22 10 18 16 18C22 18 26 22 26 22" stroke="#105D5E" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
                  <path d="M4 17C4 17 9 12 16 12C23 12 28 17 28 17" stroke="#105D5E" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
                  <path d="M2 12C2 12 8 6 16 6C24 6 30 12 30 12" stroke="#105D5E" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <span className="font-heading font-bold text-lg text-text-dark tracking-tight">
                  ExpenseFlow
                </span>
              </div>
              <p className="text-text-muted text-sm leading-relaxed max-w-xs mb-6">
                Fair sharing, clear minds. Designed to help groups track expenses and settle up without the awkwardness.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-text-dark mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-text-muted">
                <li><button onClick={() => scrollTo('features')} className="hover:text-primary transition-colors">Features</button></li>
                <li><button onClick={() => scrollTo('how-it-works')} className="hover:text-primary transition-colors">How it works</button></li>
                <li><button onClick={() => scrollTo('faq')} className="hover:text-primary transition-colors">FAQ</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-text-dark mb-4">Account</h4>
              <ul className="space-y-3 text-sm text-text-muted">
                <li><button onClick={() => setIsSignInOpen(true)} className="hover:text-primary transition-colors">Sign In</button></li>
                <li><button onClick={() => setIsGuestJoinOpen(true)} className="hover:text-primary transition-colors">Join with Code</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-text-dark mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-text-muted">
                <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Support</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-muted">
            <p>© {new Date().getFullYear()} ExpenseFlow. All rights reserved.</p>
            <p>Made for roommates, couples, and close friends.</p>
          </div>
        </div>
      </footer>

      {/* Public FAB */}
      <button
        onClick={() => setIsGuestJoinOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-40 btn-primary shadow-lg rounded-full w-14 h-14 p-0 flex items-center justify-center bg-primary text-background"
        aria-label="Join with Code"
      >
        <Users size={24} />
      </button>

      {/* Public Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 glass-nav safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] px-3 py-1 rounded-xl transition-all text-primary"
          >
            <Home size={20} />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button
            onClick={() => scrollTo('features')}
            className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] px-3 py-1 rounded-xl transition-all text-text-muted hover:text-text-dark"
          >
            <Star size={20} />
            <span className="text-[10px] font-medium">Features</span>
          </button>
          <button
            onClick={() => setIsSignInOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] px-3 py-1 rounded-xl transition-all text-text-muted hover:text-text-dark"
          >
            <LogIn size={20} />
            <span className="text-[10px] font-medium">Sign In</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default function LandingWrapper(props) {
  return (
    <>
      <SEO 
        title="ExpenseFlow — Shared expenses without the awkwardness" 
        description="ExpenseFlow helps groups track shared expenses, understand fairness, and settle up without the awkwardness. Perfect for roommates, couples, and trips."
      />
      <Landing {...props} />
    </>
  );
}
