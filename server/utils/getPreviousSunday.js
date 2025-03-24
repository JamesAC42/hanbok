const getPreviousSunday = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = now.getDate() - day;
    
    // If today is Sunday, return today's date at 00:00:00
    if (day === 0) {
        const sunday = new Date(now);
        sunday.setHours(0, 0, 0, 0);
        return sunday;
    }
    
    const lastSunday = new Date(now.setDate(diff));
    lastSunday.setHours(0, 0, 0, 0);
    return lastSunday;
};

module.exports = getPreviousSunday;