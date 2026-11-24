// resources/js/Utils/formatPrice.js

/**
 * Format a numeric value as a currency string with comma thousands separators.
 *
 * Examples:
 *   1000     → ₱1,000
 *   10000    → ₱10,000
 *   100000   → ₱100,000
 *   1000.5   → ₱1,000.50
 *   1234.99  → ₱1,234.99
 *   0        → ₱0
 *   null     → ₱0
 *
 * @param {number|string|null|undefined} value
 * @param {object} options
 * @param {string} options.symbol     - Currency symbol (default: '₱')
 * @param {number} options.decimals   - Max decimal places (default: 2)
 * @param {boolean} options.alwaysDecimals - Force 2 decimals even for whole numbers (default: false)
 */
export function formatPrice(value, options = {}) {
    const {
        symbol = '₱',
        decimals = 2,
        alwaysDecimals = false,
    } = options;

    const num = Number(value);
    if (!Number.isFinite(num)) return `${symbol}0`;

    const hasFraction = Math.abs(num % 1) > 0;

    return `${symbol}${num.toLocaleString('en-PH', {
        minimumFractionDigits: alwaysDecimals || hasFraction ? decimals : 0,
        maximumFractionDigits: decimals,
    })}`;
}

export default formatPrice;
