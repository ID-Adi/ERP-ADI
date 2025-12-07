import { clsx, type ClassValue } from "clsx";

/**
 * Utility function untuk merge class names dengan Tailwind
 * Berguna untuk conditional styling
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
