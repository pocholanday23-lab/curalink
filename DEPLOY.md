# Deploying Curalink to a Hostinger VPS

The app is a Next.js 16 server app. The database is **Neon** (project "Employee
Database") — you do **not** run Postgres on the VPS. The Neon `production` branch
already has every migration applied and the seed data loaded, so the admin login
(`pocholanday` / `Pocholo40`) works the moment the site is up.

You can run this alongside another app on the same VPS. Keep these unique to
Curalink: **port** (`3001` below), **domain** (`hr.yourdomain.com` below),
**directory** (`/var/www/curalink`), **PM2 name** (`curalink`).

---

## 0. One-time: get the code on GitHub (recommended)

Locally, this repo is already committed. Create an empty GitHub repo, then:

```bash
git remote add origin git@github.com:<you>/curalink.git
git push -u origin main
```

(Alternative without GitHub: `rsync -av --exclude node_modules --exclude .next
--exclude .git ./ user@VPS:/var/www/curalink/`.)

## 1. On the VPS — install the runtime (skip anything already present)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx
sudo npm i -g pm2
```

Node 22 is backward-compatible; your other project will still run on it. If it
pins an older Node, use `nvm` instead and select 22 for this app.

## 2. Get the code + configure

```bash
sudo mkdir -p /var/www/curalink && sudo chown $USER /var/www/curalink
git clone git@github.com:<you>/curalink.git /var/www/curalink
cd /var/www/curalink
cp deploy/.env.example .env
nano .env      # fill in DATABASE_URL, DATABASE_URL_UNPOOLED (from your local
               # .env), a fresh AUTH_SECRET, and AUTH_URL=https://hr.yourdomain.com
```

## 3. Build + start

```bash
npm ci
npm run build          # prisma generate -> migrate deploy (Neon) -> next build
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup            # run the command it prints, once
```

App is now serving on `127.0.0.1:3001`.

## 4. DNS

In Hostinger's DNS for your domain, add an **A record**:
`hr` -> your VPS IP (same IP as the other project).

## 5. Nginx + HTTPS

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/curalink
sudo nano /etc/nginx/sites-available/curalink     # set your real domain
sudo ln -s /etc/nginx/sites-available/curalink /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d hr.yourdomain.com          # free Let's Encrypt cert
```

If `ufw` is active: `sudo ufw allow 'Nginx Full'`.

Visit `https://hr.yourdomain.com` and log in as `pocholanday` / `Pocholo40`.

---

## Updating later

```bash
cd /var/www/curalink
git pull
npm ci
npm run build
pm2 restart curalink
```

## Notes

- **RAM:** each Next app in production uses roughly 150–350 MB. On a 1–2 GB VPS
  already running another Next app, watch `pm2 monit` / `free -m`. `max_memory_restart`
  in the ecosystem file guards against leaks.
- `npm run build` needs the VPS to reach Neon (it runs `prisma migrate deploy`).
- Never commit `.env`; it's git-ignored.
