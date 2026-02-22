/**
 * Helper for generating UUIDs.
 * This is especially useful for insecure HTTP contexts on mobile/LAN where crypto.randomUUID is undefined.
 */
export const generateId = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback UUID generation
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};
