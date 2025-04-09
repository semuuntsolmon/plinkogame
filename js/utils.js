/**
 * Utility functions for the Plinko game
 */
const Utils = {
    /**
     * Generate a random number between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} - Random number
     */
    random: function(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    /**
     * Calculate binomial coefficient C(n,k)
     * @param {number} n - Total number of items
     * @param {number} k - Number of items to choose
     * @returns {number} - Binomial coefficient
     */
    binomialCoefficient: function(n, k) {
        if (k < 0 || k > n) return 0;
        if (k === 0 || k === n) return 1;
        
        let result = 1;
        for (let i = 1; i <= k; i++) {
            result *= (n + 1 - i) / i;
        }
        
        return Math.round(result);
    },
    
    /**
     * Format a number as currency
     * @param {number} amount - Amount to format
     * @returns {string} - Formatted amount
     */
    formatCurrency: function(amount) {
        return amount.toFixed(2);
    },
    
    /**
     * Detect if the device is mobile
     * @returns {boolean} - True if mobile device
     */
    isMobile: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    /**
     * Save data to localStorage
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     */
    saveToStorage: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    },
    
    /**
     * Load data from localStorage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if key not found
     * @returns {any} - Retrieved value or default
     */
    loadFromStorage: function(key, defaultValue) {
        try {
            const storedValue = localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : defaultValue;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return defaultValue;
        }
    },
    
    /**
     * Debounce function to limit how often a function is called
     * @param {Function} func - Function to debounce
     * @param {number} wait - Milliseconds to wait
     * @returns {Function} - Debounced function
     */
    debounce: function(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    },
    
    /**
     * Get multiplier color based on value
     * @param {number} value - Multiplier value
     * @returns {string} - CSS color
     */
    getMultiplierColor: function(value) {
        if (value >= 100) return '#e74c3c'; // Red
        if (value >= 10) return '#e67e22';  // Orange
        if (value >= 2) return '#f1c40f';   // Yellow
        return '#2ecc71';                   // Green
    },
    
    /**
     * Calculate probability for a path in Pascal's triangle
     * @param {number} rows - Number of rows
     * @param {number} position - Position in bottom row
     * @returns {number} - Probability
     */
    calculatePathProbability: function(rows, position) {
        return this.binomialCoefficient(rows, position) / Math.pow(2, rows);
    },
    
    /**
     * Generate multiplier values based on risk level and row count
     * @param {string} riskLevel - Risk level (low, medium, high)
     * @param {number} slots - Number of slots
     * @returns {Array} - Array of multipliers
     */
    generateMultipliers: function(riskLevel, slots) {
        const multipliers = [];
        const centerIndex = Math.floor(slots / 2);
        
        // Different multiplier distributions based on risk level
        const multiplierSets = {
            low: {
                min: 0.2,
                max: 9,
                curve: 1.5
            },
            medium: {
                min: 0.3,
                max: 25,
                curve: 2.5
            },
            high: {
                min: 0.2,
                max: 1000,
                curve: 4
            }
        };
        
        const { min, max, curve } = multiplierSets[riskLevel];
        
        // Generate multipliers based on position and risk level
        for (let i = 0; i < slots; i++) {
            // Calculate distance from center (normalized to 0-1)
            const distanceFromCenter = Math.abs(i - centerIndex) / centerIndex;
            
            let multiplier;
            if (riskLevel === 'high' && (i === 0 || i === slots - 1)) {
                // Extreme positions for high risk get highest values
                multiplier = 1000;
            } else if (riskLevel === 'high' && (i === 1 || i === slots - 2)) {
                // Near-extreme positions for high risk
                multiplier = 130;
            } else if (riskLevel === 'high' && (i === 2 || i === slots - 3)) {
                // Near-extreme positions for high risk
                multiplier = 26;
            } else {
                // Distribution formula
                multiplier = min + (max - min) * Math.pow(distanceFromCenter, curve);
                
                // Round to nearest standard value
                if (multiplier > 10) multiplier = Math.round(multiplier);
                else if (multiplier > 2) multiplier = Math.round(multiplier * 2) / 2;
                else multiplier = Math.round(multiplier * 10) / 10;
            }
            
            // Edge cases for very specific positions
            if (riskLevel === 'high') {
                if (i >= 4 && i <= slots - 5) {
                    if (Math.abs(i - centerIndex) <= 1) {
                        multiplier = 0.2;
                    } else if (Math.abs(i - centerIndex) <= 3) {
                        multiplier = 2;
                    }
                }
            }
            
            multipliers.push(multiplier);
        }
        
        return multipliers;
    }
};
