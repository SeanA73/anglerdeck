# AnglerDeck Deployment Guide

Deployment guide for AnglerDeck (anglerdeck.com), hosted on Hostinger VPS.

**Last updated:** 6 July 2026 (Phase 8 initial deployment)

---

## Infrastructure

- **VPS:** Hostinger, IP `72.60.42.216`, hostname `srv977654`
- **OS:** Ubuntu 24.04 LTS
- **Web server:** nginx 1.24.0
- **Node.js:** 20.19.5
- **Domain:** anglerdeck.com (DNS at Hostinger, A record → VPS IP)
- **SSL:** Let's Encrypt via Certbot, auto-renewing
- **Cert expiry:** 2026-10-04 (auto-renewed via cron)

## File locations on VPS

- **App root:** `/var/www/anglerdeck/`
- **Built output (served by nginx):** `/var/www/anglerdeck/dist/`
- **Production env vars:** `/var/www/anglerdeck/.env.production` (chmod 600, DO NOT commit)
- **nginx config:** `/etc/nginx/sites-available/anglerdeck` (symlinked to `sites-enabled/`)
- **SSL cert:** `/etc/letsencrypt/live/anglerdeck.com/`
- **Deploy SSH key:** `/root/.ssh/anglerdeck_deploy` (Ed25519, read-only deploy key for GitHub)

## SSH access

```bash
ssh root@72.60.42.216
```

## Deploy new code (standard workflow)

**On your local Windows machine:**

1. Commit and push your changes:
```powershell
   cd C:\Users\shadi\OneDrive\Desktop\projects\anglerdeck
   git add .
   git commit -m "your message"
   git push origin main
```

**On the VPS:**

2. SSH in and pull + rebuild:
```bash
   ssh root@72.60.42.216
   cd /var/www/anglerdeck
   git pull origin main
   npm ci
   npm run build
```

   - `npm ci` only needed if `package.json` or `package-lock.json` changed
   - `npm run build` produces `dist/` which nginx serves immediately, no restart needed

3. Verify the change actually built, on the VPS itself — **not** by visiting
   `https://anglerdeck.com`. Cloudflare, the PWA service worker and the
   browser cache all sit between you and the live `dist/`, so a browser check
   can pass or fail for reasons that have nothing to do with this deploy. Use
   `grep` against `dist/` for prerendered/build output, and an incognito
   window only if you need to see the rendered UI. See CLAUDE.md's Deploy
   section for the full caching writeup.

**No nginx restart or PM2 command is needed for deploys** — nginx serves the
`dist/` folder. Rebuilding is **not** atomic: `vite build` clears and rewrites
`dist/` in place, so a build that dies partway (seen in practice — see
CLAUDE.md) leaves the live site serving a broken shell until the next
successful build. Treat a failed build on the VPS as a live incident, not
just local noise.

## Rollback

If a deploy breaks things, roll back on the VPS:

```bash
cd /var/www/anglerdeck
git log --oneline -5           # find the last known-good commit hash
git checkout <good-commit-hash>
npm ci
npm run build
```

Then when the fix is ready, `git checkout main` and redeploy normally.

## Environment variables

Production values live in `/var/www/anglerdeck/.env.production` on the VPS.

**Never commit this file to git.** Never paste its contents into logs, emails, chats, or docs.

To edit:

```bash
cd /var/www/anglerdeck
nano .env.production
# ... edit ...
# Ctrl+O, Enter, Ctrl+X to save
npm run build   # rebuild so new env values get baked in
```

**Required vars** (as of Phase 8):
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY
- VITE_SITE_URL
- VITE_STRIPE_PUBLISHABLE_KEY
- VITE_STRIPE_PRICE_PRO_MONTHLY
- VITE_STRIPE_PRICE_PRO_YEARLY
- VITE_STRIPE_PRICE_ELITE_MONTHLY
- VITE_STRIPE_PRICE_ELITE_YEARLY

**AdSense vars** (publisher ID and slot IDs are public — they ship in the page source):
- VITE_ADSENSE_CLIENT_ID=ca-pub-2356680512865218
- VITE_ADSENSE_SLOT_SPOTS=6021548634
- VITE_ADSENSE_SLOT_SPOT_DETAIL=4604405042
- VITE_ADSENSE_SLOT_COMMUNITY=1087831864

⚠️ **Auto ads must stay OFF for anglerdeck.com in the AdSense console.** The
AdSense loader in `index.html` only loads the library; ads render solely where
`<AdBanner>` places them, and that component hides ads from Pro and Elite
subscribers. Enabling Auto ads would let Google inject ads anywhere — including
for paying users who were promised an ad-free experience.

`public/ads.txt` authorises Google to sell this inventory. Do not remove it.

Secret keys (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, OPENAI_API_KEY) live in Supabase Edge Function Secrets, NOT in this file.

## SSL certificate renewal

Certbot auto-renews via systemd timer. No manual action needed.

To check renewal status:

```bash
certbot certificates
systemctl status certbot.timer
```

To force a renewal test (dry run):

```bash
certbot renew --dry-run
```

## Nginx config

The site config is at `/etc/nginx/sites-available/anglerdeck`. Key details:

- **Server names:** anglerdeck.com and www.anglerdeck.com
- **SPA routing fallback:** `try_files $uri $uri/ /index.html;` (handles React Router)
- **Asset caching:** `/assets/*` cached for 1 year (Vite content-hashes filenames)
- **HTTP → HTTPS redirect:** managed by Certbot in the second server block
- **Security headers:** X-Frame-Options, X-Content-Type-Options, Referrer-Policy

To edit nginx config:

```bash
sudo nano /etc/nginx/sites-available/anglerdeck
sudo nginx -t                       # test config
sudo systemctl reload nginx         # apply if test passed
```

**Never reload nginx without running `nginx -t` first.** Broken config → nginx refuses to start → all sites on this VPS go down.

## Other sites on this VPS

⚠️ This VPS also hosts:

- **mobiletoolsbox.com** — Sean's other project (Node.js + Express, PM2, port 5000)
- **aliyehluxeskinmakeup.com** — friend's site

Never modify their configs unless intentionally. `nginx -t` catches most cross-site issues.

## Monitoring

- **UptimeRobot** monitors anglerdeck.com every 5 minutes. Alerts sent to shadidawizz73@gmail.com if the site returns errors or times out.
- **Sentry:** deferred (Phase 6.1). Add before any paid marketing push.

## Troubleshooting

**Site returns 502 Bad Gateway:**
Nginx running but backend not responding. For AnglerDeck (static site), this usually means `dist/` folder is missing or the build failed. Rebuild:
```bash
cd /var/www/anglerdeck && npm run build
```

**Site returns 404 on some routes but home page works:**
Nginx SPA fallback not working. Verify `try_files $uri $uri/ /index.html;` line still exists in nginx config. Reload nginx.

**Site loads but data doesn't (spots blank, auth broken):**
Env vars not baked into the build. Check `.env.production` exists and rebuild.

**Certificate expired warning:**
Certbot renewal failed. Check:
```bash
systemctl status certbot.timer
certbot certificates
certbot renew
```

**Nginx won't start after edit:**
`sudo nginx -t` shows the syntax error. Fix and re-test before reload.