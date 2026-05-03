/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './lib/db';
import { 
  Order, 
  ShopSettings, 
  Language, 
  OrderStatus, 
  PaymentStatus,
  AppTheme 
} from './types';
import { translations } from './lib/translations';
import { cn } from './lib/utils';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ClipboardList, 
  Settings as SettingsIcon,
  Bell,
  Search,
  Filter,
  ArrowLeft,
  Share2,
  FileText,
  Trash2,
  CheckCircle,
  Clock,
  ChevronRight,
  Menu,
  X,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Components (We will define these later or in the same file)
import Dashboard from './components/Dashboard';
import OrderForm from './components/OrderForm';
import OrderList from './components/OrderList';
import Settings from './components/Settings';
import MemoView from './components/MemoView';

// Context
interface AppContextType {
  settings: ShopSettings;
  setSettings: (s: ShopSettings) => void;
  lang: typeof translations[Language.EN];
  currentLanguage: Language;
  navigate: (view: View, params?: any) => void;
  updateReminders: () => void;
}

export const AppContext = createContext<AppContextType | null>(null);

type View = 'dashboard' | 'newOrder' | 'allOrders' | 'settings' | 'memoView' | 'editOrder';

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'Chittagong Door',
  shopPhone: '01XXXXXXXXX',
  shopAddress: 'Chittagong, Bangladesh',
  defaultSeenTime: '09:00',
  defaultDeliveryTime: '09:00',
  language: Language.BN,
  theme: AppTheme.LIGHT,
  alarmSound: 'default',
};

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [viewParams, setViewParams] = useState<any>(null);
  const [settings, setSettings] = useState<ShopSettings>(() => {
    const saved = localStorage.getItem('shopSettings');
    const parsed = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    // Ensure all default properties exist
    return { ...DEFAULT_SETTINGS, ...parsed };
  });
  const [isLocked, setIsLocked] = useState(() => !!(localStorage.getItem('shopSettings') && JSON.parse(localStorage.getItem('shopSettings')!).appLockPin));
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Alarm Sound State
  const [alarmPlaying, setAlarmPlaying] = useState(false);
  const [activeReminder, setActiveReminder] = useState<Order | null>(null);

  const lang = translations[settings.language];

  const playAlarm = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1013/1013-preview.mp3'); // A professional reminder sound
    audio.loop = true;
    audio.play().catch(e => console.error("Audio play failed:", e));
    (window as any)._alarmAudio = audio;
    setAlarmPlaying(true);
  };

  const stopAlarm = () => {
    if ((window as any)._alarmAudio) {
      (window as any)._alarmAudio.pause();
      (window as any)._alarmAudio = null;
    }
    setAlarmPlaying(false);
    setActiveReminder(null);
  };

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput === settings.appLockPin) {
      setIsLocked(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
      // Shake effect placeholder
    }
  };

  useEffect(() => {
    if (settings.appLockPin && !isLocked) {
      // Re-lock on tab hide/visible if desired, for now just initial
    }
  }, [settings.appLockPin]);

  useEffect(() => {
    localStorage.setItem('shopSettings', JSON.stringify(settings));
    if (settings.language === Language.BN) {
      document.documentElement.lang = 'bn';
    } else {
      document.documentElement.lang = 'en';
    }
  }, [settings]);

  // Reminder Logic
  const updateReminders = () => {
    const checkReminders = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const orders = await db.orders.where('seenDate').equals(todayStr)
        .or('deliveryDate').equals(todayStr).toArray();
        
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const lastChecked = localStorage.getItem('lastReminderChecked');
      if (lastChecked === currentTime) return; // Don't trigger multiple times in the same minute

      orders.forEach(order => {
        let triggered = false;
        if (order.seenDate === todayStr && order.seenReminderTime === currentTime) {
          triggered = true;
        }
        if (order.deliveryDate === todayStr && order.deliveryReminderTime === currentTime) {
          triggered = true;
        }

        if (triggered) {
          localStorage.setItem('lastReminderChecked', currentTime);
          setActiveReminder(order);
          playAlarm();
          
          if (Notification.permission === "granted") {
            new Notification(`${lang.appName}: Reminder`, {
              body: `${lang.memoNo}: ${order.memoNo}\n${lang.customerName}: ${order.customerName}`,
              icon: '/icon.png'
            });
          }
        }
      });
    };
    
    checkReminders();
  };

  useEffect(() => {
    const interval = setInterval(updateReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [settings.language]);

  const requestNotificationPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const navigate = (view: View, params?: any) => {
    setCurrentView(view);
    setViewParams(params);
    window.scrollTo(0, 0);
  };

  const contextValue: AppContextType = {
    settings,
    setSettings,
    lang,
    currentLanguage: settings.language,
    navigate,
    updateReminders,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <AnimatePresence>
        {alarmPlaying && activeReminder && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl space-y-6">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <Bell size={40} className="text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-neutral-900 uppercase">Memo Reminder!</h2>
                <p className="text-neutral-500 mt-2">Active task for {activeReminder.customerName}</p>
              </div>
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 text-left">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Details</p>
                <p className="font-bold text-neutral-800 mt-1">Memo: #{activeReminder.memoNo}</p>
                <p className="text-sm text-neutral-600">{activeReminder.particular}</p>
              </div>
              <button 
                onClick={stopAlarm}
                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all"
              >
                DISMISS ALARM
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLocked && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-blue-600 flex flex-col items-center justify-center p-6 text-white"
          >
            <div className="w-full max-w-xs space-y-8 text-center">
              <div className="space-y-2">
                <div className="bg-white/10 w-20 h-20 rounded-3xl mx-auto flex items-center justify-center backdrop-blur-sm">
                  <Lock size={40} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">{settings.shopName}</h2>
                <p className="text-blue-100 text-sm">Enter PIN to Unlock</p>
              </div>

              <form onSubmit={handleUnlock} className="space-y-6">
                <div className="flex justify-center gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i}
                      className={cn(
                        "w-4 h-4 rounded-full border-2 border-white/50 transition-all duration-200",
                        pinInput.length >= i ? "bg-white border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]" : ""
                      )}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((key) => {
                    if (key === 'OK') {
                      return (
                        <button
                          key={key}
                          type="submit"
                          className="h-16 rounded-2xl bg-white text-blue-600 font-bold text-xl shadow-lg active:scale-95 transition-all"
                        >
                          {key}
                        </button>
                      );
                    }
                    if (key === 'C') {
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setPinInput('')}
                          className="h-16 rounded-2xl bg-white/10 text-white font-bold text-xl backdrop-blur-md active:scale-95 transition-all"
                        >
                          {key}
                        </button>
                      );
                    }
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => pinInput.length < 4 && setPinInput(p => p + key)}
                        className="h-16 rounded-2xl bg-white/20 text-white font-bold text-2xl backdrop-blur-md active:scale-95 transition-all border border-white/10"
                      >
                        {key}
                      </button>
                    );
                  })}
                </div>

                {pinError && (
                  <motion.p 
                    initial={{ x: -10 }} 
                    animate={{ x: 0 }} 
                    className="text-rose-300 font-bold text-sm"
                  >
                    Incorrect PIN. Please try again.
                  </motion.p>
                )}
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn(
        "min-h-screen flex flex-col font-sans transition-colors duration-300",
        settings.theme === AppTheme.DARK ? "bg-neutral-900 text-white" : "bg-neutral-50 text-neutral-900"
      )}>
        {/* Header */}
        <header className="bg-blue-600 text-white shadow-lg sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentView !== 'dashboard' && (
              <button 
                onClick={() => navigate('dashboard')}
                className="p-1 hover:bg-blue-700 rounded-full transition-colors"
                id="back-button"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <h1 className="text-xl font-bold tracking-tight" id="app-title">
              {settings.shopName || lang.appName}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('settings')}
              className={cn(
                "p-2 rounded-full transition-colors",
                currentView === 'settings' ? "bg-blue-700" : "hover:bg-blue-700"
              )}
              id="settings-button"
            >
              <SettingsIcon size={20} />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView + (viewParams?.id || '')}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="p-4 md:p-6 lg:max-w-5xl lg:mx-auto w-full min-h-[calc(100vh-8rem)]"
            >
              {currentView === 'dashboard' && <Dashboard />}
              {currentView === 'newOrder' && <OrderForm />}
              {currentView === 'editOrder' && <OrderForm orderId={viewParams?.id} />}
              {currentView === 'allOrders' && <OrderList />}
              {currentView === 'settings' && <Settings />}
              {currentView === 'memoView' && <MemoView orderId={viewParams?.id} />}
              
              <div className="mt-12 mb-8 text-center">
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.2em] opacity-40",
                  settings.theme === AppTheme.DARK ? "text-white" : "text-neutral-900"
                )}>
                  Developed by Nayeem
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation (Mobile Friendly) */}
        <nav className={cn(
          "border-t sticky bottom-0 z-50 flex items-center justify-around px-2 py-1 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:hidden",
          settings.theme === AppTheme.DARK ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"
        )}>
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label={lang.dashboard} 
            active={currentView === 'dashboard'} 
            onClick={() => navigate('dashboard')} 
            id="nav-dashboard"
            dark={settings.theme === AppTheme.DARK}
          />
          <NavItem 
            icon={<PlusCircle size={20} />} 
            label={lang.newOrder} 
            active={currentView === 'newOrder'} 
            onClick={() => navigate('newOrder')} 
            id="nav-new-order"
            dark={settings.theme === AppTheme.DARK}
          />
          <NavItem 
            icon={<ClipboardList size={20} />} 
            label={lang.allOrders} 
            active={currentView === 'allOrders'} 
            onClick={() => navigate('allOrders')} 
            id="nav-orders"
            dark={settings.theme === AppTheme.DARK}
          />
        </nav>
        
        {/* Desktop Sidebar (Optional, but good for Tablet/Desktop) */}
        <div className={cn(
          "hidden md:flex fixed left-0 top-[3.5rem] bottom-0 w-16 border-r flex-col items-center py-6 gap-8 shadow-sm",
          settings.theme === AppTheme.DARK ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"
        )}>
          <DesktopNavItem 
            icon={<LayoutDashboard size={24} />} 
            title={lang.dashboard} 
            active={currentView === 'dashboard'} 
            onClick={() => navigate('dashboard')} 
            dark={settings.theme === AppTheme.DARK}
          />
          <DesktopNavItem 
            icon={<PlusCircle size={24} />} 
            title={lang.newOrder} 
            active={currentView === 'newOrder'} 
            onClick={() => navigate('newOrder')} 
            dark={settings.theme === AppTheme.DARK}
          />
          <DesktopNavItem 
            icon={<ClipboardList size={24} />} 
            title={lang.allOrders} 
            active={currentView === 'allOrders'} 
            onClick={() => navigate('allOrders')} 
            dark={settings.theme === AppTheme.DARK}
          />
        </div>
      </div>
    </AppContext.Provider>
  );
}

function NavItem({ icon, label, active, onClick, id, dark }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, id: string, dark?: boolean }) {
  return (
    <button 
      id={id}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-all",
        active ? "text-blue-500 font-medium" : (dark ? "text-neutral-600" : "text-neutral-500")
      )}
    >
      {icon}
      <span className="text-[10px] uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function DesktopNavItem({ icon, title, active, onClick, dark }: { icon: React.ReactNode, title: string, active: boolean, onClick: () => void, dark?: boolean }) {
  return (
    <button 
      title={title}
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl transition-all relative group",
        active ? (dark ? "bg-blue-500/10 text-blue-500 shadow-sm" : "bg-blue-50 text-blue-600 shadow-sm") : (dark ? "text-neutral-600 hover:text-neutral-400" : "text-neutral-400 hover:text-neutral-600")
      )}
    >
      {icon}
      {active && (
        <motion.div 
          layoutId="active-nav"
          className="absolute left-0 w-1 h-8 bg-blue-600 rounded-r-full"
        />
      )}
    </button>
  );
}
