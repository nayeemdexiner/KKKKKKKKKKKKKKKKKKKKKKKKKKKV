/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum OrderStatus {
  PENDING = 'Pending',
  DELIVERED = 'Delivered',
}

export enum PaymentStatus {
  DUE = 'Due',
  PAID = 'Paid',
}

export enum Language {
  EN = 'English',
  BN = 'Bangla',
}

export interface Order {
  id?: number;
  memoNo: string;
  orderDate: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  particular: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  advanceAmount: number;
  dueAmount: number;
  seenDate: string;
  seenReminderTime: string; // e.g., "09:00"
  deliveryDate: string;
  deliveryReminderTime: string; // e.g., "09:00"
  note: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export enum AppTheme {
  LIGHT = 'light',
  DARK = 'dark',
}

export interface ShopSettings {
  shopName: string;
  shopLogo?: string;
  shopPhone: string;
  shopAddress: string;
  defaultSeenTime: string;
  defaultDeliveryTime: string;
  language: Language;
  theme: AppTheme;
  alarmSound: string;
  appLockPin?: string;
}

export interface AppState {
  orders: Order[];
  settings: ShopSettings;
}
