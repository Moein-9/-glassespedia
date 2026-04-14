/**
 * GlassesPedia — Daily Auto-Publisher
 *
 * Vercel Cron Job — runs every day at 6am MT (12:00 UTC).
 * Triggers a fresh Vercel deploy via Deploy Hook.
 * The deploy runs `node build-site.js` which only generates
 * articles whose publish date <= today.
 *
 * Setup:
 * 1. Go to Vercel Dashboard > Project > Settings > Git > Deploy Hooks
 * 2. Create a hook named "daily-publish"
 * 3. Copy the URL and set it as env var VERCEL_DEPLOY_HOOK
 */

export default async function handler(req, res) {
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK;

  if (!hookUrl) {
    console.error('VERCEL_DEPLOY_HOOK env var not set');
    return res.status(500).json({ error: 'Deploy hook not configured' });
  }

  try {
    const response = await fetch(hookUrl, { method: 'POST' });
    const data = await response.json();

    console.log('Deploy triggered:', data);

    return res.status(200).json({
      ok: true,
      message: 'Daily publish triggered',
      date: new Date().toISOString(),
      deploy: data
    });
  } catch (error) {
    console.error('Deploy hook failed:', error);
    return res.status(500).json({ error: 'Deploy hook failed', details: error.message });
  }
}
