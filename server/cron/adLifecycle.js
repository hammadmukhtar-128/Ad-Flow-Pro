const cron = require('node-cron');
const { supabase } = require('../db/connect');
const { createNotification } = require('../services/notificationService');

const runAdLifecycleCron = () => {
  // Run every minute (or change to '0 * * * *' for hourly in production)
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const nowISO = now.toISOString();

      // 1. Publish Scheduled Ads
      const { data: readyToPublish, error: publishError } = await supabase
        .from('ads')
        .select('*')
        .eq('status', 'payment_verified')
        .lte('published_at', nowISO);

      
      if (!publishError && readyToPublish) {
        for (let ad of readyToPublish) {
          const durations = { basic: 7, standard: 15, premium: 30 };
          const days = durations[ad.package_type] || 7;
          const expireAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

          await supabase
            .from('ads')
            .update({ status: 'published', expires_at: expiresAt })
            .eq('id', ad.id);

          
          await createNotification(ad.user_id, 'ad_published', `Your ad "${ad.title}" has been automatically published.`);
          console.log(`Cron: Ad ${ad.id} automatically published.`);
        }
      }

      // 2. Expire Ads
      const { data: readyToExpire, error: expireError } = await supabase
        .from('ads')
        .select('*')
        .eq('status', 'published')
        .lte('expires_at', nowISO);


      if (!expireError && readyToExpire) {
        for (let ad of readyToExpire) {
          await supabase
            .from('ads')
            .update({ status: 'expired' })
            .eq('id', ad.id);
          
          await createNotification(ad.user_id, 'ad_expired', `Your ad "${ad.title}" has expired.`);
          console.log(`Cron: Ad ${ad.id} automatically expired.`);
        }
      }

      // 3. Expire Soon Warning (48 hours before)
      const warningThreshold = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
      const { data: expiringSoon, error: warningError } = await supabase
        .from('ads')
        .select('*')
        .eq('status', 'published')
        .lte('expires_at', warningThreshold)
        .gt('expires_at', nowISO)

        .is('expiry_warning_sent', null); // Use a flag to prevent duplicate warnings

      if (!warningError && expiringSoon) {
        for (let ad of expiringSoon) {
          await createNotification(ad.user_id, 'expiring_soon', `Your ad "${ad.title}" will expire in less than 48 hours.`);
          await supabase.from('ads').update({ expiry_warning_sent: true }).eq('id', ad.id);
          console.log(`Cron: Expiry warning sent for Ad ${ad.id}.`);
        }
      }

      // 4. System Health Logs (Requirement 8)
      await supabase.from('system_health_logs').insert([{
        level: 'info',
        message: 'Ad lifecycle cron job executed successfully',
        details: {
          timestamp: nowISO,
          publishedCount: readyToPublish?.length || 0,
          expiredCount: readyToExpire?.length || 0,
          warningsSent: expiringSoon?.length || 0
        }
      }]);

    } catch (error) {
      console.error('Cron job error:', error.message);
      // Attempt to log error to database
      await supabase.from('system_health_logs').insert([{
        level: 'error',
        message: `Cron job failed: ${error.message}`,
        details: { timestamp: new Date().toISOString() }
      }]).catch(() => {});
    }
  });

  console.log('Ad Lifecycle Cron Jobs started.');
};

module.exports = runAdLifecycleCron;

