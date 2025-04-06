/**
 * Formats a date to a human-readable format (MM/DD/YYYY)
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formats a date to a human-readable time (HH:MM AM/PM)
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted time
 */
export const formatTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format a date and time as relative time (e.g., "5 minutes ago", "2 hours ago")
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  
  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDay < 7) {
    return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
  } else {
    return formatDate(date);
  }
};

/**
 * Formats a number as currency (USD)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Returns the duration between two dates in minutes
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {string} Formatted duration
 */
export const formatDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 'N/A';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationInMinutes = Math.round((end - start) / (1000 * 60));
  
  if (durationInMinutes < 60) {
    return `${durationInMinutes} min`;
  } else {
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
  }
};

/**
 * Returns a color based on the ride status
 * @param {string} status - Ride status
 * @returns {string} Color hex code
 */
export const getRideStatusColor = (status) => {
  switch (status) {
    case 'requested':
      return '#FF9800'; // Orange
    case 'accepted':
      return '#2196F3'; // Blue
    case 'arrived':
      return '#03A9F4'; // Light Blue
    case 'in_progress':
      return '#9C27B0'; // Purple
    case 'completed':
      return '#4CAF50'; // Green
    case 'cancelled':
      return '#F44336'; // Red
    default:
      return '#757575'; // Grey
  }
};

/**
 * Returns a color based on the verification status
 * @param {string} status - Verification status
 * @returns {string} Color hex code
 */
export const getVerificationStatusColor = (status) => {
  switch (status) {
    case 'verified':
      return '#4CAF50'; // Green
    case 'pending':
      return '#FF9800'; // Orange
    case 'rejected':
      return '#F44336'; // Red
    default:
      return '#757575'; // Grey
  }
};

/**
 * Truncates text with ellipsis if it exceeds the specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 30) => {
  if (!text) return '';
  
  return text.length > maxLength
    ? `${text.substring(0, maxLength)}...`
    : text;
};

/**
 * Formats a phone number as (XXX) XXX-XXXX
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return 'N/A';
  
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if the number is valid
  if (cleaned.length !== 10) {
    return phoneNumber;
  }
  
  // Format as (XXX) XXX-XXXX
  return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
};

/**
 * Formats a distance in miles
 * @param {number} distance - Distance in miles
 * @returns {string} Formatted distance
 */
export const formatDistance = (distance) => {
  if (distance === undefined || distance === null) return 'N/A';
  
  return `${distance.toFixed(1)} mi`;
};

/**
 * Truncate a string if it exceeds the maximum length
 * @param {string} str - The string to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated string with ellipsis if needed
 */
export const truncateString = (str, maxLength = 30) => {
  if (!str) return '';
  
  if (str.length <= maxLength) return str;
  
  return `${str.substring(0, maxLength - 3)}...`;
};

/**
 * Capitalize the first letter of each word in a string
 * @param {string} str - The string to capitalize
 * @returns {string} Capitalized string
 */
export const capitalizeWords = (str) => {
  if (!str) return '';
  
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Formats a ride status to a user-friendly display value
 * @param {string} status - The ride status
 * @returns {string} User-friendly status
 */
export const formatRideStatus = (status) => {
  if (!status) return '';
  
  switch (status) {
    case 'requested':
      return 'Requested';
    case 'accepted':
      return 'Driver Assigned';
    case 'arrived':
      return 'Driver Arrived';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return capitalizeWords(status.replace(/_/g, ' '));
  }
}; 