/**
 * Utility functions for handling dates strictly as YYYY-MM-DD strings.
 * This avoids all timezone issues associated with the Date object.
 */

// Returns today's date as 'YYYY-MM-DD' based on local time
export const getTodayString = (): string => {
    // We use a simple trick: Create date, subtract timezone offset, slice ISO.
    // OR simpler: construct manually to avoid any hidden UTC conv.
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Formats 'YYYY-MM-DD' to 'DD/MM/YYYY' for display
export const formatDateBR = (dateStr: string): string => {
    if (!dateStr || dateStr.length !== 10) return dateStr;
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

// Gets the current year as a string 'YYYY'
export const getCurrentYear = (): string => {
    return String(new Date().getFullYear());
};

// Helper to compare dates strings safely
// Returns: negative if a < b, positive if a > b, 0 if equal
export const compareDateStrings = (a: string, b: string): number => {
    return a.localeCompare(b);
};

// Calculates a future date string from a given date string
export const addDaysStr = (dateStr: string, days: number): string => {
    const [year, month, day] = dateStr.split('-').map(Number);
    // Create date object set to NOON to safely add days without DST issues
    const d = new Date(year, month - 1, day, 12, 0, 0); 
    d.setDate(d.getDate() + days);
    
    // Convert back manually
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
};
