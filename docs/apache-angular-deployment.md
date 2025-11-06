# Apache + Angular Deployment Guide

This guide describes how to install and configure an Apache web server to host the Angular frontend located in `frontend/web`, and how to redeploy new builds.

## 1. Prerequisites
- Debian/Ubuntu environment with root access (tested on Debian bookworm).
- Node.js 20.x and npm (already available in this repo's development image).
- Existing Angular project under `frontend/web`.

## 2. Apache Installation
```bash
apt-get update
apt-get install -y apache2
```

## 3. Create a Dedicated Document Root
```bash
mkdir -p /var/www/ethik-angular
chown -R www-data:www-data /var/www/ethik-angular
```

## 4. Apache Configuration
1. **Ports** – Port 80 is occupied by nginx on this machine, so Apache is configured to listen on `8080`. Adjust `/etc/apache2/ports.conf`:
   ```apache
   Listen 8080
   ```

2. **VirtualHost** – Virtual host definition (`/etc/apache2/sites-available/ethik-angular.conf`):
   ```apache
   <VirtualHost *:8080>
       ServerName ethik.local
       ServerAdmin webmaster@localhost
       DocumentRoot /var/www/ethik-angular

       <Directory /var/www/ethik-angular>
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>

       ErrorLog ${APACHE_LOG_DIR}/ethik-angular-error.log
       CustomLog ${APACHE_LOG_DIR}/ethik-angular-access.log combined
   </VirtualHost>
   ```

3. **Site Enablement**
   ```bash
   a2dissite 000-default.conf
   a2ensite ethik-angular.conf
   apachectl configtest
   apachectl -k start            # or -k restart if already running
   ```

   If nginx is removed or port 80 becomes available, update `ports.conf` and the `<VirtualHost>` block to use `*:80`, then restart Apache.

## 5. Angular Build & Deployment
1. Install/update dependencies (from `frontend/web`):
   ```bash
   npm install
   ```
2. Build the production bundle:
   ```bash
   npm run build
   ```
   Output: `frontend/web/dist/web/browser`
3. Deploy the build:
   ```bash
   rm -rf /var/www/ethik-angular/*
   cp -r frontend/web/dist/web/browser/* /var/www/ethik-angular/
   chown -R www-data:www-data /var/www/ethik-angular
   ```

## 6. Verification
- Local check: `curl -I http://localhost:8080`
- In-browser (with port forwarding if inside a container): `http://<host-ip>:8080`

## 7. Operational Commands
```bash
apachectl -k start      # start Apache
apachectl -k stop       # stop Apache
apachectl -k restart    # restart Apache
apachectl -k graceful   # zero-downtime reload
tail -f /var/log/apache2/ethik-angular-error.log   # error log
tail -f /var/log/apache2/ethik-angular-access.log  # access log
```

## 8. Update Workflow Summary
1. Pull latest frontend changes.
2. `npm install` (if dependency changes).
3. `npm run build`.
4. Copy the new build into `/var/www/ethik-angular/`.
5. `apachectl -k graceful` (optional if only static files changed).

## 9. Docker Alternative (Optional)
If you prefer containerization, build the Angular project as above and serve the `dist` directory with an Apache or nginx container, mounting the build artifacts into `/usr/local/apache2/htdocs/`. Example:
```bash
docker run --name angular-apache -p 8080:80 \
  -v $(pwd)/frontend/web/dist/web/browser:/usr/local/apache2/htdocs:ro \
  httpd:2.4
```
This repo currently uses the native installation described earlier.
