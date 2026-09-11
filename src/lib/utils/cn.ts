import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names with Tailwind conflict resolution.
 *
 * Every component so far hand-rolls `${base} ${variantClasses[variant]}
 * ${className}` string concatenation, which silently produces broken styles
 * when a caller passes a conflicting utility (e.g. `px-2` on top of the md
 * size preset's `px-4`). twMerge resolves conflicts deterministically so the
 * caller's intent wins, and clsx keeps conditional composition readable.
 *
 * @example
 * cn("px-4 py-2", someCond && "px-2") // => "py-2 px-2"
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
