import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge CSS classes.
 * Since we are primarily Vanilla CSS, twMerge handles any edge cases if we decide to sprinkle utility classes later.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
