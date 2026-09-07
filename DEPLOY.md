# Putting Curalink online on your Hostinger VPS — step by step

This is written for someone who has never deployed a website. Follow it top to
bottom. Every command is something you **type and press Enter**. After most
commands there's a "You should see…" note so you know it worked.

The app's database lives on **Neon** (cloud). You do **not** install a database
on the VPS. Neon already has all the data, so once the site is up you can log in
right away as `pocholanday` / `Pocholo40`.

You already run another app on this VPS. That's fine. We keep four things
different for this app so they don't collide:

| Thing | This app uses |
| --- | --- |
| Port (a numbered "door") | **3001** |
| Web address | a **subdomain**, e.g. `hr.yourdomain.com` |
| Folder on the server | `/var/www/curalink` |
| Process name | `curalink` |

---

## Before you start — gather these

1. **Your VPS login details.** In Hostinger: hPanel → **VPS** → your server →
   note the **IP address** (looks like `123.45.67.89`) and the **root
   password** (or set one under *Settings → Root password*).
2. **A domain in Hostinger** (or one whose DNS Hostinger controls). We'll add a
   subdomain to it.
3. **A GitHub account.** Free — sign up at https://github.com if you don't have
   one. (There's a no-GitHub alternative in the appendix, but GitHub makes
   future updates one command.)
4. **Your app's secret values.** Open this file on your PC in Notepad:
   `C:\Users\pocho\projects\timesheet-app\.env`
   You'll copy two long lines from it later: `DATABASE_URL` and
   `DATABASE_URL_UNPOOLED`.

---

## Step 1 — Put the code on GitHub (do this on your Windows PC)

1a. Go to https://github.com/new
- **Repository name:** `curalink`
- Leave it **Private**
- **Do NOT** tick "Add a README" / "Add .gitignore" / "Add license"
- Click **Create repository**

1b. GitHub now shows a page with commands. Ignore them. Instead, open **PowerShell**
in your project folder and run these three (replace `YOUR-USERNAME`):

```powershell
cd C:\Users\pocho\projects\timesheet-app
git remote add origin https://github.com/YOUR-USERNAME/curalink.git
git push -u origin main
```

A browser window may pop up asking you to sign in to GitHub — do that.

**You should see:** `branch 'main' set up to track 'origin/main'.` and a list of
files being written. Refresh the GitHub page — your files are there now.

---

## Step 2 — Open a terminal on your VPS

Easiest way (no extra software): Hostinger hPanel → **VPS** → your server →
**Browser terminal** (sometimes just "Terminal"). A black window opens and you're
logged in as `root`.

*(Alternative: on Windows, open **Windows Terminal** and run
`ssh root@YOUR-VPS-IP`, then type the root password. Nothing shows while you type
the password — that's normal. Press Enter.)*

From here, every command is typed into **this VPS terminal**, not your PC.

---

## Step 3 — See what's already installed

```bash
node -v
```

- **If it prints `v20.x.x` or `v22.x.x` or higher** → good, skip Step 4.
- **If it prints `v18` or lower, or "command not found"** → do Step 4.

Also check what port your other app uses so we don't clash (3001 is almost
certainly free, but to be sure):

```bash
sudo ss -tlnp | grep -E ':(3000|3001|3002)'
```

If you see `:3001` in the output, tell me — we'll pick another number. If not,
`3001` is free. Continue.

---

