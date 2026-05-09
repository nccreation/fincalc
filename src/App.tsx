/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useReducer, useCallback, useRef, Suspense, lazy } from 'react';
import { 
  Calculator, 
  Percent, 
  Tag, 
  TrendingUp, 
  CreditCard, 
  LineChart, 
  Scale, 
  RefreshCcw, 
  Calendar, 
  Ruler, 
  FileText,
  ChevronRight, 
  Sun, 
  Moon, 
  History, 
  LayoutGrid,
  Menu,
  X,
  Delete,
  Divide,
  Minus,
  Plus,
  Equal,
  RotateCcw,
  Banknote,
  Landmark,
  Coins,
  Zap,
  Fuel as FuelIcon,
  Receipt,
  PieChart,
  ShoppingBag,
  Search,
  Home,
  BarChart3,
  User,
  Globe,
  Bell,
  Crown,
  ShieldCheck,
  TrendingDown,
  Wallet,
  Calculator as CalcIcon,
  PieChart as PortfolioIcon,
  Newspaper,
  UserPlus,
  ArrowRightLeft,
  Mail,
  TableProperties,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Mic,
  MicOff,
  Volume2,
  BrainCircuit,
  Trash2,
  Heart,
  Loader2,
  TrendingUp as TrendingIcon,
  Star,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import * as ReactWindow from 'react-window';
const FixedSizeList = (ReactWindow as any).FixedSizeList || (ReactWindow as any).default?.FixedSizeList;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- Performance Utilities ---
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-white/5 rounded-xl ${className}`} />
);

const MarketRow = React.memo(({ data, index, style }: any) => {
  const { results, toggleWatchlist, isLiked } = data;
  const asset = results[index];
  
  if (!asset) return null;

  return (
    <div style={style} className="px-2 pb-2">
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 flex items-center justify-between group hover:scale-[1.01] transition-transform shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xl shadow-inner italic">
            {asset.icon}
          </div>
          <div>
            <h4 className="text-[11px] font-black tracking-tight">{asset.name}</h4>
            <div className={`flex items-center gap-1 text-[8px] font-black ${asset.up ? 'text-emerald-500' : 'text-rose-500'}`}>
              <ArrowUpRight className="w-2 h-2" />
              {asset.change}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="font-mono font-black italic text-sm tracking-tighter">₹{asset.value}</p>
          <button 
            onClick={() => toggleWatchlist(asset)} 
            className="p-2 rounded-xl active:scale-95 transition-all text-slate-300 hover:text-rose-500"
          >
            <Heart className={`w-4 h-4 ${isLiked(asset.name) ? 'fill-rose-500 text-rose-500 animate-bounce' : 'text-slate-300'}`} />
          </button>
        </div>
      </div>
    </div>
  );
});

const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// API Caching Layer
const API_CACHE_KEY = 'fincalc_api_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key: string) => {
  const cache = JSON.parse(localStorage.getItem(API_CACHE_KEY) || '{}');
  const entry = cache[key];
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.data;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  const cache = JSON.parse(localStorage.getItem(API_CACHE_KEY) || '{}');
  cache[key] = { data, timestamp: Date.now() };
  localStorage.setItem(API_CACHE_KEY, JSON.stringify(cache));
};

// --- Types ---
type PlanType = 'free' | 'pro' | 'elite';

interface Holding {
  id: string;
  name: string;
  type: 'Stock' | 'Crypto' | 'Commodity';
  qty: number;
  buyPrice: number;
  currentPrice: number;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  type: 'price' | 'market' | 'promo';
  read: boolean;
}

interface MarketNews {
  id: string;
  headline: string;
  source: string;
  time: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  category: string;
}

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  glowClass: string;
  category: string;
}

// --- Mock Data ---
const MARKET_ASSETS = [
  { name: 'Gold', value: '72,450', change: '+1.2%', up: true, icon: '🏆', category: 'Commodities' },
  { name: 'Bitcoin', value: '64,120', change: '-0.8%', up: false, icon: '₿', category: 'Crypto' },
  { name: 'USD/INR', value: '83.45', change: '+0.05%', up: true, icon: '💵', category: 'Forex' },
  { name: 'Nifty 50', value: '22,410', change: '+0.45%', up: true, icon: '📈', category: 'Stocks' },
  { name: 'Ethereum', value: '3,450', change: '-1.1%', up: false, icon: '⟠', category: 'Crypto' },
  { name: 'Sensex', value: '73,800', change: '+0.32%', up: true, icon: '📊', category: 'Stocks' },
  { name: 'Silver', value: '81,200', change: '+2.1%', up: true, icon: '🥈', category: 'Commodities' },
  { name: 'Crude Oil', value: '6,840', change: '-1.4%', up: false, icon: '🛢️', category: 'Commodities' },
];

const ALL_TOOLS: Tool[] = [
  { id: 'emi', title: 'EMI', description: 'Loan Planner', icon: <Landmark />, color: 'text-indigo-500', glowClass: 'tile-indigo', category: 'Finance' },
  { id: 'sip', title: 'Wealth', description: 'SIP Planner', icon: <TrendingUp />, color: 'text-purple-500', glowClass: 'tile-purple', category: 'Wealth' },
  { id: 'currency', title: 'Forex', description: 'Live Rates', icon: <Coins />, color: 'text-amber-500', glowClass: 'tile-amber', category: 'Wealth' },
  { id: 'fuel', title: 'Fuel', description: 'Trip Cost', icon: <FuelIcon />, color: 'text-orange-500', glowClass: 'tile-orange', category: 'Travel' },
  { id: 'fuel-compare', title: 'Savings', description: 'Mode Battle', icon: <Zap />, color: 'text-emerald-500', glowClass: 'tile-emerald', category: 'Travel' },
  { id: 'gst', title: 'GST', description: 'Tax Calc', icon: <Receipt />, color: 'text-rose-500', glowClass: 'tile-rose', category: 'Tax' },
  { id: 'discount', title: 'Sales', description: 'Deal Checker', icon: <ShoppingBag />, color: 'text-blue-500', glowClass: 'tile-blue', category: 'Shopping' },
  { id: 'tip', title: 'Split', description: 'Bill Splitting', icon: <Percent />, color: 'text-teal-500', glowClass: 'tile-teal', category: 'Social' },
  { id: 'age', title: 'Age', description: 'Pro Chrono', icon: <Calendar />, color: 'text-pink-500', glowClass: 'tile-rose', category: 'Utility' },
  { id: 'unit', title: 'Convert', description: 'Multi-Unit', icon: <Ruler />, color: 'text-violet-500', glowClass: 'tile-purple', category: 'Utility' },
  { id: 'compare', title: 'Battle', description: 'Loan Fight', icon: <Scale />, color: 'text-cyan-500', glowClass: 'tile-cyan', category: 'Finance' },
  { id: 'portfolio', title: 'Portfolio', description: 'Asset Tracker', icon: <Wallet />, color: 'text-emerald-500', glowClass: 'tile-emerald', category: 'Finance' },
  { id: 'tax-advanced', title: 'Income Tax', description: 'Regime Battle', icon: <TableProperties />, color: 'text-rose-500', glowClass: 'tile-rose', category: 'Tax' },
  { id: 'options', title: 'Options', description: 'Elite Chains', icon: <Zap />, color: 'text-purple-500', glowClass: 'tile-purple', category: 'Finance' },
];

const MOCK_NEWS: MarketNews[] = [
  { id: '1', headline: "India's GDP Growth Beats Estimates at 8.4%", source: "Bloomberg", time: "2h ago", sentiment: 'Bullish', category: 'Stocks' },
  { id: '2', headline: "Bitcoin ETF Inflows Surge to Record Highs", source: "CoinDesk", time: "4h ago", sentiment: 'Bullish', category: 'Crypto' },
  { id: '3', headline: "Oil Prices Stabilize After Mid-East Tension", source: "Reuters", time: "5h ago", sentiment: 'Neutral', category: 'Commodities' },
  { id: '4', headline: "Gold Hits New All-Time High on Weak Dollar", source: "CNBC", time: "6h ago", sentiment: 'Bullish', category: 'Commodities' },
];

// --- Components ---

interface MarketItem {
  name: string;
  value: string;
  change: string;
  up: boolean;
  icon: string;
}

const MarketTicker = React.memo(({ onWatchlistToggle, isInWatchlist }: { onWatchlistToggle: (asset: any) => void, isInWatchlist: (name: string) => boolean }) => {
  return (
    <div className="w-full overflow-hidden bg-white/5 dark:bg-black backdrop-blur-md border-y border-white/5 py-2.5 mb-6 shadow-2xl relative">
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-scroll {
          display: flex;
          width: fit-content;
          animation: ticker 40s linear infinite;
        }
        .ticker-scroll:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .ticker-scroll {
            animation: none;
            overflow-x: auto;
          }
        }
      `}</style>
      <div className="ticker-scroll flex gap-4 whitespace-nowrap px-4 will-change-transform">
        {[...MARKET_ASSETS, ...MARKET_ASSETS].map((asset, i) => (
          <div key={i} className="flex items-center gap-2 ticker-pill shadow-inner group">
            <span className="text-sm">{asset.icon}</span>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{asset.name}</span>
            <span className="text-[11px] font-mono font-black tracking-tighter">₹{asset.value}</span>
            <span className={`text-[9px] font-black flex items-center ${asset.up ? 'text-emerald-500' : 'text-rose-500'}`}>
              {asset.up ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
              {asset.change}
            </span>
            <button 
              onClick={() => onWatchlistToggle(asset)}
              className="ml-1 opacity-40 group-hover:opacity-100 transition-all focus:outline-none"
            >
              <Heart className={`w-3 h-3 ${isInWatchlist(asset.name) ? 'fill-red-500 text-red-500 opacity-100' : 'text-slate-400'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

const ToolCard = React.memo(({ tool, onClick }: { tool: Tool, onClick?: () => void }) => (
  <motion.div
    whileTap={{ scale: 0.92, rotate: -2 }}
    onClick={onClick || (() => window.location.href = `/${tool.id}.html`)}
    className={`tool-tile ${tool.glowClass} group select-none cursor-pointer will-change-transform`}
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 bg-slate-50 dark:bg-white/[0.03] transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 shadow-inner ${tool.color}`}>
      {React.cloneElement(tool.icon as React.ReactElement<any>, { className: 'w-6 h-6 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]' })}
    </div>
    <div className="text-center px-1">
      <h3 className="font-display font-black text-[10px] tracking-tight text-slate-800 dark:text-white uppercase leading-none mb-1">{tool.title}</h3>
      <p className="text-[7px] text-slate-400 font-black uppercase tracking-[0.15em] opacity-60 truncate w-full">{tool.description}</p>
    </div>
  </motion.div>
));

// --- State Management ---
interface AppState {
  isDarkMode: boolean;
  activeTab: 'home' | 'markets' | 'tools' | 'calc' | 'quick' | 'watchlist' | 'portfolio' | 'tax' | 'notifications';
  marketFilter: string;
  marketSort: 'name' | 'price' | 'change';
  calcUsageCount: number;
  showInterstitial: boolean;
  userPlan: PlanType;
  portfolio: Holding[];
  notifications: Notification[];
  showPaywall: boolean;
  showNotifications: boolean;
  aiInsight: any;
  searchQuery: string;
  marketSearchQuery: string;
  marketResults: any[];
  isSearchingMarket: boolean;
  recentTools: string[];
  watchlist: any[];
  display: string;
  operator: string | null;
  firstOperand: number | null;
  waitingForSecond: boolean;
  lastEquation: string;
  explanation: { en: string, hi: string } | null;
  isListening: boolean;
  history: { equation: string, result: string, date: string }[];
  isScientific: boolean;
}

type AppAction = 
  | { type: 'SET_TAB', payload: AppState['activeTab'] }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'SET_USER_PLAN', payload: PlanType }
  | { type: 'SET_MARKET_FILTER', payload: string }
  | { type: 'SET_MARKET_SORT', payload: AppState['marketSort'] }
  | { type: 'SET_SEARCH_QUERY', payload: string }
  | { type: 'SET_MARKET_SEARCH_QUERY', payload: string }
  | { type: 'SET_MARKET_RESULTS', payload: any[] }
  | { type: 'SET_AI_INSIGHT', payload: any }
  | { type: 'SET_SEARCHING_MARKET', payload: boolean }
  | { type: 'SET_WATCHLIST', payload: any[] }
  | { type: 'SET_PORTFOLIO', payload: Holding[] }
  | { type: 'SET_NOTIFICATIONS', payload: Notification[] }
  | { type: 'SET_SHOW_PAYWALL', payload: boolean }
  | { type: 'SET_SHOW_NOTIFICATIONS', payload: boolean }
  | { type: 'SET_CALC_STATE', payload: Partial<AppState> }
  | { type: 'SET_RECENT_TOOLS', payload: string[] }
  | { type: 'INC_CALC_USAGE' }
  | { type: 'SET_INTERSTITIAL', payload: boolean };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TAB': return { ...state, activeTab: action.payload };
    case 'TOGGLE_DARK_MODE': return { ...state, isDarkMode: !state.isDarkMode };
    case 'SET_USER_PLAN': return { ...state, userPlan: action.payload };
    case 'SET_MARKET_FILTER': return { ...state, marketFilter: action.payload };
    case 'SET_MARKET_SORT': return { ...state, marketSort: action.payload };
    case 'SET_SEARCH_QUERY': return { ...state, searchQuery: action.payload };
    case 'SET_MARKET_SEARCH_QUERY': return { ...state, marketSearchQuery: action.payload };
    case 'SET_MARKET_RESULTS': return { ...state, marketResults: action.payload };
    case 'SET_AI_INSIGHT': return { ...state, aiInsight: action.payload };
    case 'SET_SEARCHING_MARKET': return { ...state, isSearchingMarket: action.payload };
    case 'SET_WATCHLIST': return { ...state, watchlist: action.payload };
    case 'SET_PORTFOLIO': return { ...state, portfolio: action.payload };
    case 'SET_NOTIFICATIONS': return { ...state, notifications: action.payload };
    case 'SET_SHOW_PAYWALL': return { ...state, showPaywall: action.payload };
    case 'SET_SHOW_NOTIFICATIONS': return { ...state, showNotifications: action.payload };
    case 'SET_CALC_STATE': return { ...state, ...action.payload };
    case 'SET_RECENT_TOOLS': return { ...state, recentTools: action.payload };
    case 'INC_CALC_USAGE': 
      const newCount = state.calcUsageCount + 1;
      return { 
        ...state, 
        calcUsageCount: newCount,
        showInterstitial: state.userPlan === 'free' && newCount % 3 === 0 
      };
    case 'SET_INTERSTITIAL': return { ...state, showInterstitial: action.payload };
    default: return state;
  }
}

