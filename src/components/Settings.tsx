/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { Language, ShopSettings, AppTheme } from '../types';
import { db } from '../lib/db';
import { 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  Globe, 
  Bell, 
  Store, 
  Phone, 
  MapPin, 
  Lock,
  FileSpreadsheet,
  AlertCircle,
  Volume2,
  Music
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Settings() {
  const context = useContext(AppContext);
  if (!context) return null;
  const { lang, settings, setSettings, currentLanguage } = context;

  const [formData, setFormData] = useState<ShopSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [isTestingAlarm, setIsTestingAlarm] = useState(false);

  const handleTestAlarm = () => {
    setIsTestingAlarm(true);
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1013/1013-preview.mp3');
    audio.play().catch(e => {
      alert("Please interact with the page first to enable sound.");
    });
    setTimeout(() => setIsTestingAlarm(false), 3000);
  };

  const handleSave = () => {
    setSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleExportJSON = async () => {
    const orders = await db.orders.toArray();
    const data = {
      orders,
      settings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ChittagongDoor_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.orders) {
          if (confirm(`Importing ${data.orders.length} orders. Current orders will be kept. Proceed?`)) {
            await db.orders.bulkAdd(data.orders);
            if (data.settings) setSettings(data.settings);
            alert('Import Successful!');
          }
        }
      } catch (error) {
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleExportCSV = async () => {
    const orders = await db.orders.toArray();
    const headers = ['Memo No', 'Date', 'Customer', 'Phone', 'Particular', 'Qty', 'Rate', 'Total', 'Advance', 'Due', 'Seen Date', 'Delivery Date', 'Status', 'Payment'];
    const csvContent = [
      headers.join(','),
      ...orders.map(o => [
        o.memoNo,
        o.orderDate,
        o.customerName,
        o.customerPhone,
        `"${o.particular}"`,
        o.quantity,
        o.rate,
        o.totalAmount,
        o.advanceAmount,
        o.dueAmount,
        o.seenDate,
        o.deliveryDate,
        o.orderStatus,
        o.paymentStatus
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-800">{lang.settings}</h2>
        <button 
          onClick={handleSave}
          className={cn(
            "px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95",
            isSaved ? "bg-emerald-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
          )}
        >
          {isSaved ? <CheckCircle size={20} /> : <Save size={20} />}
          {isSaved ? 'Saved!' : lang.save}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shop Info */}
        <div className="lg:col-span-2 space-y-6">
          <Section title={lang.shopSettings} icon={<Store size={20} className="text-blue-600" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputGroup 
                label={lang.shopName}
                value={formData.shopName}
                onChange={(e: any) => setFormData({ ...formData, shopName: e.target.value })}
                icon={<Store size={16} />}
              />
              <InputGroup 
                label={lang.shopPhone}
                value={formData.shopPhone}
                onChange={(e: any) => setFormData({ ...formData, shopPhone: e.target.value })}
                icon={<Phone size={16} />}
              />
              <div className="sm:col-span-2 space-y-1">
                <label className="text-sm font-medium text-neutral-600 flex items-center gap-1.5 focus-within:text-blue-600 transition-colors">
                  <MapPin size={16} />
                  {lang.shopAddress}
                </label>
                <textarea 
                  value={formData.shopAddress}
                  onChange={(e) => setFormData({ ...formData, shopAddress: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </Section>

          <Section title={lang.defaultTimes} icon={<Bell size={20} className="text-orange-500" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputGroup 
                label={lang.seenTime}
                type="time"
                value={formData.defaultSeenTime}
                onChange={(e: any) => setFormData({ ...formData, defaultSeenTime: e.target.value })}
                dark={settings.theme === AppTheme.DARK}
              />
              <InputGroup 
                label={lang.deliveryTime}
                type="time"
                value={formData.defaultDeliveryTime}
                onChange={(e: any) => setFormData({ ...formData, defaultDeliveryTime: e.target.value })}
                dark={settings.theme === AppTheme.DARK}
              />
            </div>
            
            <div className={cn("mt-6 pt-6 border-t", settings.theme === AppTheme.DARK ? "border-neutral-700" : "border-neutral-100")}>
               <h4 className={cn("text-sm font-bold mb-3 flex items-center gap-2", settings.theme === AppTheme.DARK ? "text-white" : "text-neutral-800")}>
                 <Volume2 size={16} className="text-blue-500" />
                 Alarm Configuration
               </h4>
               <p className="text-xs text-neutral-500 mb-4 italic">The app will play a professional ringtone for your reminders.</p>
               <button 
                onClick={handleTestAlarm}
                className={cn(
                  "w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all active:scale-95",
                  isTestingAlarm ? "bg-orange-500 text-white shadow-orange-500/30" : (settings.theme === AppTheme.DARK ? "bg-neutral-900 border border-neutral-700 text-blue-400" : "bg-blue-50 text-blue-600 shadow-sm")
                )}
               >
                 {isTestingAlarm ? <Music className="animate-spin" size={20} /> : <Volume2 size={20} />}
                 {isTestingAlarm ? "PLAYING TEST TONE..." : "TEST ALARM SOUND"}
               </button>
            </div>
          </Section>

          <Section 
            title={lang.language} 
            icon={<Globe size={20} className="text-blue-500" />}
            dark={settings.theme === AppTheme.DARK}
          >
            <div className="flex gap-4">
              <button 
                onClick={() => setFormData({ ...formData, language: Language.BN })}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all",
                  formData.language === Language.BN ? "bg-blue-50 border-blue-600 text-blue-600" : (settings.theme === AppTheme.DARK ? "bg-neutral-800 border-neutral-700 text-neutral-400" : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300")
                )}
              >
                বাংলা (Bangla)
              </button>
              <button 
                onClick={() => setFormData({ ...formData, language: Language.EN })}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all",
                  formData.language === Language.EN ? "bg-blue-50 border-blue-600 text-blue-600" : (settings.theme === AppTheme.DARK ? "bg-neutral-800 border-neutral-700 text-neutral-400" : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300")
                )}
              >
                English
              </button>
            </div>
          </Section>

          <Section 
            title="Appearance Theme" 
            icon={<Globe size={20} className="text-emerald-500" />}
            dark={settings.theme === AppTheme.DARK}
          >
            <div className="flex gap-4">
              <button 
                onClick={() => setFormData({ ...formData, theme: AppTheme.LIGHT })}
                className={cn(
                  "flex-1 py-4 px-4 rounded-xl border-2 font-bold transition-all flex flex-col items-center gap-2",
                  formData.theme === AppTheme.LIGHT ? "bg-blue-50 border-blue-600 text-blue-600" : "bg-white border-neutral-200 text-neutral-400"
                )}
              >
                <div className="w-full h-8 bg-neutral-100 rounded border border-neutral-200" />
                White Theme
              </button>
              <button 
                onClick={() => setFormData({ ...formData, theme: AppTheme.DARK })}
                className={cn(
                  "flex-1 py-4 px-4 rounded-xl border-2 font-bold transition-all flex flex-col items-center gap-2",
                  formData.theme === AppTheme.DARK ? "bg-blue-900/50 border-blue-600 text-blue-400" : "bg-neutral-800 border-neutral-700 text-neutral-500"
                )}
              >
                <div className="w-full h-8 bg-neutral-900 rounded border border-neutral-700" />
                Black Theme
              </button>
            </div>
          </Section>
        </div>

        {/* Data Management */}
        <div className="space-y-6">
           <Section 
            title="Backup & Restore" 
            icon={<AlertCircle size={20} className="text-rose-500" />}
            dark={settings.theme === AppTheme.DARK}
          >
              <div className="space-y-4">
                <p className={cn("text-xs mb-2 italic p-3 rounded-lg border", settings.theme === AppTheme.DARK ? "bg-neutral-900 border-neutral-800 text-neutral-500" : "bg-neutral-50 border-neutral-100 text-neutral-500")}>
                  Keep your data safe by exporting backup regularly.
                </p>
                <button 
                  onClick={handleExportJSON}
                  className="w-full py-4 bg-neutral-900 border border-neutral-800 text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all font-bold active:scale-[0.98] shadow-sm"
                >
                  <Download size={20} />
                  {lang.exportData}
                </button>
                
                <div className="relative">
                  <input 
                    type="file" 
                    id="import-json" 
                    className="hidden" 
                    accept=".json"
                    onChange={handleImportJSON}
                  />
                  <label 
                    htmlFor="import-json"
                    className={cn(
                      "w-full py-4 border-2 rounded-2xl flex items-center justify-center gap-2 font-bold cursor-pointer active:scale-[0.98] shadow-sm transition-all",
                      settings.theme === AppTheme.DARK ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                    )}
                  >
                    <Upload size={20} />
                    {lang.importData}
                  </label>
                </div>

                <div className={cn("pt-4 border-t", settings.theme === AppTheme.DARK ? "border-neutral-800" : "border-neutral-100")}>
                  <button 
                    onClick={handleExportCSV}
                    className="w-full py-4 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-100 transition-all font-bold active:scale-[0.98]"
                  >
                    <FileSpreadsheet size={20} />
                    {lang.exportCSV}
                  </button>
                </div>
              </div>
           </Section>

           {/* Security PIN Setup */}
           <Section 
            title="Security" 
            icon={<Lock size={20} className="text-emerald-500" />}
            dark={settings.theme === AppTheme.DARK}
          >
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className={cn("text-sm font-medium", settings.theme === AppTheme.DARK ? "text-neutral-400" : "text-neutral-600")}>App Lock PIN (4 Digits)</label>
                  <div className="flex gap-2">
                    <input 
                      type="password"
                      maxLength={4}
                      placeholder="4-digit PIN"
                      value={formData.appLockPin || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, appLockPin: val });
                      }}
                      className={cn(
                        "flex-1 px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono tracking-widest text-center text-xl transition-all",
                        settings.theme === AppTheme.DARK ? "bg-neutral-900 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200"
                      )}
                    />
                    {formData.appLockPin && (
                      <button 
                        onClick={() => setFormData({ ...formData, appLockPin: '' })}
                        className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                        title="Remove PIN"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-400 italic">
                    {formData.appLockPin 
                      ? "Lock is active. You'll need this PIN to open the app." 
                      : "No PIN set. Setup a PIN to protect your order data."}
                  </p>
                </div>
              </div>
           </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, dark, children }: any) {
  return (
    <div className={cn(
      "p-6 rounded-2xl border shadow-sm space-y-4 transition-colors",
      dark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
    )}>
      <h3 className={cn(
        "text-lg font-bold flex items-center gap-2",
        dark ? "text-white" : "text-neutral-800"
      )}>
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function InputGroup({ label, icon, dark, ...props }: any) {
  return (
    <div className="space-y-1">
      <label className={cn(
        "text-sm font-medium flex items-center gap-1.5 focus-within:text-blue-600 transition-colors",
        dark ? "text-neutral-400" : "text-neutral-600"
      )}>
        {icon}
        {label}
      </label>
      <input 
        {...props}
        className={cn(
          "w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all",
          dark ? "bg-neutral-900 border-neutral-700 text-white" : "bg-white border-neutral-200"
        )}
      />
    </div>
  );
}

function CheckCircle(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  );
}
