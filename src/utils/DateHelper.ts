export const DateHelper = {
    /**
     * Returns a formatted string in YYYY-MM-DD format from the given date
     *
     * @param {Date} date The date to generate the date string from
     * @return {string} A formatted date string in YYYY-MM-DD format
     */
    formatYYYYMMDD: (date?: Date): string => {
        if (!date) return "";

        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const yyyy = date.getFullYear();

        return `${yyyy}-${mm}-${dd}`;
    }
}
