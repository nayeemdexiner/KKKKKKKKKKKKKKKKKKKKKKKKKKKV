/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useContext } from 'react';
import { db } from '../lib/db';
import { AppContext } from '../App';
import { Order, OrderStatus, PaymentStatus } from '../types';
import { cn } from '../lib/utils';
import { Save, Calendar, Clock, User, Phone, MapPin, Package, Hash, FileText, IndianRupee } from 'lucide-react';

interface OrderFormProps {
  orderId?: number;
}

export default function OrderForm({ orderId }: OrderFormProps) {
  const context = useContext(AppContext);
  if (!context) return null;
  const { lang, settings, navigate } = context;
  const isDark = settings.theme === 'dark';

  const [formData, setFormData] = useState<Partial<Order>>({
    memoNo: '',
    orderDate: new Date().toISOString().split('T')[0],
    customerName: '',
    customerAddress: '',
    customerPhone: '',
    particular: '',
    quantity: 1,
    rate: 0,
    totalAmount: 0,
    advanceAmount: 0,
    dueAmount: 0,
    seenDate: '',
    seenReminderTime: settings.defaultSeenTime,
    deliveryDate: '',
    deliveryReminderTime: settings.defaultDeliveryTime,
    note: '',
    paymentStatus: PaymentStatus.DUE,
    orderStatus: OrderStatus.PENDING,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (orderId) {
      db.orders.get(orderId).then(order => {
        if (order) setFormData({ ...order });
      }).catch(err => console.error("Error loading order:", err));
    } else {
      db.orders.count().then(count => {
        setFormData(prev => ({ ...prev, memoNo: String(count + 1) }));
      }).catch(err => console.error("Error counting orders:", err));
    }
  }, [orderId]);

  // Handle calculations
  useEffect(() => {
    const total = (Number(formData.quantity) || 0) * (Number(formData.rate) || 0);
    const due = total - (Number(formData.advanceAmount) || 0);
    const paymentStatus = due <= 0 ? PaymentStatus.PAID : PaymentStatus.DUE;
    
    setFormData(prev => ({
      ...prev,
      totalAmount: total,
      dueAmount: Math.max(0, due),
      paymentStatus: prev.paymentStatus === PaymentStatus.PAID && due > 0 ? PaymentStatus.DUE : paymentStatus
    }));
  }, [formData.quantity, formData.rate, formData.advanceAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const now = new Date().toISOString();
      const orderToSave = {
        memoNo: formData.memoNo || '',
        orderDate: formData.orderDate || now.split('T')[0],
        customerName: formData.customerName || '',
        customerAddress: formData.customerAddress || '',
        customerPhone: formData.customerPhone || '',
        particular: formData.particular || '',
        quantity: Number(formData.quantity) || 0,
        rate: Number(formData.rate) || 0,
        totalAmount: Number(formData.totalAmount) || 0,
        advanceAmount: Number(formData.advanceAmount) || 0,
        dueAmount: Number(formData.dueAmount) || 0,
        seenDate: formData.seenDate || '',
        seenReminderTime: formData.seenReminderTime || settings.defaultSeenTime,
        deliveryDate: formData.deliveryDate || '',
        deliveryReminderTime: formData.deliveryReminderTime || settings.defaultDeliveryTime,
        note: formData.note || '',
        paymentStatus: formData.paymentStatus || PaymentStatus.DUE,
        orderStatus: formData.orderStatus || OrderStatus.PENDING,
        createdAt: formData.createdAt || now,
        updatedAt: now,
      } as Order;

      if (orderId) {
        await db.orders.update(orderId, orderToSave);
      } else {
        await db.orders.add(orderToSave);
      }
      
      setTimeout(() => navigate('allOrders'), 100);
    } catch (error) {
      console.error('Failed to save order:', error);
      alert("Error saving order. Please check inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value
    }));
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-neutral-800")}>
          {orderId ? lang.editMemo : lang.newOrder}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className={cn(
        "space-y-8 p-6 rounded-2xl border shadow-sm transition-colors",
        isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
      )}>
        {/* Memo Info Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputGroup 
            icon={<Hash size={18} />}
            label={lang.memoNo}
            name="memoNo"
            value={formData.memoNo}
            onChange={handleChange}
            dark={isDark}
            required
          />
          <InputGroup 
            icon={<Calendar size={18} />}
            label={lang.orderDate}
            name="orderDate"
            type="date"
            value={formData.orderDate}
            onChange={handleChange}
            dark={isDark}
            required
          />
        </div>

        {/* Customer Details */}
        <div className="space-y-4">
          <h3 className={cn("text-lg font-semibold flex items-center gap-2 border-b pb-2", isDark ? "text-neutral-300 border-neutral-700" : "text-neutral-700 border-neutral-100")}>
            <User size={20} className="text-blue-600" />
            {lang.customerName}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputGroup 
              label={lang.customerName}
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="Name..."
              dark={isDark}
              required
            />
            <InputGroup 
              label={lang.phone}
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleChange}
              placeholder="017..."
              type="tel"
              dark={isDark}
            />
            <div className="sm:col-span-2 space-y-1">
              <label className={cn("text-sm font-medium", isDark ? "text-neutral-400" : "text-neutral-600")}>{lang.address}</label>
              <textarea 
                name="customerAddress"
                value={formData.customerAddress}
                onChange={handleChange}
                rows={2}
                className={cn(
                  "w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all",
                  isDark ? "bg-neutral-900 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200"
                )}
              />
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-4">
          <h3 className={cn("text-lg font-semibold flex items-center gap-2 border-b pb-2", isDark ? "text-neutral-300 border-neutral-700" : "text-neutral-700 border-neutral-100")}>
            <Package size={20} className="text-blue-400" />
            {lang.particular}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <InputGroup 
                label={lang.particular}
                name="particular"
                value={formData.particular}
                onChange={handleChange}
                placeholder="Description..."
                dark={isDark}
                required
              />
            </div>
            <InputGroup 
              label={lang.quantity}
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              dark={isDark}
              required
            />
            <InputGroup 
              label={lang.rate}
              name="rate"
              type="number"
              value={formData.rate}
              onChange={handleChange}
              dark={isDark}
              required
            />
            <div className="space-y-1">
              <label className={cn("text-sm font-medium", isDark ? "text-neutral-400" : "text-neutral-600")}>{lang.total}</label>
              <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl font-bold text-blue-500 text-lg">
                {formData.totalAmount?.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="space-y-4 pt-2">
          <div className={cn(
            "grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl border",
            isDark ? "bg-neutral-900/50 border-neutral-700" : "bg-neutral-50 border-neutral-100"
          )}>
            <InputGroup 
              label={lang.advance}
              name="advanceAmount"
              type="number"
              value={formData.advanceAmount}
              onChange={handleChange}
              dark={isDark}
            />
            <div className="space-y-1">
              <label className={cn("text-sm font-medium", isDark ? "text-neutral-400" : "text-neutral-600")}>{lang.due}</label>
              <div className={cn(
                "px-4 py-2 border rounded-xl font-bold text-lg",
                formData.dueAmount! > 0 ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              )}>
                {formData.dueAmount?.toLocaleString()}
              </div>
            </div>
            <div className="space-y-1">
              <label className={cn("text-sm font-medium", isDark ? "text-neutral-400" : "text-neutral-600")}>{lang.payment}</label>
              <select 
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleChange}
                className={cn(
                  "w-full h-[46px] px-4 py-2 border rounded-xl outline-none",
                  isDark ? "bg-neutral-900 border-neutral-700 text-white" : "bg-white border-neutral-200"
                )}
              >
                <option value={PaymentStatus.DUE}>{lang.due}</option>
                <option value={PaymentStatus.PAID}>{lang.paid}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reminders Section */}
        <div className="space-y-4">
          <h3 className={cn("text-lg font-semibold flex items-center gap-2 border-b pb-2", isDark ? "text-neutral-300 border-neutral-700" : "text-neutral-700 border-neutral-100")}>
            <Bell size={20} className="text-orange-500" />
            Reminders
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className={cn("p-4 rounded-2xl border space-y-3", isDark ? "bg-orange-500/5 border-orange-500/20" : "bg-orange-50 border-orange-100")}>
              <InputGroup 
                label={lang.seenDate}
                name="seenDate"
                type="date"
                value={formData.seenDate}
                onChange={handleChange}
                dark={isDark}
              />
              <InputGroup 
                label={lang.seenTime}
                name="seenReminderTime"
                type="time"
                value={formData.seenReminderTime}
                onChange={handleChange}
                dark={isDark}
              />
            </div>
            <div className={cn("p-4 rounded-2xl border space-y-3", isDark ? "bg-blue-500/5 border-blue-500/20" : "bg-blue-50 border-blue-100")}>
              <InputGroup 
                label={lang.deliveryDate}
                name="deliveryDate"
                type="date"
                value={formData.deliveryDate}
                onChange={handleChange}
                dark={isDark}
              />
              <InputGroup 
                label={lang.deliveryTime}
                name="deliveryReminderTime"
                type="time"
                value={formData.deliveryReminderTime}
                onChange={handleChange}
                dark={isDark}
              />
            </div>
          </div>
        </div>

        {/* Notes & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={cn("text-sm font-medium", isDark ? "text-neutral-400" : "text-neutral-600")}>{lang.note}</label>
            <textarea 
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows={2}
              className={cn(
                "w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all",
                isDark ? "bg-neutral-900 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200"
              )}
            />
          </div>
          <div className="space-y-1">
            <label className={cn("text-sm font-medium", isDark ? "text-neutral-400" : "text-neutral-600")}>{lang.status}</label>
            <select 
              name="orderStatus"
              value={formData.orderStatus}
              onChange={handleChange}
              className={cn(
                "w-full h-[60px] px-4 py-2 border rounded-xl outline-none font-bold text-blue-500",
                isDark ? "bg-neutral-900 border-neutral-700" : "bg-neutral-50 border-neutral-200"
              )}
            >
              <option value={OrderStatus.PENDING}>{lang.pending}</option>
              <option value={OrderStatus.DELIVERED}>{lang.delivered}</option>
            </select>
          </div>
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transform transition-all active:scale-[0.98] shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Save size={24} />
              {lang.save}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function InputGroup({ label, icon, dark, ...props }: any) {
  return (
    <div className="space-y-1">
      <label className={cn(
        "text-sm font-medium flex items-center gap-1.5 transition-colors",
        dark ? "text-neutral-400" : "text-neutral-600"
      )}>
        {icon}
        {label}
      </label>
      <input 
        {...props}
        className={cn(
          "w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-neutral-500",
          dark ? "bg-neutral-900 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200"
        )}
      />
    </div>
  );
}

function Bell(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
  );
}
