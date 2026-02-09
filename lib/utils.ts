import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges class names safely using clsx and tailwind-merge.
 * This ensures that Tailwind utility classes don't conflict.
 * 
 * @param inputs - List of class names or conditional class objects
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
