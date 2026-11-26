import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

// Teach the class merger that the custom depth shadows replace one another.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: [
        {
          shadow: [
            "depth-sm", "depth", "depth-lg", "press", "press-down",
            "press-brand", "press-brand-down", "press-danger",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM d, yyyy');
}

export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'lead':
      return 'bg-slate-100 text-slate-700';
    case 'qualified':
      return 'bg-blue-100 text-blue-800';
    case 'proposal':
      return 'bg-amber-100 text-amber-800';
    case 'closed-won':
      return 'bg-emerald-100 text-emerald-800';
    case 'closed-lost':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case 'closed-won':
      return 'Won';
    case 'closed-lost':
      return 'Lost';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}
