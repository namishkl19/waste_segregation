/**
 * Calculates the overall fill level of a waste bin and determines if it needs emptying
 * @param {number} organicLevel - Fill percentage of organic section (0-100)
 * @param {number} nonRecyclableLevel - Fill percentage of non-recyclable section (0-100)
 * @param {number} hazardousLevel - Fill percentage of hazardous section (0-100)
 * @returns {Object} Result containing overall fill level and alert status
 */
function calculateBinFillLevel(organicLevel, nonRecyclableLevel, hazardousLevel) {
    // Validate input ranges
    const levels = [organicLevel, nonRecyclableLevel, hazardousLevel];
    if (levels.some(level => level < 0 || level > 100)) {
        throw new Error('Fill levels must be between 0 and 100');
    }

    // Calculate overall fill level
    const overallFill = levels.reduce((sum, level) => sum + level, 0) / 3;
    
    // Check if bin needs emptying (≥ 75% full)
    const isOver75 = overallFill >= 75;
    
    // Trigger alert if needed
    let alertTriggered = false;
    if (isOver75) {
        console.log(`⚠️ WARNING: Bin is ${Math.round(overallFill)}% full and needs emptying!`);
        alertTriggered = true;
    }

    return {
        overallFill: Math.round(overallFill * 10) / 10, // Round to 1 decimal place
        isOver75,
        alertTriggered
    };
}

module.exports = { calculateBinFillLevel };