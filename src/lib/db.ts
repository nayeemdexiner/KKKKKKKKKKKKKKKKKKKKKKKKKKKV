/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Dexie, { Table } from 'dexie';
import { Order } from '../types';

export class AppDatabase extends Dexie {
  orders!: Table<Order>;

  constructor() {
    super('ChittagongDoorDB');
    this.version(1).stores({
      orders: '++id, memoNo, customerName, customerPhone, orderDate, seenDate, deliveryDate, orderStatus, paymentStatus'
    });
  }
}

export const db = new AppDatabase();
