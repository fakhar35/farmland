# Deploying Dairy Farm Manager to AWS Lightsail + installing on staff phones

Time required: ~45 minutes the first time. Cost: ~$12/month (Lightsail 2 GB)
plus ~$12/year for a domain.

---

## Part 1 — Create the server

1. Sign in at https://lightsail.aws.amazon.com (create an AWS account if
   needed — requires a credit card).
2. **Create instance** →
   - Region: pick the closest to the farm (e.g. Mumbai `ap-south-1` for Pakistan —
     lowest latency; Bahrain `me-south-1` also works).
   - Platform: **Linux/Unix** → Blueprint: **OS Only → Ubuntu 24.04 LTS**.
   - Plan: **$12/month (2 GB RAM, 2 vCPU, 60 GB SSD)**. Do not use the 512 MB/1 GB
     plans — building the Docker images needs ~2 GB.
   - Name it `dairy-farm` → **Create instance**.
3. **Static IP** (so your address never changes):
   Networking tab → **Create static IP** → attach it to `dairy-farm`.
   Write this IP down — call it `YOUR_IP` below.
4. **Open the firewall**: click the instance → **Networking** → IPv4 firewall →
   ensure these rules exist (add the missing ones):
   - SSH, TCP 22 (already there)
   - HTTP, TCP **80**
   - HTTPS, TCP **443**

## Part 2 — Domain (recommended; enables HTTPS)

HTTPS matters here for two reasons: it protects staff passwords on the wire,
and phones only allow full PWA installation ("Add to Home Screen" with
offline support) on HTTPS sites.

1. Buy a domain anywhere (Namecheap, Cloudflare, GoDaddy — ~$10–15/year), or
   use one you own.
2. In the domain's DNS settings add an **A record**:
   - Host/Name: `farm` (or `@` for the bare domain)
   - Value: `YOUR_IP`
   - TTL: default
3. Your app address is then `farm.yourdomain.com`. DNS takes 5–30 minutes to
   propagate. Verify with: `ping farm.yourdomain.com` → should show YOUR_IP.

*(No domain yet? You can deploy with `DOMAIN=:80` and use `http://YOUR_IP`
for testing, then switch later. Phones can browse it but full install +
HTTPS requires the domain.)*

## Part 3 — Install Docker on the server

1. Connect: on the instance page click **Connect using SSH** (browser
   terminal), or from PowerShell:
   `ssh -i path\to\LightsailDefaultKey.pem ubuntu@YOUR_IP`
   (download the key from Lightsail → Account → SSH keys).
2. Run:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl unzip
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker ubuntu
```

3. Log out (`exit`) and reconnect so the docker group takes effect.
   Verify: `docker --version` and `docker compose version` both print versions.

## Part 4 — Upload the app

From PowerShell on your Windows machine (adjust paths):

```powershell
scp -i path\to\LightsailDefaultKey.pem `
  C:\Users\fakha\Downloads\dairy-farm-v4.1-deploy.zip ubuntu@YOUR_IP:~/
```

Then on the server:

```bash
cd ~
unzip -o dairy-farm-v4.1-deploy.zip
cd dairy-farm
```

## Part 5 — Configure

```bash
cp deploy/env.production.example deploy/.env
nano deploy/.env
```

Set:
- `DOMAIN=farm.yourdomain.com` (or `:80` for IP-only testing)
- `POSTGRES_PASSWORD=` a long random password
- `JWT_SECRET=` output of `openssl rand -base64 48`

Save (Ctrl+O, Enter) and exit (Ctrl+X).

> Note: this is a FRESH database in the cloud. Your Windows machine's data
> stays local. To carry it over, see "Migrating your local data" below.

## Part 6 — Launch

```bash
bash deploy/deploy.sh
```

First run takes 5–10 minutes (downloads base images, installs packages,
builds both apps). When it finishes, `docker compose ... ps` should show
db, redis, api, and web all `Up`.

Watch the API start:
```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs -f api
```
Look for the migration list applying, then
`Nest application successfully started`. Ctrl+C to stop watching.

