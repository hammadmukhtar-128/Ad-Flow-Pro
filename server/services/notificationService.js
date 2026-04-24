/**
 * Notification Service for AdFlow Pro
 * Handles database-driven notifications
 */

const { supabase } = require('../db/connect');

/**
 * Create a new notification for a user
 * @param {string} userId - ID of the user to notify
 * @param {string} type - Type of notification (status_change, payment, expiry, etc.)
 * @param {string} message - Notification content
 * @returns {Promise} 
 */
const createNotification = async (userId, type, message) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          type,
          message,
          is_read: false
        }
      ]);
    
    if (error) {
      console.error('[NOTIFICATION SERVICE] Error:', error.message);
    }
    return data;
  } catch (err) {
    console.error('[NOTIFICATION SERVICE] Exception:', err.message);
  }
};

module.exports = {
  createNotification
};