## Step 4 — Install Node.js 22 (only if Step 3 said you need it)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
```

**You should see:** `v22.x.x`.

Node 22 also runs older apps fine, so your other project keeps working. (If your
other project is pinned to an exact old Node version and breaks, stop and tell me
— we'd use a per-app version manager instead.)

Also make sure git and nginx are present:

```bash
sudo apt-get install -y git nginx
```

---

## Step 5 — Download the app onto the VPS

```bash
sudo mkdir -p /var/www/curalink
sudo chown $USER:$USER /var/www/curalink
git clone https://github.com/YOUR-USERNAME/curalink.git /var/www/curalink
cd /var/www/curalink
```

It will ask for your GitHub username and a **password**. GitHub no longer accepts
your account password here — you need a **Personal Access Token**:
- On your PC browser: https://github.com/settings/tokens → **Generate new token
  (classic)** → tick the **`repo`** box → **Generate** → copy the token
  (starts with `ghp_...`).
- Paste that as the "password" in the VPS terminal.

**You should see:** `Resolving deltas: 100% ... done.` and you're now inside
`/var/www/curalink` (your prompt shows the folder).

---

## Step 6 — Create the secret settings file (`.env`)

```bash
nano .env
```

A simple text editor opens. Paste this in, then fill the blanks:

```
DATABASE_URL="PASTE FROM YOUR PC .env"
DATABASE_URL_UNPOOLED="PASTE FROM YOUR PC .env"
AUTH_SECRET="RUN THE COMMAND BELOW AND PASTE THE RESULT"
AUTH_URL="https://hr.yourdomain.com"
AUTH_TRUST_HOST="true"
```

- `DATABASE_URL` and `DATABASE_URL_UNPOOLED`: copy the exact lines from
  `C:\Users\pocho\projects\timesheet-app\.env` on your PC (open it in Notepad).
- `AUTH_URL`: use the subdomain you'll create in Step 9 (keep the `https://`).
- For `AUTH_SECRET`, open a **second** VPS terminal tab (or press `Ctrl+O`,
  `Enter`, `Ctrl+X` to save and exit nano first), run:
  ```bash
  openssl rand -base64 33
  ```
  Copy the output and put it between the quotes for `AUTH_SECRET`. Then re-open
  `nano .env` if you'd exited.

Save and close nano: **`Ctrl+O`**, **`Enter`**, then **`Ctrl+X`**.

Check it saved:

```bash
cat .env
```

You should see your five lines with real values (no "PASTE FROM…" left over).

---

## Step 7 — Build the app

```bash
npm ci
npm run build
```

`npm ci` installs the code libraries (takes 1–3 minutes). `npm run build`
generates the database client, applies any database updates to Neon, and compiles
the site (1–3 minutes).

**You should see:** a table of routes ending with lines like
`✓ Compiled successfully` and `○ (Static) / ƒ (Dynamic)`. No red `Error` lines.

*If it fails with a database error:* the VPS couldn't reach Neon — check your
`DATABASE_URL` values in `.env` for typos, then run `npm run build` again.

---

## Step 8 — Start the app and keep it running

Install PM2 (a "babysitter" that restarts the app if it crashes or the server
reboots):

```bash
sudo npm install -g pm2
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup
```

`pm2 startup` prints **one command** starting with `sudo env PATH=...`. Copy that
whole line, paste it, press Enter.

Check the app is alive:

```bash
pm2 status
curl -I http://localhost:3001
```

**You should see:** in `pm2 status`, a row named `curalink` with status
`online`. From `curl`, `HTTP/1.1 307 Temporary Redirect` (it's redirecting to the
login page — that's correct).

Your other app is untouched and still in the list.

---

## Step 9 — Create the subdomain and point it at the VPS

In Hostinger hPanel:
1. Go to **Domains** → your domain → **DNS / Nameservers** (or **DNS Zone**).
2. Add a new record:
   - **Type:** `A`
   - **Name / Host:** `hr` (this makes `hr.yourdomain.com`)
   - **Points to / Value:** your VPS IP address (the same `123.45.67.89`)
   - **TTL:** leave default
3. Save.

DNS can take anywhere from 1 minute to a couple of hours to spread. Check from
the VPS:

```bash
dig +short hr.yourdomain.com
```

When that prints your VPS IP, you're ready for the next step. (If it prints
nothing, wait and try again.)

---

## Step 10 — Set up Nginx (the "traffic director")

Nginx listens on the normal web ports (80/443) and forwards `hr.yourdomain.com`
to your app on port 3001. It leaves your other site's config alone.

