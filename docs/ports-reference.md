# Ports Reference — Manivtha CRM

This reference mapping list tracks the ports allocated on the server hosting `crm.joharsmp.info`.

| Port | Service | Owner | Status | Actions / Notes |
|---|---|---|---|---|
| **22** | SSH | System sshd | Active | System administration. Do not touch. |
| **80** | Nginx HTTP | Nginx reverse proxy | Active | Redirects HTTP to HTTPS. Do not touch. |
| **443** | Nginx HTTPS | Nginx SSL | Active | Serves HTTPS secure gateway. Do not touch. |
| **3306** | Host Database | Local MySQL service | Active | Localhost-only bind. Conflicts with CRM container standard ports. |
| **3000** | Friend's Chatbot | Node.js process | Active | External service. Do not touch. |
| **25565**| Minecraft Server | Java runtime | Active | Minecraft server host. Do not touch. |
| **5175** | CRM Frontend | Nginx (Docker Container) | Active | **Manivtha CRM Client Portal**. Mapped from host `5175` to container `80`. |
| **5050** | CRM Backend | Express (Docker Container) | Active | **Manivtha CRM API**. Mapped from host `5050` to container `5050`. |
| **3307** | CRM Database | MySQL (Docker Container) | Active | **Manivtha CRM Database**. Mapped from host `3307` to container `3306` to avoid clashing with host `3306`. |

---

### Port Conflict Safeguard

In case of reboot or launch failures, run this on the host to check conflict overlays:
```bash
sudo ss -tulnp | grep -E "(5175|5050|3307)"
```
If another Docker image or process occupies these ports, edit the left-hand values inside `docker-compose.yml`:
```yaml
ports:
  - "NEW_PORT:5050"
```
And adjust Nginx proxy mapping routes.
