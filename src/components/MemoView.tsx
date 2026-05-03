/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext, useRef } from 'react';
import { db } from '../lib/db';
import { AppContext } from '../App';
import { OrderStatus, PaymentStatus } from '../types';
import { cn, formatCurrency, numberToWords } from '../lib/utils';
import { 
  Download, 
  Edit3, 
  Trash2, 
  Share2, 
  CheckCircle, 
  XCircle,
  Truck,
  Printer,
  Phone,
  MapPin,
  Clock
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MemoViewProps {
  orderId: number;
}

export default function MemoView({ orderId }: MemoViewProps) {
  const context = useContext(AppContext);
  if (!context) return null;
  const { lang, settings, navigate } = context;
  const isDark = settings.theme === 'dark';

  const order = useLiveQuery(() => db.orders.get(orderId), [orderId]);
  const memoRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  if (!order) return <div className="py-20 text-center">Loading...</div>;

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text(settings.shopName, 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`${settings.shopAddress} | Phone: ${settings.shopPhone}`, 105, 28, { align: 'center' });
    
    doc.line(10, 35, 200, 35);
    
    // Memo Details
    doc.setFontSize(11);
    doc.text(`Memo No: ${order.memoNo}`, 10, 45);
    doc.text(`Date: ${order.orderDate}`, 150, 45);
    
    doc.text(`Customer: ${order.customerName}`, 10, 55);
    doc.text(`Phone: ${order.customerPhone}`, 10, 62);
    doc.text(`Address: ${order.customerAddress}`, 10, 69);
    
    // Table
    autoTable(doc, {
      startY: 80,
      head: [['Memo No', lang.particular, lang.quantity, lang.rate, lang.total]],
      body: [
        [order.memoNo, order.particular, order.quantity, formatCurrency(order.rate), formatCurrency(order.totalAmount)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 }
    });
    
    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`${lang.total}: ${formatCurrency(order.totalAmount)}`, 140, finalY);
    doc.text(`${lang.advance}: ${formatCurrency(order.advanceAmount)}`, 140, finalY + 7);
    doc.setTextColor(220, 38, 38); // Red color for Due
    doc.text(`${lang.due}: ${formatCurrency(order.dueAmount)}`, 140, finalY + 14);
    doc.setTextColor(40);
    
    doc.text(`${lang.amountInWords}: ${numberToWords(order.totalAmount)}`, 10, finalY + 25);
    
    // Developer Credit
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Developed by Nayeem', 105, 285, { align: 'center' });
    
    // Footer
    doc.setFontSize(11);
    doc.setTextColor(40);
    doc.text(lang.customerSignature, 30, finalY + 60);
    doc.text(lang.shopSignature, 160, finalY + 60);
    
    doc.save(`Memo_${order.memoNo}.pdf`);
  };

  const handleMarkDelivered = async () => {
    await db.orders.update(orderId, { orderStatus: OrderStatus.DELIVERED });
  };

  const handleMarkPaid = async () => {
    await db.orders.update(orderId, { paymentStatus: PaymentStatus.PAID, dueAmount: 0 });
  };

  const handleDelete = async () => {
    await db.orders.delete(orderId);
    navigate('allOrders');
  };

  const isDelivered = order.orderStatus === OrderStatus.DELIVERED;
  const isPaid = order.paymentStatus === PaymentStatus.PAID;

  return (
    <div className="space-y-6 pb-24">
      {/* Action Buttons */}
      <div className={cn(
        "flex flex-wrap gap-2 sticky top-[4.5rem] backdrop-blur pb-4 z-40 transition-colors",
        isDark ? "bg-neutral-900/90" : "bg-neutral-50/90"
      )}>
        <ActionButton 
          icon={<Edit3 size={18} />} 
          label={lang.editMemo} 
          onClick={() => navigate('editOrder', { id: orderId })} 
          className="bg-blue-600 text-white"
        />
        {!isDelivered && (
          <ActionButton 
            icon={<Truck size={18} />} 
            label={lang.markAsDelivered} 
            onClick={handleMarkDelivered} 
            className="bg-emerald-600 text-white"
          />
        )}
        {!isPaid && (
          <ActionButton 
            icon={<CheckCircle size={18} />} 
            label={lang.markAsPaid} 
            onClick={handleMarkPaid} 
            className="bg-indigo-600 text-white"
          />
        )}
        <ActionButton 
          icon={<Download size={18} />} 
          label={lang.downloadPDF} 
          onClick={handleDownloadPDF} 
          className="bg-neutral-800 text-white"
        />
        <ActionButton 
          icon={<Trash2 size={18} />} 
          label={lang.deleteMemo} 
          onClick={() => setShowDeleteConfirm(true)} 
          className="bg-rose-500 text-white"
        />
      </div>

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className={cn(
            "rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl space-y-6",
            isDark ? "bg-neutral-800" : "bg-white"
          )}>
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={40} className="text-rose-600" />
            </div>
            <div>
              <h2 className={cn("text-2xl font-black uppercase", isDark ? "text-white" : "text-neutral-900")}>Delete Memo?</h2>
              <p className="text-neutral-500 mt-2">This action cannot be undone. Are you sure you want to delete memo #{order.memoNo}?</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className={cn("flex-1 py-4 rounded-2xl font-bold transition-all", isDark ? "bg-neutral-700 text-white" : "bg-neutral-100 text-neutral-600")}
              >
                CANCEL
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* The Memo Digital View */}
      <div 
        ref={memoRef}
        className={cn(
          "p-6 sm:p-10 border shadow-xl rounded-sm max-w-2xl mx-auto space-y-8 relative overflow-hidden transition-colors",
          isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
        )}
      >
        {/* Memo Paper Styling */}
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />
        
        {/* Header */}
        <div className={cn("text-center space-y-2 border-b-2 pb-6", isDark ? "border-neutral-700" : "border-neutral-100")}>
          <h2 className={cn("text-3xl font-black tracking-tight uppercase", isDark ? "text-white" : "text-neutral-900")}>{settings.shopName}</h2>
          <div className="text-neutral-500 text-sm flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
            <span className="flex items-center gap-1"><Phone size={14} /> {settings.shopPhone}</span>
            <span className="flex items-center gap-1"><MapPin size={14} /> {settings.shopAddress}</span>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-neutral-400 uppercase font-black text-xs tracking-widest">{lang.memoNo}</p>
            <p className="font-bold text-lg text-blue-500">#{order.memoNo}</p>
          </div>
          <div className={cn("text-right", isDark ? "text-neutral-300" : "text-neutral-900")}>
            <p className="text-neutral-400 uppercase font-black text-xs tracking-widest">Date</p>
            <p className="font-bold text-lg">{order.orderDate}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl border", isDark ? "bg-neutral-900 border-neutral-700" : "bg-neutral-50 border-neutral-100")}>
           <div>
              <p className="text-[10px] uppercase font-black text-neutral-400 mb-1">{lang.customerName}</p>
              <p className={cn("font-bold", isDark ? "text-white" : "text-neutral-800")}>{order.customerName}</p>
              <p className="text-sm text-neutral-500">{order.customerAddress}</p>
           </div>
           <div className="sm:text-right">
              <p className="text-[10px] uppercase font-black text-neutral-400 mb-1">{lang.phone}</p>
              <p className={cn("font-bold", isDark ? "text-white" : "text-neutral-800")}>{order.customerPhone}</p>
           </div>
        </div>

        {/* Order Table */}
        <div className={cn("overflow-hidden border rounded-xl", isDark ? "border-neutral-700" : "border-neutral-200")}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={cn("text-xs uppercase tracking-widest", isDark ? "bg-neutral-900 text-neutral-400" : "bg-neutral-800 text-white")}>
                <th className="p-3 font-black">{lang.particular}</th>
                <th className="p-3 font-black text-center">{lang.quantity}</th>
                <th className="p-3 font-black text-center">{lang.rate}</th>
                <th className="p-3 font-black text-right">{lang.total}</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", isDark ? "divide-neutral-700" : "divide-neutral-100")}>
              <tr className={isDark ? "text-neutral-300" : "text-neutral-700"}>
                <td className="p-4 font-medium">{order.particular}</td>
                <td className="p-4 text-center font-bold">{order.quantity}</td>
                <td className="p-4 text-center">{formatCurrency(order.rate)}</td>
                <td className={cn("p-4 text-right font-black", isDark ? "text-white" : "text-neutral-900")}>{formatCurrency(order.totalAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex flex-col items-end gap-3 pt-4">
          <div className="w-full max-w-[240px] space-y-2">
            <div className="flex justify-between text-neutral-500 font-medium">
               <span>{lang.total}:</span>
               <span className={isDark ? "text-white" : "text-neutral-800"}>{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-emerald-500 font-medium">
               <span>{lang.advance}:</span>
               <span className="font-bold">-{formatCurrency(order.advanceAmount)}</span>
            </div>
            <div className={cn("flex justify-between text-xl font-black text-rose-500 border-t-2 pt-2", isDark ? "border-neutral-700" : "border-neutral-100")}>
               <span>{lang.due}:</span>
               <span>{formatCurrency(order.dueAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className={cn("space-y-4 pt-10 border-t border-dashed", isDark ? "border-neutral-700" : "border-neutral-200")}>
           <div>
              <p className="text-[10px] uppercase font-black text-neutral-400 mb-1">{lang.amountInWords}</p>
              <p className={cn("text-sm font-bold italic border-b pb-1", isDark ? "text-neutral-300 border-neutral-700" : "text-neutral-700 border-neutral-100")}>
                {numberToWords(order.totalAmount)}
              </p>
           </div>
           
           <div className="grid grid-cols-2 gap-8 text-xs text-neutral-500 font-medium">
              {order.seenDate && (
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-orange-500" />
                  {lang.seenDate}: {order.seenDate} @ {order.seenReminderTime}
                </div>
              )}
              {order.deliveryDate && (
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-blue-500" />
                  {lang.deliveryDate}: {order.deliveryDate} @ {order.deliveryReminderTime}
                </div>
              )}
           </div>
           
           {order.note && (
             <div className={cn("p-3 rounded-lg border italic text-sm transition-colors", isDark ? "bg-neutral-900 border-neutral-700 text-neutral-400" : "bg-neutral-50 border-neutral-100 text-neutral-600")}>
               "{order.note}"
             </div>
           )}
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-12 pt-16">
          <div className={cn("text-center border-t pt-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest h-12 flex flex-col justify-end", isDark ? "border-neutral-700" : "border-neutral-300")}>
            {lang.customerSignature}
          </div>
          <div className={cn("text-center border-t pt-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest h-12 flex flex-col justify-end", isDark ? "border-neutral-700" : "border-neutral-300")}>
            {lang.shopSignature}
          </div>
        </div>

        {/* Watermark/Shop Logo area */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] select-none pointer-events-none text-center">
            <h1 className="text-8xl font-black uppercase whitespace-nowrap rotate-[-15deg]">{settings.shopName}</h1>
            <p className="text-xl font-bold mt-4 tracking-[0.5em]">DEVELOPED BY NAYEEM</p>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, className }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95",
        className
      )}
    >
      {icon}
      {label}
    </button>
  );
}
