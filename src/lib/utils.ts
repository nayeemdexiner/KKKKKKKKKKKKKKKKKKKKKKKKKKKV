/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
}

export function numberToWords(num: number): string {
  // Simple implementation for demo purposes
  // In a real app, use a library like 'number-to-words'
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  function convertLessThanThousand(n: number): string {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 10 && n <= 19) {
      result += teens[n - 10] + ' ';
    } else {
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        result += ones[n] + ' ';
      }
    }
    return result;
  }

  let result = '';
  if (num >= 100000) {
    result += convertLessThanThousand(Math.floor(num / 100000)) + 'Lakh ';
    num %= 100000;
  }
  if (num >= 1000) {
    result += convertLessThanThousand(Math.floor(num / 1000)) + 'Thousand ';
    num %= 1000;
  }
  result += convertLessThanThousand(num);
  
  return result.trim() + ' Taka Only';
}