**Open https://farm.yourdomain.com** — Caddy obtains the HTTPS certificate
automatically on the first request (10–30 s). You'll see the login screen.
Register the owner account, create the farm, and you're live.

## Part 7 — Install on staff phones (PWA)

First, in the app: Staff tab → create each worker's account (name, email,
password) and set their tab permissions.

**Android (Chrome):**
1. Open `https://farm.yourdomain.com` in Chrome and log in.
2. Chrome shows an **Install app** banner, or: menu (⋮) → **Add to Home
   screen** → **Install**.
3. The app appears in the app drawer with the milk-drop icon, opens
   full-screen with no browser bar, and keeps the login.

**iPhone (Safari — must be Safari):**
1. Open the URL in Safari and log in.
2. Tap **Share** (square with arrow) → **Add to Home Screen** → **Add**.

**Offline behavior in the field:** the app opens with no signal (cached
shell), and milk/feed entries save locally with a "pending sync" badge, then
upload automatically when coverage returns. Fresh data (dashboards, reports)
still needs a connection.

## Part 8 — Migrating your local data (optional)

Only if you want the records from your Windows machine in the cloud:

```powershell
# On Windows — dump the local database:
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U dairy -h localhost -p 5444 `
  --clean --if-exists -d dairyfarm -f dairyfarm-local.sql
scp -i path\to\key.pem dairyfarm-local.sql ubuntu@YOUR_IP:~/
```

```bash
# On the server — restore into the container (AFTER first launch created the schema):
cd ~/dairy-farm
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml \
  exec -T db psql -U dairy -d dairyfarm < ~/dairyfarm-local.sql
```

Then log in with your existing (local) credentials.

## Part 9 — Nightly backups

```bash
crontab -e
```
Add this line (2 AM daily, keeps 14 days):
```
0 2 * * * cd /home/ubuntu/dairy-farm && POSTGRES_USER=dairy POSTGRES_DB=dairyfarm bash deploy/backup.sh >> backups/backup.log 2>&1
```

Restore from a backup if ever needed:
```bash
gunzip -c backups/dairyfarm_DATE.sql.gz | docker compose --env-file deploy/.env \
  -f deploy/docker-compose.prod.yml exec -T db psql -U dairy -d dairyfarm
```

For extra safety, periodically download a backup to your PC:
```powershell
scp -i key.pem ubuntu@YOUR_IP:~/dairy-farm/backups/dairyfarm_*.sql.gz C:\Backups\
```

## Updating the app later

When you get a new version zip:

```powershell
scp -i key.pem dairy-farm-NEW.zip ubuntu@YOUR_IP:~/
```
```bash
cd ~ && unzip -o dairy-farm-NEW.zip && cd dairy-farm && bash deploy/deploy.sh
```

Migrations apply automatically on API start. Data and certificates persist
in Docker volumes. Staff phones pick up the new version on next open (the
service worker refreshes the shell).

## Troubleshooting

| Symptom | Fix |
|---|---|
| Site unreachable | Lightsail firewall has 80+443 open? DNS A record → static IP? |
| Certificate error / no HTTPS | DOMAIN in deploy/.env matches the DNS name exactly; wait 60 s and retry; `docker compose ... logs web` |
| API container restarting | `docker compose ... logs api` — usually a wrong POSTGRES_PASSWORD after the volume already initialized with another one. Either restore the old password or `docker compose ... down -v` (WIPES DATA) and relaunch |
| Build killed / out of memory | Use the 2 GB plan, or add swap: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |
| Phone won't offer Install | Must be HTTPS (domain set up), and use Chrome on Android / Safari on iOS |

## Security notes

- Postgres and Redis are NOT exposed to the internet — only ports 80/443 are
  open; the databases are reachable solely from the other containers.
- Keep the server patched: `sudo apt-get update && sudo apt-get upgrade -y`
  monthly.
- The JWT_SECRET and POSTGRES_PASSWORD in deploy/.env are the keys to
  everything — don't commit or share them.
