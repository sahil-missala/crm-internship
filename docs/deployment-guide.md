# Deployment Guide — Manivtha CRM

This guide documents the procedures for deploying the Manivtha CRM application to a self-hosted Ubuntu Server utilizing Docker Compose and Nginx.

---

## 1. Prerequisites (Ubuntu Server Setup)

SSH into your Ubuntu server and verify Node.js and Docker are installed:

```bash
# Update Apt sources
sudo apt update && sudo apt upgrade -y

# Install Docker & Compose if not present
sudo apt install -y docker.io docker-compose

# Start and enable Docker daemon
sudo systemctl enable --now docker
```

---

## 2. Ports Verification (Crucial)

Before running the containers, verify that ports `5175`, `5050`, and `3307` are not in use by other processes on the server:

```bash
# Scan active listeners
sudo ss -tulnp

# To check if port 5175 is in use
sudo ss -tulnp | grep :5175
```
*(If a port is in use, modify the host bindings inside the `ports:` segment of `docker-compose.yml` accordingly).*

---

## 3. Clone and Build

1.  Clone the repository to the server (e.g. under `/home/ubuntu/manivtha-crm`):
    ```bash
    cd /home/ubuntu
    git clone https://github.com/yourteam/manivtha-crm.git
    cd manivtha-crm
    ```
2.  Prepare environment configuration variables. Set production values for database keys, JWT secrets, and Telegram Bot options:
    ```bash
    cp backend/.env.example backend/.env
    nano backend/.env
    ```
3.  Deploy using Docker Compose:
    ```bash
    docker compose up --build -d
    ```
4.  Run database seeder inside the running backend container:
    ```bash
    docker compose exec backend node seed.js
    ```

---

## 4. Nginx Reverse Proxy Config

Create Nginx site mapping `/etc/nginx/sites-available/manivtha-crm`:

```nginx
server {
    listen 80;
    server_name crm.joharsmp.info;

    # Proxy all client traffic to Frontend Container
    location / {
        proxy_pass http://localhost:5175;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy all api paths to Backend Container
    location /api {
        proxy_pass http://localhost:5050/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the configuration and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/manivtha-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. HTTPS with Let's Encrypt SSL

1.  Install Certbot Nginx extension:
    ```bash
    sudo apt install -y certbot python3-certbot-nginx
    ```
2.  Obtain and auto-apply SSL certificate:
    ```bash
    sudo certbot --nginx -d crm.joharsmp.info
    ```
    Follow inputs (enter email, accept terms, choose redirect option).

---

## 6. UFW Firewall Setup

Open standard Nginx HTTP and HTTPS ports, blocking direct host ports mapping:

```bash
# Allow Nginx Full (Port 80 and 443)
sudo ufw allow 'Nginx Full'

# Allow SSH
sudo ufw allow 22

# Enable firewall
sudo ufw enable
sudo ufw status
```
