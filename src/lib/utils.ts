import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { VerdictType } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

export function formatTime(timestamp: Date | string): string {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function getVerdictColor(verdict: VerdictType): string {
    switch (verdict) {
        case VerdictType.TRUE:
            return "bg-green-100 text-green-800";
        case VerdictType.FALSE:
            return "bg-red-100 text-red-800";
        case VerdictType.PARTIALLY_TRUE:
            return "bg-yellow-100 text-yellow-800";
        case VerdictType.MISLEADING:
            return "bg-orange-100 text-orange-800";
        case VerdictType.UNVERIFIABLE:
            return "bg-gray-100 text-gray-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
} 