```bash
sudo cp /var/www/curalink/deploy/nginx.conf.example /etc/nginx/sites-available/curalink
sudo nano /etc/nginx/sites-available/curalink
```

In the editor, change **`hr.yourdomain.com`** (appears once) to your real
subdomain. Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

Turn it on:

```bash
sudo ln -s /etc/nginx/sites-available/curalink /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**You should see:** from `nginx -t`, `syntax is ok` and `test is successful`.

Now visit `http://hr.yourdomain.com` in your browser — you should reach the
Curalink login page (no padlock yet; that's Step 11).

---

## Step 11 — Turn on HTTPS (the padlock)

The app's login **requires** HTTPS, so this step is not optional.

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d hr.yourdomain.com
```

Answer the prompts:
- Enter your email (for renewal reminders).
- Agree to the terms: `Y`.
- Newsletter: `N` (or `Y`, your choice).

**You should see:** `Successfully received certificate` and
`Congratulations! You have successfully enabled HTTPS`. Certbot also sets up
automatic renewal — you don't have to think about it again.

If your VPS has a firewall (`ufw`) turned on and the browser can't reach the
site, run:

```bash
sudo ufw allow 'Nginx Full'
```

---

## Step 12 — Open it and log in

Go to **`https://hr.yourdomain.com`** — you should see a padlock and the login
page. Sign in:

- Username: `pocholanday`
- Password: `Pocholo40`

You're live. 🎉

---

## Putting new changes online later

When we change the code, on your PC:

```powershell
cd C:\Users\pocho\projects\timesheet-app
git add -A
git commit -m "describe the change"
git push
```

Then on the VPS:

```bash
cd /var/www/curalink
git pull
npm ci
npm run build
pm2 restart curalink
```

The site is briefly unavailable during `pm2 restart` (a second or two).

---

## If something goes wrong

| Symptom | What to run / check |
| --- | --- |
| See the app's logs | `pm2 logs curalink` (press `Ctrl+C` to stop watching) |
| App not `online` in `pm2 status` | `pm2 logs curalink --lines 50` — read the error near the bottom |
| `502 Bad Gateway` in the browser | App isn't running on 3001. `pm2 restart curalink`, then `curl -I http://localhost:3001` |
| Login says "Configuration" / immediately errors | `AUTH_URL` in `.env` must exactly match the `https://…` address; `AUTH_TRUST_HOST="true"` must be present. Fix, then `pm2 restart curalink` |
| Changes not showing after `git pull` | You forgot `npm run build` before `pm2 restart curalink` |
| Ran out of memory (`pm2 status` shows lots of restarts) | Two Node apps on a small VPS. Check `free -m`. Tell me and we'll trim memory use |

---

## Appendix — quick command reference

```bash
# first deploy
sudo mkdir -p /var/www/curalink && sudo chown $USER:$USER /var/www/curalink
git clone https://github.com/YOU/curalink.git /var/www/curalink && cd /var/www/curalink
cp deploy/.env.example .env && nano .env      # fill in real values
npm ci && npm run build
sudo npm i -g pm2
pm2 start deploy/ecosystem.config.js && pm2 save && pm2 startup
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/curalink
sudo nano /etc/nginx/sites-available/curalink  # set your subdomain
sudo ln -s /etc/nginx/sites-available/curalink /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d hr.yourdomain.com

# every update after that
cd /var/www/curalink && git pull && npm ci && npm run build && pm2 restart curalink
```

## Appendix — no GitHub? Copy the files directly

From your PC (needs the free tool `rsync`, or use Hostinger's File Manager to
upload a zip of the folder **excluding** `node_modules`, `.next`, `.git`):

```powershell
# with Git Bash / WSL installed:
rsync -av --exclude node_modules --exclude .next --exclude .git `
  "C:/Users/pocho/projects/timesheet-app/" root@YOUR-VPS-IP:/var/www/curalink/
```

Then continue from Step 6. For updates you re-run the same `rsync` and then
`npm ci && npm run build && pm2 restart curalink` on the VPS.
