/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useContext, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { AppContext } from '../App';
import { Order, OrderStatus, PaymentStatus } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  Phone, 
  MapPin, 
  ChevronRight,
  Calendar,
  AlertTriangle,
  X
} from 'lucide-react';

export default function OrderList() {
  const context = useContext(AppContext);
  if (!context) return null;
  const { lang, settings, navigate } = context;
  const isDark = settings.theme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'delivered' | 'due' | 'paid' | 'todaySeen' | 'todayDelivery'>('all');

  const orders = useLiveQuery(() => db.orders.reverse().toArray()) || [];

  const filteredOrders = useMemo(() => {
    let result = orders;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => 
        o.memoNo.toLowerCase().includes(q) || 
        o.customerName.toLowerCase().includes(q) || 
        o.customerPhone.toLowerCase().includes(q)
      );
    }

    // Filters
    const todayStr = new Date().toISOString().split('T')[0];
    switch (activeFilter) {
      case 'pending': result = result.filter(o => o.orderStatus === OrderStatus.PENDING); break;
      case 'delivered': result = result.filter(o => o.orderStatus === OrderStatus.DELIVERED); break;
      case 'due': result = result.filter(o => o.paymentStatus === PaymentStatus.DUE); break;
      case 'paid': result = result.filter(o => o.paymentStatus === PaymentStatus.PAID); break;
      case 'todaySeen': result = result.filter(o => o.seenDate === todayStr); break;
      case 'todayDelivery': result = result.filter(o => o.deliveryDate === todayStr); break;
    }

    return result;
  }, [orders, searchQuery, activeFilter]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4">
        <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-neutral-800")}>{lang.allOrders}</h2>
        
        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text"
            placeholder={lang.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-12 pr-12 py-4 border rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all",
              isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-neutral-200 text-neutral-900"
            )}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full",
                isDark ? "hover:bg-neutral-700" : "hover:bg-neutral-100"
              )}
            >
              <X size={18} className="text-neutral-400" />
            </button>
          )}
        </div>

        {/* Horizontal Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          <FilterButton active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} label="All" dark={isDark} />
          <FilterButton active={activeFilter === 'pending'} onClick={() => setActiveFilter('pending')} label={lang.pending} dark={isDark} />
          <FilterButton active={activeFilter === 'delivered'} onClick={() => setActiveFilter('delivered')} label={lang.delivered} dark={isDark} />
          <FilterButton active={activeFilter === 'due'} onClick={() => setActiveFilter('due')} label={lang.due} dark={isDark} />
          <FilterButton active={activeFilter === 'paid'} onClick={() => setActiveFilter('paid')} label={lang.paid} dark={isDark} />
          <FilterButton active={activeFilter === 'todaySeen'} onClick={() => setActiveFilter('todaySeen')} label="Today Seen" dark={isDark} />
          <FilterButton active={activeFilter === 'todayDelivery'} onClick={() => setActiveFilter('todayDelivery')} label="Today Delivery" dark={isDark} />
        </div>
      </div>

      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <OrderCard 
              key={order.id} 
              order={order} 
              onClick={() => navigate('memoView', { id: order.id })}
              lang={lang}
              dark={isDark}
            />
          ))
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className={cn("inline-flex items-center justify-center w-20 h-20 rounded-full", isDark ? "bg-neutral-800" : "bg-neutral-100")}>
              <Search size={40} className="text-neutral-500" />
            </div>
            <p className="text-neutral-500 font-medium">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterButton({ active, label, onClick, dark }: { active: boolean, label: string, onClick: () => void, dark?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border",
        active ? "bg-blue-600 border-blue-600 text-white shadow-md" : 
        (dark ? "bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600" : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300")
      )}
    >
      {label}
    </button>
  );
}

function OrderCard({ order, onClick, lang, dark }: { order: Order; onClick: () => void; lang: any; dark?: boolean; key?: React.Key }) {
  const isPending = order.orderStatus === OrderStatus.PENDING;
  const isDue = order.paymentStatus === PaymentStatus.DUE;

  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full p-5 rounded-2xl border shadow-sm transition-all text-left flex items-center justify-between group active:scale-[0.98]",
        dark ? "bg-neutral-800 border-neutral-700 hover:bg-neutral-700" : "bg-white border-neutral-200 hover:shadow-md"
      )}
    >
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between pr-4">
          <div className="flex items-center gap-2">
            <span className={cn("px-2 py-0.5 rounded text-xs font-bold font-mono", dark ? "bg-neutral-900 text-neutral-400" : "bg-neutral-100 text-neutral-600")}>
              #{order.memoNo}
            </span>
            <h3 className={cn("font-bold text-lg", dark ? "text-white" : "text-neutral-800")}>{order.customerName}</h3>
          </div>
          <div className="flex gap-2">
            <span className={cn(
              "text-[10px] uppercase font-bold px-2 py-1 rounded-full",
              isPending ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
            )}>
              {isPending ? lang.pending : lang.delivered}
            </span>
            <span className={cn(
              "text-[10px] uppercase font-bold px-2 py-1 rounded-full",
              isDue ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
            )}>
              {isDue ? lang.due : lang.paid}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-neutral-500">
          <div className="flex items-center gap-2">
            <Phone size={14} />
            {order.customerPhone || 'N/A'}
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} />
            {order.orderDate}
          </div>
          {order.seenDate && (
             <div className="flex items-center gap-2 text-orange-500 font-medium">
               <Clock size={14} />
               Seen: {order.seenDate}
             </div>
          )}
          {order.deliveryDate && (
             <div className="flex items-center gap-2 text-blue-500 font-medium">
               <Clock size={14} />
               Deliv: {order.deliveryDate}
             </div>
          )}
        </div>

        <div className={cn("flex items-center justify-between pt-2 border-t", dark ? "border-neutral-700" : "border-neutral-50")}>
          <p className={cn("text-sm font-medium", dark ? "text-neutral-400" : "text-neutral-700")}>{order.particular}</p>
          <p className={cn("font-bold text-lg", dark ? "text-white" : "text-neutral-900")}>{formatCurrency(order.dueAmount)}</p>
        </div>
      </div>
      <div className={cn("p-2 rounded-full transition-colors", dark ? "bg-neutral-900 text-neutral-600 group-hover:text-blue-400" : "bg-neutral-50 text-neutral-300 group-hover:text-blue-500")}>
        <ChevronRight size={24} />
      </div>
    </button>
  );
}
