import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// Add utility function to extract filename from path
export const getFileName = (filePath: string) => {
  return filePath.split("/").pop() || filePath;
};