/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { AppContext } from '../App';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Bell,
  BarChart3
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { formatCurrency, cn } from '../lib/utils';
import { OrderStatus, PaymentStatus } from '../types';

export default function Dashboard() {
  const context = useContext(AppContext);
  if (!context) return null;
  const { lang, settings, navigate } = context;
  const isDark = settings.theme === 'dark';

  const orders = useLiveQuery(() => db.orders.toArray()) || [];
  
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.orderStatus === OrderStatus.PENDING).length,
    delivered: orders.filter(o => o.orderStatus === OrderStatus.DELIVERED).length,
    due: orders.filter(o => o.paymentStatus === PaymentStatus.DUE).length,
    paid: orders.filter(o => o.paymentStatus === PaymentStatus.PAID).length,
    totalSale: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    totalDue: orders.reduce((sum, o) => sum + o.dueAmount, 0),
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySeen = orders.filter(o => o.seenDate === todayStr).length;
  const todayDelivery = orders.filter(o => o.deliveryDate === todayStr).length;

  // Prepare chart data for last 30 days
  const last30Days = [...Array(30)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayOrders = orders.filter(o => o.orderDate === dateStr);
    return {
      date: dateStr.split('-').slice(1).join('/'),
      fullDate: dateStr,
      sales: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      count: dayOrders.length
    };
  });

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-1">
        <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-neutral-800")}>{lang.dashboard}</h2>
        <p className="text-neutral-500 text-sm">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Sales Trend Chart */}
      <div className={cn(
        "p-6 rounded-2xl border shadow-sm space-y-4 transition-colors",
        isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
      )}>
        <div className="flex items-center justify-between">
          <h3 className={cn("text-lg font-semibold flex items-center gap-2", isDark ? "text-neutral-300" : "text-neutral-700")}>
            <BarChart3 className="text-blue-500" size={20} />
            Monthly Sales Trend
          </h3>
          <div className="text-[10px] uppercase font-bold text-neutral-400 bg-neutral-500/10 px-2 py-1 rounded">Last 30 Days</div>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={last30Days.map(d => ({ name: d.date, sales: d.sales }))}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#333" : "#f0f0f0"} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#888' }}
                interval={6}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#888' }}
                tickFormatter={(val) => `৳${val > 999 ? (val/1000).toFixed(1) + 'k' : val}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#1f2937' : '#fff', 
                  borderRadius: '12px', 
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: isDark ? '#fff' : '#000' }}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSales)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid for important reminders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ReminderCard 
          icon={<Bell className="text-orange-500" />}
          label={lang.todaySeen}
          count={todaySeen}
          color={isDark ? "bg-orange-950/30 border-orange-500/20" : "bg-orange-50 border-neutral-100"}
          dark={isDark}
          onClick={() => navigate('allOrders', { filter: 'todaySeen' })}
        />
        <ReminderCard 
          icon={<Calendar className="text-blue-500" />}
          label={lang.todayDelivery}
          count={todayDelivery}
          color={isDark ? "bg-blue-950/30 border-blue-500/20" : "bg-blue-50 border-neutral-100"}
          dark={isDark}
          onClick={() => navigate('allOrders', { filter: 'todayDelivery' })}
        />
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<ClipboardList size={20} />} 
          label={lang.totalOrders} 
          value={stats.total} 
          color="blue"
          dark={isDark}
        />
        <StatCard 
          icon={<Clock size={20} />} 
          label={lang.pendingOrders} 
          value={stats.pending} 
          color="amber"
          dark={isDark}
          onClick={() => navigate('allOrders', { filter: 'pending' })}
        />
        <StatCard 
          icon={<CheckCircle size={20} />} 
          label={lang.deliveredOrders} 
          value={stats.delivered} 
          color="emerald"
          dark={isDark}
          onClick={() => navigate('allOrders', { filter: 'delivered' })}
        />
        <StatCard 
          icon={<AlertCircle size={20} />} 
          label={lang.dueOrders} 
          value={stats.due} 
          color="rose"
          dark={isDark}
          onClick={() => navigate('allOrders', { filter: 'due' })}
        />
      </div>

      {/* Financials Section */}
      <div className={cn(
        "p-6 rounded-2xl border shadow-sm space-y-6 transition-colors",
        isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
      )}>
        <h3 className={cn("text-lg font-semibold flex items-center gap-2", isDark ? "text-neutral-300" : "text-neutral-700")}>
          <DollarSign className="text-blue-600" size={20} />
          {lang.payment}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-neutral-500 text-sm mb-1">{lang.totalSale}</p>
            <p className={cn("text-3xl font-bold", isDark ? "text-white" : "text-neutral-900")}>{formatCurrency(stats.totalSale)}</p>
          </div>
          <div className={cn(
            "border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-6",
            isDark ? "border-neutral-700" : "border-neutral-100"
          )}>
            <p className="text-neutral-500 text-sm mb-1">{lang.totalDue}</p>
            <p className="text-3xl font-bold text-rose-500">{formatCurrency(stats.totalDue)}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button 
          onClick={() => navigate('newOrder')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
        >
          <PlusCircle size={24} />
          {lang.newOrder}
        </button>
        <button 
          onClick={() => navigate('allOrders')}
          className={cn(
            "font-bold py-5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 border-2",
            isDark ? "bg-neutral-800 border-neutral-700 text-blue-400 hover:bg-neutral-700" : "bg-white border-blue-600 text-blue-600 hover:bg-neutral-50"
          )}
        >
          <ClipboardList size={24} />
          {lang.allOrders}
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, onClick, dark }: any) {
  const colors: any = {
    blue: "bg-blue-500/10 text-blue-500",
    amber: "bg-amber-500/10 text-amber-500",
    emerald: "bg-emerald-500/10 text-emerald-500",
    rose: "bg-rose-500/10 text-rose-500",
  };

  return (
    <button 
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "p-4 rounded-2xl border transition-all flex flex-col items-start gap-2 text-left",
        dark ? "bg-neutral-800 border-neutral-700 hover:bg-neutral-700" : "bg-white border-neutral-100 hover:shadow-md",
        onClick ? "active:scale-95 cursor-pointer" : "cursor-default"
      )}
    >
      <div className={cn("p-2 rounded-xl", colors[color])}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{label}</p>
        <p className={cn("text-2xl font-bold", dark ? "text-white" : "text-neutral-900")}>{value}</p>
      </div>
    </button>
  );
}

function ReminderCard({ icon, label, count, color, onClick, dark }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-5 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.98]",
        color,
        dark ? "" : "hover:shadow-md shadow-sm"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn("p-3 rounded-xl shadow-sm text-2xl", dark ? "bg-neutral-900" : "bg-white")}>
          {icon}
        </div>
        <div className="text-left">
          <p className={cn("text-sm font-medium", dark ? "text-neutral-400" : "text-neutral-600")}>{label}</p>
          <p className={cn("text-2xl font-bold", dark ? "text-white" : "text-neutral-900")}>{count}</p>
        </div>
      </div>
      <div className={cn("p-2 rounded-full", dark ? "bg-white/5 text-neutral-600" : "bg-white/50 text-neutral-400")}>
        <TrendingUp size={16} />
      </div>
    </button>
  );
}

function PlusCircle(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
  );
}