// --- Skeleton Loaders ---
const MarketItemSkeleton = () => (
  <div className="p-5 rounded-[2rem] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-4">
      <Skeleton className="w-14 h-14" />
      <div className="space-y-2">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-16 h-2" />
      </div>
    </div>
    <div className="text-right space-y-2">
      <Skeleton className="w-20 h-6 ml-auto" />
      <Skeleton className="w-12 h-3 ml-auto" />
    </div>
  </div>
);

export default function App() {
  const initialState: AppState = {
    isDarkMode: typeof window !== 'undefined' ? (localStorage.getItem('theme') === 'dark' || window.matchMedia('(prefers-color-scheme: dark)').matches) : true,
    activeTab: 'home',
    marketFilter: 'All',
    marketSort: 'name',
    calcUsageCount: 0,
    showInterstitial: false,
    userPlan: (typeof window !== 'undefined' ? localStorage.getItem('fincalc_plan') : 'free') as PlanType || 'free',
    portfolio: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('fincalc_portfolio') || '[]') : [],
    notifications: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('fincalc_notifications') || '[{"id":"1","title":"Welcome to Pro","body":"Upgrade to Elite for advanced options chain!","time":"Now","type":"promo","read":false}]') : [],
    showPaywall: false,
    showNotifications: false,
    aiInsight: null,
    searchQuery: '',
    marketSearchQuery: '',
    marketResults: [],
    isSearchingMarket: false,
    recentTools: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('recent_tools') || '[]') : [],
    watchlist: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user_watchlist') || '[]') : [],
    display: '0',
    operator: null,
    firstOperand: null,
    waitingForSecond: false,
    lastEquation: '',
    explanation: null,
    isListening: false,
    history: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('calc_history') || '[]') : [],
    isScientific: false
  };

  const [state, dispatch] = useReducer(appReducer, initialState);
  const debouncedSearchQuery = useDebounce(state.searchQuery, 300);

  const unreadCount = useMemo(() => state.notifications.filter(n => !n.read).length, [state.notifications]);

  // Persistence Effects
  useEffect(() => localStorage.setItem('theme', state.isDarkMode ? 'dark' : 'light'), [state.isDarkMode]);
  useEffect(() => localStorage.setItem('fincalc_plan', state.userPlan), [state.userPlan]);
  useEffect(() => localStorage.setItem('fincalc_portfolio', JSON.stringify(state.portfolio)), [state.portfolio]);
  useEffect(() => localStorage.setItem('fincalc_notifications', JSON.stringify(state.notifications)), [state.notifications]);
  useEffect(() => localStorage.setItem('user_watchlist', JSON.stringify(state.watchlist)), [state.watchlist]);
  useEffect(() => localStorage.setItem('calc_history', JSON.stringify(state.history)), [state.history]);
  useEffect(() => {
    if (state.isDarkMode) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  }, [state.isDarkMode]);

  const toggleWatchlist = useCallback((asset: any) => {
    const exists = state.watchlist.find(item => item.name === asset.name);
    if (exists) {
      dispatch({ type: 'SET_WATCHLIST', payload: state.watchlist.filter(item => item.name !== asset.name) });
    } else {
      dispatch({ type: 'SET_WATCHLIST', payload: [...state.watchlist, asset] });
    }
  }, [state.watchlist]);

  const isInWatchlist = useCallback((name: string) => {
    return state.watchlist.some(item => item.name === name);
  }, [state.watchlist]);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const handleMarketSearch = useCallback(async () => {
    if (!state.marketSearchQuery.trim()) return;
    
    // Check Cache
    const cached = getCachedData(`market_search_${state.marketSearchQuery}`);
    if (cached) {
      dispatch({ type: 'SET_MARKET_RESULTS', payload: cached.data });
      dispatch({ type: 'SET_AI_INSIGHT', payload: cached.insight });
      return;
    }

    dispatch({ type: 'SET_SEARCHING_MARKET', payload: true });
    dispatch({ type: 'SET_AI_INSIGHT', payload: null });
    
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    
    try {
      const prompt = `Search for current live values of "${state.marketSearchQuery}". 
      Return only a JSON object with:
      "data": array of objects with fields: name, value (in INR if possible, else original with symbol), change (percentage string like "+1.2%"), up (boolean), icon (a single emoji representing the asset). 
      "insight": a single object with sentiment (Bullish/Bearish/Neutral), confidence (string percentage), factors (array of 3 strings), risk (Low/Medium/High), smartMoney (string indicating institutional activity).`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const parsed = JSON.parse(result.text || "{}");
      dispatch({ type: 'SET_MARKET_RESULTS', payload: parsed.data || [] });
      dispatch({ type: 'SET_AI_INSIGHT', payload: parsed.insight || null });
      
      setCachedData(`market_search_${state.marketSearchQuery}`, parsed);
    } catch (error) {
      if ((error as any).name === 'AbortError') return;
      console.error("Market search failed:", error);
    } finally {
      dispatch({ type: 'SET_SEARCHING_MARKET', payload: false });
    }
  }, [state.marketSearchQuery]);

  const addToRecent = useCallback((id: string) => {
    const updated = [id, ...state.recentTools.filter(t => t !== id)].slice(0, 4);
    dispatch({ type: 'SET_RECENT_TOOLS', payload: updated });
    localStorage.setItem('recent_tools', JSON.stringify(updated));
    window.location.href = `/${id}.html`;
  }, [state.recentTools]);

  // Smart Parser & Explainer Logic
  const smartParse = (text: string) => {
    let query = text.toLowerCase()
      .replace(/plus|add|plus|जोड़ें/g, '+')
      .replace(/minus|subtract|घटाएं/g, '-')
      .replace(/multiply|times|guna|गुणा/g, '*')
      .replace(/divide|by|bhag|भाग/g, '/')
      .replace(/percent|percentage|pratishat|प्रतिशत/g, '%')
      .replace(/ka|of/g, '*')
      .replace(/thousand|hazar/g, '000')
      .replace(/lakh/g, '00000')
      .replace(/ crore/g, '0000000')
      .replace(/\s/g, '');
    
    // Convert words to digits for common Indian terms
    const numbers: Record<string, string> = {
      'ek': '1', 'do': '2', 'teen': '3', 'char': '4', 'paanch': '5',
      'che': '6', 'saat': '7', 'aath': '8', 'nau': '9', 'das': '10'
    };
    Object.entries(numbers).forEach(([word, num]) => {
      query = query.replace(new RegExp(word, 'g'), num);
    });

    return query;
  };

  const generateExplanation = (equation: string, result: string) => {
    // Simple logic for explanation
    if (equation.includes('%')) {
      const parts = equation.split(/[*%]/);
      return {
        en: `Finding ${parts[1]}% of ${parts[0]}. Multiply ${parts[0]} by ${parts[1]} and divide by 100.`,
        hi: `${parts[0]} का ${parts[1]}% निकालने के लिए ${parts[0]} को ${parts[1]} से गुणा करके 100 से भाग दिया गया।`
      };
    }
    return {
      en: `The result of ${equation.replace(/\*/g, '×').replace(/\//g, '÷')} is ${result}.`,
      hi: `${equation.replace(/\*/g, '×').replace(/\//g, '÷')} का परिणाम ${result} है।`
    };
  };

  // Voice Recognition
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) return alert("Speech recognition not supported");
    
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'hi-IN'; // Multilingual default

    recognition.onstart = () => dispatch({ type: 'SET_CALC_STATE', payload: { isListening: true } });
    recognition.onend = () => dispatch({ type: 'SET_CALC_STATE', payload: { isListening: false } });
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const parsed = smartParse(transcript);
      try {
        // Safe eval for basic math only
        const cleanParsed = parsed.replace(/[^0-9+\-*/%.]/g, '');
        // Handle percentage calculation x*y% -> (x*y)/100
        let finalExpr = cleanParsed;
        if (cleanParsed.includes('%')) {
          finalExpr = cleanParsed.replace(/(\d+)\*(\d+)%/, '($1*$2)/100');
        }
        
        const res = eval(finalExpr);
        const resString = res.toString();
        dispatch({ type: 'SET_CALC_STATE', payload: { 
          display: resString,
          lastEquation: cleanParsed,
          explanation: generateExplanation(cleanParsed, resString),
          history: [{ equation: cleanParsed, result: resString, date: new Date().toLocaleTimeString() }, ...state.history].slice(0, 20)
        }});
      } catch (e) {
        dispatch({ type: 'SET_CALC_STATE', payload: { display: "Error" } });
      }
    };
    recognition.start();
  };

  const handleSci = (func: string) => {
    const val = parseFloat(state.display);
    let result = 0;
    switch(func) {
      case 'sin': result = Math.sin(val); break;
      case 'cos': result = Math.cos(val); break;
      case 'tan': result = Math.tan(val); break;
      case 'log': result = Math.log10(val); break;
      default: result = val;
    }
    dispatch({ type: 'SET_CALC_STATE', payload: { display: result.toString(), waitingForSecond: true } });
  };

  const filteredTools = useMemo(() => {
    if (!debouncedSearchQuery) return ALL_TOOLS;
    const query = debouncedSearchQuery.toLowerCase();
    return ALL_TOOLS.filter(t => 
      t.title.toLowerCase().includes(query) || 
      t.category.toLowerCase().includes(query)
    );
  }, [debouncedSearchQuery]);

  const filteredAssets = useMemo(() => {
    let assets = [...MARKET_ASSETS];
    if (state.marketFilter !== 'All') {
      assets = assets.filter(a => (a as any).category === state.marketFilter);
    }
    assets.sort((a, b) => {
      if (state.marketSort === 'name') return a.name.localeCompare(b.name);
      const valA = parseFloat(a.value.replace(/,/g, ''));
      const valB = parseFloat(b.value.replace(/,/g, ''));
      if (state.marketSort === 'price') return valB - valA;
      if (state.marketSort === 'change') return parseFloat(b.change) - parseFloat(a.change);
      return 0;
    });
    return assets;
  }, [state.marketFilter, state.marketSort]);

  const toolsByCategory = useMemo(() => {
    const cats: Record<string, Tool[]> = {};
    ALL_TOOLS.forEach(t => {
      if (!cats[t.category]) cats[t.category] = [];
      cats[t.category].push(t);
    });
    return cats;
  }, []);

  const recentToolObjects = useMemo(() => {
    return state.recentTools.map(id => ALL_TOOLS.find(t => t.id === id)).filter(Boolean) as Tool[];
  }, [state.recentTools]);

  // Basic Calc Logic
  const handleNum = useCallback((n: string) => {
    if (state.waitingForSecond) {
      dispatch({ type: 'SET_CALC_STATE', payload: { display: n, waitingForSecond: false } });
    } else {
      dispatch({ type: 'SET_CALC_STATE', payload: { display: state.display === '0' ? n : state.display + n } });
    }
  }, [state.waitingForSecond, state.display]);

  const handleOp = useCallback((op: string) => {
    const val = parseFloat(state.display);
    if (state.firstOperand === null) {
      dispatch({ type: 'SET_CALC_STATE', payload: { firstOperand: val, waitingForSecond: true, operator: op } });
    } else if (state.operator) {
      let result = 0;
      switch(state.operator) {
        case '+': result = state.firstOperand + val; break;
        case '-': result = state.firstOperand - val; break;
        case '×': result = state.firstOperand * val; break;
        case '÷': result = state.firstOperand / val; break;
        case '%': result = (state.firstOperand / 100) * val; break;
        default: result = val;
      }
      dispatch({ type: 'SET_CALC_STATE', payload: { display: result.toString(), firstOperand: result, waitingForSecond: true, operator: op } });
    }
  }, [state.display, state.firstOperand, state.operator]);

  const calculate = useCallback(() => {
    if (!state.operator || state.firstOperand === null) return;
    const val = parseFloat(state.display);
    let result = 0;
    let eq = `${state.firstOperand}${state.operator}${val}`;
    
    switch(state.operator) {
      case '+': result = state.firstOperand + val; break;
      case '-': result = state.firstOperand - val; break;
      case '×': result = state.firstOperand * val; break;
      case '÷': result = state.firstOperand / val; break;
      case '%': result = (state.firstOperand / 100) * val; break;
      default: result = val;
    }
    
    const resString = result.toString();
    const expl = generateExplanation(eq.replace('×', '*').replace('÷', '/'), resString);
    const newHistory = [{ equation: eq, result: resString, date: new Date().toLocaleTimeString() }, ...state.history].slice(0, 20);
    
    dispatch({ type: 'SET_CALC_STATE', payload: { 
      display: resString, 
      lastEquation: eq, 
      explanation: expl, 
      history: newHistory,
      firstOperand: null,
      operator: null,
      waitingForSecond: false
    }});

    dispatch({ type: 'INC_CALC_USAGE' });
  }, [state.operator, state.firstOperand, state.display, state.history]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(state.display);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-[#060606] font-sans selection:bg-blue-500 selection:text-white">
      {/* Background Glows */}
      <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-blue-600/10 blur-[150px] -z-10 rounded-full" />
      <div className="fixed bottom-0 left-0 w-[50%] h-[50%] bg-purple-600/10 blur-[150px] -z-10 rounded-full" />

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-xl tracking-tight leading-none text-slate-800 dark:text-white">Fincalc utility</h1>
              {state.userPlan !== 'free' && (
                <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest flex items-center gap-1 ${state.userPlan === 'elite' ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]' : 'bg-amber-400 text-zinc-900 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`}>
                  {state.userPlan === 'elite' ? <Crown className="w-2 h-2" /> : <ShieldCheck className="w-2 h-2" />}
                  {state.userPlan}
                </div>
              )}
            </div>
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-0.5">by NC Creation & Vikas Sharma</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => dispatch({ type: 'SET_SHOW_NOTIFICATIONS', payload: true })}
            className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 flex items-center justify-center shadow-sm active:scale-90 transition-all relative"
          >
            <Bell className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute top-3 right-3 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900">
                {unreadCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
            className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 flex items-center justify-center shadow-sm active:scale-90 transition-all font-bold"
          >
            {state.isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>
        </div>
      </header>

      {/* Market Ticker */}
      <MarketTicker onWatchlistToggle={toggleWatchlist} isInWatchlist={isInWatchlist} />

      {/* Main View Area */}
      <main className="flex-1 overflow-y-auto pb-4 px-4 no-scrollbar">
        <AnimatePresence mode="wait">
          {state.activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* Premium Dashboard Header */}
              <section className="relative p-6 rounded-[2rem] bg-gradient-to-br from-zinc-900 to-black text-white shadow-2xl overflow-hidden border border-white/10 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/30 blur-[70px] rounded-full -mr-10 -mt-10 group-hover:bg-blue-500/40 transition-all" />
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-1 opacity-80">Global Market Insight</p>
                  <div className="flex items-end gap-2 mb-6">
                    <h2 className="text-4xl font-display font-black tracking-tighter leading-tight italic">Search any market</h2>
                    <div className="flex items-center text-emerald-400 text-[10px] font-black mb-2 gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      AI Powered
                    </div>
                  </div>
                  <div className="relative mb-6">
                    <button 
                      onClick={handleMarketSearch}
                      disabled={state.isSearchingMarket}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
                    >
                      {state.isSearchingMarket ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                    <input 
                      type="text" 
                      placeholder="Search Stocks, Gold, Crypto..." 
                      value={state.marketSearchQuery}
                      onChange={(e) => dispatch({ type: 'SET_MARKET_SEARCH_QUERY', payload: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleMarketSearch()}
                      className="w-full h-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl pl-6 pr-12 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-zinc-600"
                    />
                  </div>

                  {/* Market Search Results */}
                  <AnimatePresence>
                    {(state.marketResults.length > 0 || state.aiInsight || state.isSearchingMarket) && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-8 space-y-4"
                      >
                        {state.isSearchingMarket ? (
                          [1, 2].map(i => <MarketItemSkeleton key={i} />)
                        ) : state.marketResults.length > 5 ? (
                          <div style={{ height: 400 }}>
                            <FixedSizeList
                              height={400}
                              itemCount={state.marketResults.length}
                              itemSize={80}
                              width="100%"
                              itemData={{ results: state.marketResults, toggleWatchlist, isLiked: isInWatchlist }}
                            >
                              {MarketRow}
                            </FixedSizeList>
                          </div>
                        ) : (
                          state.marketResults.map((res, i) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl group hover:bg-white/15 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg">{res.icon}</div>
                              <span className="text-xs font-black uppercase tracking-tight">{res.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm font-black font-mono">₹{res.value}</p>
                                <p className={`text-[9px] font-black ${res.up ? 'text-emerald-400' : 'text-rose-400'} flex items-center justify-end gap-1`}>
                                  {res.up ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                                  {res.change}
                                </p>
                              </div>
                              <button onClick={() => toggleWatchlist(res)} className="p-1">
                                <Heart className={`w-5 h-5 ${isInWatchlist(res.name) ? 'fill-red-500 text-red-500' : 'text-white/40'}`} />
                              </button>
                            </div>
                          </div>
                          ))
                        )}

                        {/* AI Insight Card */}
                        {state.aiInsight && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-5 rounded-[2rem] bg-gradient-to-br from-blue-600/20 to-teal-400/10 border border-blue-500/30 backdrop-blur-3xl"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <BrainCircuit className="w-5 h-5 text-blue-400" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-300">AI Market Insight</h4>
                              </div>
                              <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${state.aiInsight.sentiment === 'Bullish' ? 'bg-emerald-500/20 text-emerald-400' : state.aiInsight.sentiment === 'Bearish' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                {state.aiInsight.sentiment} • {state.aiInsight.confidence}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="space-y-1">
                                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Risk Level</p>
                                <p className={`text-xs font-black ${state.aiInsight.risk === 'High' ? 'text-rose-400' : state.aiInsight.risk === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}`}>{state.aiInsight.risk}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Institution Activity</p>
                                <p className="text-xs font-black text-blue-400">{state.aiInsight.smartMoney}</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Key Drivers</p>
                              <div className="flex flex-wrap gap-2">
                                {state.aiInsight.factors.map((f: string, i: number) => (
                                  <span key={i} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-white/80">{f}</span>
                                ))}
                              </div>
                            </div>
                            {state.userPlan === 'free' && (
                              <button onClick={() => dispatch({ type: 'SET_SHOW_PAYWALL', payload: true })} className="w-full mt-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-xl text-[8px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-600/30 transition-all">
                                Get Deeper Elite Insights
                              </button>
                            )}
                          </motion.div>
                        )}

                        <button 
                          onClick={() => { dispatch({ type: 'SET_MARKET_RESULTS', payload: [] }); dispatch({ type: 'SET_AI_INSIGHT', payload: null }); }}
                          className="w-full py-1 text-[8px] font-black uppercase text-white/40 hover:text-white/60"
                        >
                          Clear Analysis
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Market News Section */}
                  <section className="space-y-4 mb-8">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <Newspaper className="w-4 h-4 text-emerald-500" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 leading-none">Market News</h2>
                      </div>
                      <button className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">View All</button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                      {MOCK_NEWS.map(news => (
                        <div key={news.id} className="min-w-[280px] p-5 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-between group">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{news.category} • {news.time}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${news.sentiment === 'Bullish' ? 'bg-emerald-500/20 text-emerald-400' : news.sentiment === 'Bearish' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-500/20 text-slate-400'}`}>{news.sentiment}</span>
                            </div>
                            <h3 className="text-xs font-bold leading-relaxed line-clamp-2 group-hover:text-blue-400 transition-colors">{news.headline}</h3>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-[8px] font-black uppercase text-white/20">{news.source}</span>
                            <ArrowRight className="w-3 h-3 text-white/20 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                  <div className="flex gap-2.5">
                    <button onClick={() => dispatch({ type: 'SET_TAB', payload: 'tools' })} className="flex-1 py-3 bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/30 active:scale-95 transition-all">All Modules</button>
                    <button onClick={() => dispatch({ type: 'SET_TAB', payload: 'calc' })} className="flex-1 py-3 bg-white/5 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 active:scale-95 transition-all">Basic Calc</button>
                  </div>
                </div>

                {/* Free Tier Ad Banner */}
                {state.userPlan === 'free' && (
                  <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000" />
                    <div className="flex items-center gap-3">
                      <div className="px-1.5 py-0.5 rounded bg-white/10 text-[6px] font-black uppercase text-white/40">Sponsored</div>
                      <p className="text-[10px] font-bold text-white/60 italic">Ready to go Pro? Get 1 month Elite free!</p>
                    </div>
                    <button onClick={() => dispatch({ type: 'SET_SHOW_PAYWALL', payload: true })} className="text-[10px] font-black text-blue-400 uppercase tracking-widest underline decoration-blue-500/30">Learn More</button>
                  </div>
                )}
              </section>

              {/* Command Center Grid */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 leading-none">Featured</h2>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {ALL_TOOLS.slice(0, 4).map(tool => (
                    <ToolCard key={tool.id} tool={tool} onClick={() => addToRecent(tool.id)} />
                  ))}
                </div>
              </section>

              {/* Quick Jump */}
              <section className="space-y-4 pb-4">
                <div className="flex items-center gap-2 px-2">
                  <RotateCcw className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 leading-none">Others</h2>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {ALL_TOOLS.slice(4).map(tool => (
                    <ToolCard key={tool.id} tool={tool} onClick={() => addToRecent(tool.id)} />
                  ))}
                </div>
              </section>

              {/* Branding & Disclaimer */}
              <section className="mt-12 mb-8 pt-8 border-t border-slate-200 dark:border-white/5 pb-20">
                <div className="space-y-4 px-4 py-6 rounded-[2rem] bg-slate-100/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 backdrop-blur-xl">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white mb-2">Important Risk Disclosure</h3>
                    <p className="text-[9px] font-bold leading-relaxed text-slate-500 dark:text-slate-400">
                      Trading and investing in Stock Markets, Crypto Markets, and Financial Instruments involve significant risk of loss and is not suitable for every investor. The valuation of financial instruments may fluctuate, and, as a result, clients may lose more than their original investment. 
                    </p>
                    <p className="text-[9px] font-bold leading-relaxed text-slate-500 dark:text-slate-400 mt-2">
                       The volatile nature of crypto assets makes them high-risk investments. Users are advised to seek professional financial advice before making any investment decisions. This utility tool is for informational and educational purposes only.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-white/5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600">
                      © NC Creation and technical labs copyright right all right reserved
                    </p>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {state.activeTab === 'tools' && (
            <motion.div 
              key="tools"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="px-2">
                <h2 className="text-3xl font-display font-black tracking-tighter italic">Explorer</h2>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500 mt-1">Smart logic grouping</p>
              </div>

              <div className="space-y-6">
                {Object.entries(toolsByCategory).map(([category, tools]: [string, Tool[]]) => (
                  <section key={category} className="space-y-3">
                    <div className="flex items-center gap-3 px-2">
                      <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 whitespace-nowrap">{category}</h3>
                      <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/5" />
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {tools.map(tool => (
                        <div key={tool.id} className="relative group">
                          {tool.id === 'options' && state.userPlan !== 'elite' && (
                            <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px] rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer" onClick={() => dispatch({ type: 'SET_SHOW_PAYWALL', payload: true })}>
                              <Lock className="w-6 h-6 text-purple-400" />
                            </div>
                          )}
                          <ToolCard tool={tool} onClick={() => {
                            if (tool.id === 'options' && state.userPlan !== 'elite') {
                              dispatch({ type: 'SET_SHOW_PAYWALL', payload: true });
                              return;
                            }
                            if (tool.id === 'portfolio') {
                               dispatch({ type: 'SET_TAB', payload: 'portfolio' });
                               return;
                            }
                            if (tool.id === 'tax-advanced') {
                               dispatch({ type: 'SET_TAB', payload: 'tax' });
                               return;
                            }
                            addToRecent(tool.id);
                          }} />
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </motion.div>
          )}

          {state.activeTab === 'calc' && (
            <motion.div 
              key="calc"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4 max-w-md mx-auto"
            >
              <div className="px-2 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-display font-black tracking-tighter">Smart Calc</h2>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500 mt-1">Multilingual Assistant</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => dispatch({ type: 'SET_CALC_STATE', payload: { isScientific: !state.isScientific } })} className={`p-2 rounded-xl border transition-all ${state.isScientific ? 'bg-blue-600 text-white border-blue-500' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5'}`}>
                    <BrainCircuit className="w-4 h-4" />
                  </button>
                  <button onClick={() => dispatch({ type: 'SET_CALC_STATE', payload: { history: [] } })} className="p-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </button>
                </div>
              </div>

              {/* Display Area */}
              <div className="p-6 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-10 -mt-10" />
                <div className="relative z-10">
                  <div className="text-right text-sm font-mono font-bold text-slate-400 h-6 mb-1 opacity-60">
                    {state.firstOperand !== null ? `${state.firstOperand} ${state.operator}` : state.lastEquation || 'Equation'}
                  </div>
                  <motion.div 
                    key={state.display}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={copyToClipboard}
                    className="text-right text-6xl font-display font-black tracking-tighter truncate text-slate-900 dark:text-white mb-2 cursor-pointer active:opacity-50"
                  >
                    {state.display}
                  </motion.div>
                </div>

                {/* Voice Status & Header Actions */}
                <div className="absolute top-4 left-6 flex items-center gap-3">
                  <button 
                    onClick={startListening}
                    className={`p-2.5 rounded-xl border transition-all ${state.isListening ? 'bg-blue-500 border-blue-400 animate-pulse text-white' : 'bg-white/10 border-white/20 dark:border-white/5 text-blue-500 hover:bg-white/20'}`}
                  >
                    {state.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => dispatch({ type: 'SET_CALC_STATE', payload: { isScientific: !state.isScientific } })} 
                    className={`p-2.5 rounded-xl border transition-all uppercase text-[8px] font-black tracking-widest ${state.isScientific ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/10 border-white/20 text-slate-500'}`}
                  >
                    Sci
                  </button>
                </div>

                <AnimatePresence>
                  {state.isListening && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute bottom-4 left-6 flex items-center gap-2"
                    >
                      <div className="flex gap-1 items-center h-4">
                        <div className="waveform-bar bar-1" />
                        <div className="waveform-bar bar-2" />
                        <div className="waveform-bar bar-3" />
                        <div className="waveform-bar bar-4" />
                        <div className="waveform-bar bar-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 animate-pulse">Listening...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Calculation Explainer */}
              <AnimatePresence>
                {state.explanation && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 rounded-3xl bg-blue-500/5 border border-blue-500/10 backdrop-blur-md">
                      <div className="flex items-center gap-2 mb-3">
                        <Volume2 className="w-4 h-4 text-blue-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500">Analysis Breakdown</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <span className="text-[10px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded leading-none">EN</span>
                          <p className="text-xs font-bold leading-relaxed">{state.explanation.en}</p>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-[10px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded leading-none">HI</span>
                          <p className="text-xs font-bold leading-relaxed">{state.explanation.hi}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Grid Layout - Unified 4-column as requested */}
              <div className="grid grid-cols-4 gap-y-[10px] gap-x-2 p-[15px] bg-white/40 dark:bg-white/5 rounded-[2rem] shadow-xl backdrop-blur-md">
                {/* Scientific Functions (Conditional) */}
                <AnimatePresence>
                  {state.isScientific && (
                    <motion.div 
                      key="sci-rows"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="col-span-4 grid grid-cols-4 gap-y-[10px] gap-x-2 overflow-hidden"
                    >
                      {['sin', 'cos', 'tan', 'log'].map(op => (
                        <button 
                          key={op} 
                          onClick={() => handleSci(op)}
                          className="calc-button btn-number text-[10px] uppercase font-black text-blue-500"
                        >
                          {op}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Row 1 */}
                <button onClick={() => dispatch({ type: 'SET_CALC_STATE', payload: { display: '0', firstOperand: null, operator: null, explanation: null } })} className="calc-button btn-action">AC</button>
                <button onClick={() => dispatch({ type: 'SET_CALC_STATE', payload: { display: state.display.length > 1 ? state.display.slice(0, -1) : '0' } })} className="calc-button btn-action text-blue-500">
                  <Delete className="w-5 h-5" />
                </button>
                <button onClick={() => handleOp('%')} className="calc-button btn-operator">%</button>
                <button onClick={() => handleOp('÷')} className={`calc-button btn-operator ${state.operator === '÷' ? 'brightness-125' : ''}`}>÷</button>

                {/* Row 2 */}
                <button onClick={() => handleNum('7')} className="calc-button btn-number">7</button>
                <button onClick={() => handleNum('8')} className="calc-button btn-number">8</button>
                <button onClick={() => handleNum('9')} className="calc-button btn-number">9</button>
                <button onClick={() => handleOp('×')} className={`calc-button btn-operator ${state.operator === '×' ? 'brightness-125' : ''}`}>×</button>

                {/* Row 3 */}
                <button onClick={() => handleNum('4')} className="calc-button btn-number">4</button>
                <button onClick={() => handleNum('5')} className="calc-button btn-number">5</button>
                <button onClick={() => handleNum('6')} className="calc-button btn-number">6</button>
                <button onClick={() => handleOp('-')} className={`calc-button btn-operator ${state.operator === '-' ? 'brightness-125' : ''}`}>-</button>

                {/* Row 4 */}
                <button onClick={() => handleNum('1')} className="calc-button btn-number">1</button>
                <button onClick={() => handleNum('2')} className="calc-button btn-number">2</button>
                <button onClick={() => handleNum('3')} className="calc-button btn-number">3</button>
                <button onClick={() => handleOp('+')} className={`calc-button btn-operator ${state.operator === '+' ? 'brightness-125' : ''}`}>+</button>

                {/* Row 5 */}
                <button onClick={() => handleNum('0')} className="calc-button btn-number col-span-2 aspect-auto h-16 w-full">0</button>
                <button onClick={() => handleNum('.')} className="calc-button btn-number">.</button>
                <button onClick={calculate} className="calc-button btn-equals">=</button>
              </div>


              {/* History Preview */}
              <div className="px-2 space-y-3 pb-32">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">History Log</h3>
                  <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest">See All</button>
                </div>
                <div className="space-y-2">
                  {state.history.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-3">
                        <History className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-bold text-slate-400 font-mono">{item.equation}</span>
                      </div>
                      <span className="text-sm font-black italic">₹{item.result}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {state.activeTab === 'markets' && (
            <motion.div 
              key="markets"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6 h-full flex flex-col"
            >
              <div className="px-2">
                <h2 className="text-3xl font-display font-black tracking-tighter italic">Global Globe</h2>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500 mt-1">Live Asset Index</p>
              </div>

              {/* Market Filters & Sort */}
              <div className="space-y-4">
                <div className="flex gap-2 overflow-x-auto no-scrollbar px-1">
                  {['All', 'Stocks', 'Crypto', 'Forex', 'Commodities'].map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => dispatch({ type: 'SET_MARKET_FILTER', payload: cat })}
                      className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${state.marketFilter === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 border border-white/10 text-white/40'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[7px] font-black uppercase text-white/20 whitespace-nowrap">Sort by:</span>
                  {(['name', 'price', 'change'] as const).map(s => (
                    <button 
                      key={s} 
                      onClick={() => dispatch({ type: 'SET_MARKET_SORT', payload: s })}
                      className={`px-3 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest transition-all ${state.marketSort === s ? 'text-blue-400 bg-blue-500/10' : 'text-white/40 hover:text-white/60'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 min-h-[400px]">
                <FixedSizeList
                  height={500}
                  itemCount={filteredAssets.length}
                  itemSize={100}
                  width="100%"
                  className="no-scrollbar"
                >
                  {({ index, style }) => {
                    const asset = filteredAssets[index];
                    return (
                      <div style={style} className="px-1 py-1.5">
                        <div className="p-5 h-full rounded-[2rem] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 flex items-center justify-between shadow-sm group hover:scale-[1.01] transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-2xl shadow-inner group-hover:rotate-6 transition-all">
                              {asset.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-sm tracking-tight">{asset.name}</h4>
                                <button onClick={() => toggleWatchlist(asset)}>
                                  <Heart className={`w-3 h-3 ${isInWatchlist(asset.name) ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} />
                                </button>
                              </div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Data</p>
                            </div>
                          </div>
                          
                          <div className="flex-1 px-4 flex justify-center hidden sm:flex">
                            <svg width="60" height="24" viewBox="0 0 60 24" fill="none" className="opacity-40">
                              <path d={asset.up ? "M0 20L10 18L20 22L30 15L40 10L50 12L60 0" : "M0 0L10 5L20 2L30 15L40 12L50 20L60 24"} 
                                    stroke={asset.up ? "#10b981" : "#f43f5e"} 
                                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>

                          <div className="text-right">
                            <p className="font-mono font-black text-xl tracking-tighter italic">₹{asset.value}</p>
                            <div className={`flex items-center justify-end gap-1 text-[10px] font-black ${asset.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {asset.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {asset.change}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                </FixedSizeList>
              </div>
            </motion.div>
          )}

          {state.activeTab === 'watchlist' && (
            <motion.div 
              key="watchlist"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="px-2 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-display font-black tracking-tighter italic">My Watchlist</h2>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500 mt-1">Saved market assets</p>
                </div>
                {state.userPlan === 'free' && state.watchlist.length >= 3 && (
                  <button onClick={() => dispatch({ type: 'SET_SHOW_PAYWALL', payload: true })} className="px-3 py-1 bg-amber-400 text-zinc-900 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg shadow-amber-400/20">Upgrade for more</button>
                )}
              </div>

              {state.watchlist.length > 0 ? (
                <div style={{ height: 500 }}>
                  <FixedSizeList
                    height={500}
                    itemCount={state.watchlist.length}
                    itemSize={120}
                    width="100%"
                  >
                    {({ index, style }) => {
                      const asset = state.watchlist[index];
                      return (
                        <div style={style} className="px-1 py-1.5">
                          <div className="p-5 h-full rounded-[2rem] bg-gradient-to-br from-white to-slate-50 dark:from-zinc-900 dark:to-black border border-slate-200 dark:border-white/5 flex items-center justify-between shadow-xl">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center text-2xl shadow-inner italic">
                                {asset.icon}
                              </div>
                              <div>
                                <h4 className="font-black text-base tracking-tight">{asset.name}</h4>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Tracking</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-mono font-black text-xl tracking-tighter text-blue-600 dark:text-blue-400">₹{asset.value}</p>
                                <div className={`flex items-center justify-end gap-1 text-[10px] font-black ${asset.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {asset.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                  {asset.change}
                                </div>
                              </div>
                              <button onClick={() => toggleWatchlist(asset)} className="p-2 rounded-xl bg-red-500/10 text-red-500">
                                <Heart className="w-5 h-5 fill-current" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  </FixedSizeList>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center px-8 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3rem]">
                  <div className="w-20 h-20 rounded-full bg-red-500/5 flex items-center justify-center mb-6">
                    <Heart className="w-10 h-10 text-slate-200 dark:text-white/10" />
                  </div>
                  <h3 className="font-display font-black text-xl mb-2 italic">Watchlist is Empty</h3>
                  <p className="text-xs text-slate-400 font-bold leading-relaxed">Search for stocks or crypto and click the heart icon to start tracking your favorites here.</p>
                  <button 
                    onClick={() => dispatch({ type: 'SET_TAB', payload: 'home' })}
                    className="mt-8 px-8 py-3 bg-slate-900 dark:bg-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Go Search
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {state.activeTab === 'portfolio' && (
            <motion.div 
              key="portfolio"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="px-2 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-display font-black tracking-tighter italic">Portfolio</h2>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 mt-1">Asset Performance</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_SHOW_PAYWALL', payload: true })} className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              {/* Portfolio Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-5 rounded-[2rem] bg-zinc-900 border border-white/10 text-white">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Total Value</p>
                  <p className="text-2xl font-mono font-black italic">₹12.45L</p>
                  <p className="text-[9px] font-black text-emerald-400 mt-1">+12.4% Overall</p>
                </div>
                <div className="p-5 rounded-[2rem] bg-white border border-slate-200 dark:bg-zinc-900 dark:border-white/10">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Day's P&L</p>
                  <p className="text-2xl font-mono font-black italic text-emerald-600 dark:text-emerald-400">+₹14.2K</p>
                  <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded-full mt-2 overflow-hidden">
                    <div className="w-3/4 h-full bg-emerald-500" />
                  </div>
                </div>
              </div>

              {/* Holding List */}
              <div className="space-y-3">
                {[
                  { name: 'Nifty 50', qty: 50, avg: 22100, current: 22410, icon: '🇮🇳', up: true },
                  { name: 'Bitcoin', qty: 0.12, avg: 45000, current: 64120, icon: '₿', up: true },
                  { name: 'Reliance', qty: 10, avg: 2850, current: 2790, icon: '🏢', up: false },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-lg">{item.icon}</div>
                      <div>
                        <h4 className="font-black text-xs">{item.name}</h4>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Qty: {item.qty}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black ${item.up ? 'text-emerald-500' : 'text-rose-500'}`}>₹{(item.qty * item.current).toLocaleString()}</p>
                      <p className={`text-[8px] font-black ${item.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {item.up ? '+' : '-'}{Math.abs(((item.current - item.avg) / item.avg) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {state.userPlan === 'free' && (
                <div className="p-6 rounded-[2rem] bg-gradient-to-br from-amber-400 to-orange-500 text-zinc-900 shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingIcon className="w-6 h-6" />
                    <h3 className="font-display font-black text-lg italic">Unlock Advanced Analytics</h3>
                  </div>
                  <p className="text-[10px] font-bold leading-relaxed mb-4">Get tax optimization, smart rebalancing, and PDF reports for your portfolio.</p>
                  <button onClick={() => dispatch({ type: 'SET_SHOW_PAYWALL', payload: true })} className="w-full py-3 bg-zinc-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all">Upgrade to Pro</button>
                </div>
              )}
            </motion.div>
          )}

          {state.activeTab === 'tax' && (
            <motion.div 
              key="tax"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="px-2">
                <h2 className="text-3xl font-display font-black tracking-tighter italic">Tax Planner</h2>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500 mt-1">Regime Comparison FY 24-25</p>
              </div>

              <div className="p-6 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 space-y-6">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Gross Annual Salary</label>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black opacity-20">₹</span>
                    <input type="number" placeholder="12,00,000" className="flex-1 bg-transparent text-2xl font-mono font-black italic outline-none border-b-2 border-slate-100 dark:border-white/5 focus:border-blue-500 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-blue-500">New Regime</p>
                      <p className="text-xl font-mono font-black italic">₹92,500</p>
                    </div>
                    <div className="px-2 py-1 bg-blue-500 text-white rounded text-[7px] font-black uppercase">Recommended</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between opacity-60">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Old Regime</p>
                      <p className="text-xl font-mono font-black italic">₹1,14,200</p>
                    </div>
                    <div className="text-[8px] font-black text-rose-500 uppercase">+₹21,700 Extra</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Deductions (Old Regime)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                      <p className="text-[7px] font-black uppercase text-slate-400">80C (Life/PPF)</p>
                      <p className="text-xs font-black italic">₹1.5L Limit</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                      <p className="text-[7px] font-black uppercase text-slate-400">80D (Health)</p>
                      <p className="text-xs font-black italic">₹25K Limit</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {state.activeTab === 'notifications' && (
            <motion.div 
              key="notifications"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="px-2 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-display font-black tracking-tighter italic">Alerts</h2>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500 mt-1">Market Signals</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_NOTIFICATIONS', payload: state.notifications.map(n => ({ ...n, read: true })) })} className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mark all as read</button>
              </div>

              <div className="space-y-3">
                {state.notifications.map(notif => (
                  <div key={notif.id} className={`p-4 rounded-[1.5rem] bg-white dark:bg-zinc-900 border flex gap-4 ${notif.read ? 'border-slate-100 dark:border-white/5 opacity-60' : 'border-blue-500/30 bg-blue-500/5'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notif.type === 'promo' ? 'bg-amber-400/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {notif.type === 'promo' ? <Star className="w-5 h-5" /> : <TrendingIcon className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-black">{notif.title}</h4>
                        <span className="text-[7px] font-bold text-slate-400">{notif.time}</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 leading-relaxed">{notif.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {state.activeTab === 'quick' && (
            <motion.div 
              key="quick"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="px-2">
                <h2 className="text-3xl font-display font-black tracking-tighter">Recent Tools</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mt-1">Quick access history</p>
              </div>

              {recentToolObjects.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {recentToolObjects.map(tool => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <History className="w-16 h-16 text-slate-200 dark:text-white/5 mb-4" />
                  <h3 className="font-display font-black text-lg">No Recents Yet</h3>
                  <p className="text-sm text-slate-400 mt-2">Start using modules to see them appear here for fast access.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white/90 dark:bg-[#060606]/95 backdrop-blur-3xl border-t border-slate-200 dark:border-white/5 z-50 px-4 flex items-center justify-between pb-6 shadow-[0_-10px_50px_rgba(0,0,0,0.1)]">
        <NavButton active={state.activeTab === 'home'} icon={<Home />} label="Home" onClick={() => dispatch({ type: 'SET_TAB', payload: 'home' })} />
        <NavButton active={state.activeTab === 'portfolio'} icon={<PortfolioIcon />} label="Assets" onClick={() => dispatch({ type: 'SET_TAB', payload: 'portfolio' })} />
        
        <div className="relative -top-6">
          <button 
            onClick={() => dispatch({ type: 'SET_TAB', payload: 'calc' })}
            className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all shadow-[0_10px_25px_rgba(37,99,235,0.3)] ${state.activeTab === 'calc' ? 'bg-blue-600 text-white rotate-12 scale-110 shadow-blue-500/40' : 'bg-slate-900 dark:bg-zinc-800 text-white'}`}
          >
            <Calculator className="w-7 h-7" />
          </button>
        </div>

        <NavButton active={state.activeTab === 'watchlist'} icon={<Heart />} label="Watch" onClick={() => dispatch({ type: 'SET_TAB', payload: 'watchlist' })} />
        <NavButton active={state.activeTab === 'tools'} icon={<LayoutGrid />} label="Explorer" onClick={() => dispatch({ type: 'SET_TAB', payload: 'tools' })} />
      </nav>

      {/* Paywall Modal */}
      <AnimatePresence>
        {state.showPaywall && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 100, scale: 0.9 }}
              className="w-full max-w-md bg-zinc-900 rounded-[3rem] border border-white/10 overflow-hidden relative"
            >
              <button 
                onClick={() => dispatch({ type: 'SET_SHOW_PAYWALL', payload: false })}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white/40" />
              </button>

              <div className="p-8 pb-4 text-center">
                <div className="w-16 h-16 rounded-3xl bg-amber-400 mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                  <Crown className="w-8 h-8 text-zinc-900" />
                </div>
                <h2 className="text-3xl font-display font-black tracking-tighter text-white italic mb-2">Elevate Your Wealth</h2>
                <p className="text-xs text-white/60 font-bold mb-8">Professional tools for serious investors</p>

                <div className="space-y-3 mb-8 text-left">
                  {[
                    { tier: 'pro', name: 'Pro', price: '99', color: 'border-amber-400/30 bg-amber-400/5', features: ['Real-time Data', 'Unlimited Watchlist', 'AI Insight Access'] },
                    { tier: 'elite', name: 'Elite', price: '299', color: 'border-purple-500/30 bg-purple-500/5', features: ['Options Chain', 'Tax Optimizer', 'Export Reports'] }
                  ].map(plan => (
                    <button 
                      key={plan.tier}
                      onClick={() => { dispatch({ type: 'SET_USER_PLAN', payload: plan.tier as PlanType }); dispatch({ type: 'SET_SHOW_PAYWALL', payload: false }); }}
                      className={`w-full p-5 rounded-3xl border ${plan.color} flex items-center justify-between group hover:scale-[1.02] transition-all`}
                    >
                      <div className="text-left">
                        <h4 className={`text-lg font-black italic ${plan.tier === 'elite' ? 'text-purple-400' : 'text-amber-400'}`}>{plan.name} Plan</h4>
                        <div className="flex gap-2 flex-wrap mt-1">
                          {plan.features.map(f => <span key={f} className="text-[7px] font-black uppercase text-white/40">{f}</span>)}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-mono font-black italic text-white tracking-tighter">₹{plan.price}/mo</p>
                        <p className="text-[7px] font-black uppercase text-blue-400">Subscribe No-Risk</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-4 text-[7px] font-black uppercase tracking-widest text-white/20">
                  <div className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure UPI</div>
                  <div className="flex items-center gap-1"><RefreshCcw className="w-3 h-3" /> Cancel Anytime</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications Sidebar */}
      <AnimatePresence>
        {state.showNotifications && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[110] bg-zinc-950/95 flex flex-col p-6"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-display font-black tracking-tighter italic text-white">Alert Hub</h2>
              <button onClick={() => dispatch({ type: 'SET_SHOW_NOTIFICATIONS', payload: false })} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
              {state.notifications.map(notif => (
                <div key={notif.id} className="p-5 rounded-[2rem] bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-black uppercase tracking-widest text-blue-400">{notif.type}</span>
                    <span className="text-[8px] font-bold text-white/40">{notif.time}</span>
                  </div>
                  <h4 className="text-xs font-black text-white mb-1">{notif.title}</h4>
                  <p className="text-[10px] font-bold text-white/60 leading-relaxed">{notif.body}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Interstitial Ad Modal */}
      <AnimatePresence>
        {state.showInterstitial && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6"
          >
            <div className="w-full max-w-sm bg-zinc-900 rounded-[3rem] border border-white/10 overflow-hidden relative p-8">
              <div className="absolute top-4 right-4 text-[8px] font-black uppercase text-white/20">Ad Placeholder</div>
              <div className="mb-8 p-12 bg-white/5 rounded-[2rem] border border-white/5 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
                <Calculator className="w-16 h-16 text-blue-500" />
              </div>
              <h3 className="text-2xl font-display font-black tracking-tighter text-white italic mb-2">Upgrade to Pro</h3>
              <p className="text-[10px] font-bold text-white/40 mb-8 leading-relaxed">Stop seeing interruptions and unlock lightning-fast market data analysis.</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => { dispatch({ type: 'SET_INTERSTITIAL', payload: false }); dispatch({ type: 'SET_SHOW_PAYWALL', payload: true }); }}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/30 active:scale-95 transition-all"
                >
                  Unleash Pro Access
                </button>
                <button 
                  onClick={() => dispatch({ type: 'SET_INTERSTITIAL', payload: false })}
                  className="w-full py-2 text-[8px] font-black uppercase text-white/20 hover:text-white/40 tracking-widest"
                >
                  Continue with Ads
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const NavButton = ({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-blue-600 scale-110' : 'text-slate-400 dark:text-zinc-500'}`}
  >
    {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
    <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    {active && <motion.div layoutId="nav-dot" className="w-1 h-1 bg-blue-600 rounded-full mt-0.5" />}
  </button>
);

