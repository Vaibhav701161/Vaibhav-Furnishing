/**
 * Utility functions for the application
 */

/**
 * Format a date string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(SHOP_CONFIG.currency.locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format a number as currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return SHOP_CONFIG.currency.code + ' ' + parseFloat(amount).toFixed(2);
}

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Get a DOM element by ID with error handling
 * @param {string} id - Element ID
 * @param {string} [errorMessage] - Custom error message
 * @returns {HTMLElement|null} Element or null if not found
 */
function getElementByIdSafe(id, errorMessage) {
    const element = document.getElementById(id);
    if (!element && errorMessage) {
        console.error(errorMessage || `Element with ID '${id}' not found`);
    }
    return element;
}

/**
 * Check if a value is empty (null, undefined, empty string, or NaN)
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
function isEmpty(value) {
    return (
        value === null ||
        value === undefined ||
        (typeof value === 'string' && value.trim() === '') ||
        (typeof value === 'number' && isNaN(value))
    );
}

/**
 * Check if a value is a valid number
 * @param {*} value - Value to check
 * @param {object} options - Validation options
 * @param {number} [options.min] - Minimum allowed value
 * @param {number} [options.max] - Maximum allowed value
 * @returns {boolean} True if valid
 */
function isValidNumber(value, options = {}) {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    if (options.min !== undefined && num < options.min) return false;
    if (options.max !== undefined && num > options.max) return false;
    return true;
}

/**
 * Safe JSON parse with error handling
 * @param {string} str - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed object or default value
 */
function safeJsonParse(str, defaultValue = null) {
    try {
        // Handle null or undefined input
        if (str === null || str === undefined) {
            console.log('safeJsonParse: Input is null or undefined, returning default value');
            return defaultValue;
        }
        
        // Handle empty string
        if (str === '') {
            console.log('safeJsonParse: Input is empty string, returning default value');
            return defaultValue;
        }
        
        // Try to parse
        const parsed = JSON.parse(str);
        
        // Handle null parsed result
        if (parsed === null) {
            console.log('safeJsonParse: Parsed result is null, returning default value');
            return defaultValue;
        }
        
        return parsed;
    } catch (error) {
        console.error('Error parsing JSON:', error);
        console.log('Failed JSON string:', str);
        return defaultValue;
    }
}

/**
 * Get current date in ISO format
 * @returns {string} ISO date string
 */
function getCurrentISODate() {
    return new Date().toISOString();
}

/**
 * Capitalize the first letter of a string
 * @param {string} string - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Create a simple toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of message (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, type = 'info', duration = 3000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
} 