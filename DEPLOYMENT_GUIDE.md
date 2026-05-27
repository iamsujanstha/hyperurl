# DevOps Operations Manual: Continuous Deployment Blueprint
### AWS EC2 + GitHub Actions CI/CD + Docker Compose + Cloudflare DNS/SSL Integration

This operations manual serves as the standard, repository-independent reference blueprint for setting up, managing, and maintaining production-grade containerized environments on **AWS EC2** using **GitHub Actions** and **Docker Compose**, behind a **Cloudflare CDN Reverse Proxy** with full SSL/TLS encryption.

---

## Document Metadata & Copy to Google Docs Instructions
* **Author:** Principal DevOps Lead / Site Reliability Engineer
* **Target Audience:** DevOps Engineers, Software Engineers, Host Administrators
* **Formatting Tip:** To export this document to a Google Doc, select all text (`Ctrl+A` or `Cmd+A`), copy, and paste it directly into a fresh Google Document. The headers, code snippets, and structural tables will render with polished typography automatically.

---

## Section 1: Architectural System Topology

The system uses a **Declarative, Push-Based deployment philosophy** that isolates all build workloads inside secure GitHub-hosted virtual runners. This prevents memory or CPU exhaustion on lightweight AWS EC2 instances (such as `t3.micro` or `t3.small`).

```
                              ┌────────────────────────┐
                              │  Developer GIT Push    │
                              └───────────┬────────────┘
                                          │
                                          ▼
                              ┌────────────────────────┐
                              │     GitHub Actions     │
                              │  (Linter & Compilations)│
                              └───────────┬────────────┘
                                          │ (Triggers remote SSH deploy)
                                          ▼
                              ┌────────────────────────┐
                              │      AWS EC2 Host      │
                              │ (Public Port 80 / 443) │
                              └───────────┬────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼ (Direct proxy)                                ▼ (Inward routing)
     ┌────────────────────────┐                      ┌────────────────────────┐
     │  Cloudflare Edge DNS   │                      │ Docker Compose Runtime │
     │ (SSL Termination)      │                      │ (NodeJS Production)    │
     └────────────────────────┘                      └────────────────────────┘
```

### Core Design Principles:
1. **Immutable Containerization:** Applications are built into multi-stage Docker images to guarantee identical runtime environments between staging and production.
2. **Stateless Service Routing:** Persistent data (e.g., local storage databases, request logs, sqlite files) is isolated from container runtimes via local volume bindings (`./data:/app/data`).
3. **Edge Cryptography Encryption:** SSL/TLS handshake security is managed at the Cloudflare network edge, allowing your application servers to run high-performance lightweight runtimes without complex static local certificate configurations.

---

## Section 2: AWS EC2 Host Instance Alignment

### Step 2.1: Target Host Hardware Guidelines
For standard web microservices, the following minimal baseline specifications apply:
* **Operating System:** Ubuntu Server 22.04 LTS or 24.04 LTS (64-bit x86/ARM).
* **Network Capability:** Assigned Elastic IP Address (static IPv4 address) to prevent URL routing failure on host system reboots.

### Step 2.2: AWS Security Group Rule Configuration (Inward Rules)
Ensure the EC2 Security Group is configured to allow traffic on the following ports:

| Security Group Rule ID | Traffic Protocol / Type | Port Range | Source / Access | Purpose / Description |
| :--- | :--- | :--- | :--- | :--- |
| `sgr-02dbe11...` | **HTTP (TCP)** | `80` | `0.0.0.0/0` | Handles inbound HTTP web traffic and Cloudflare edge handshakes |
| `sgr-0692385...` | **SSH (TCP)** | `22` | `0.0.0.0/0` (or company subnet) | Secure continuous integration (CI/CD) deployments and terminal shells |
| `sgr-0ae6f06...` | **HTTPS (TCP)** | `443` | `0.0.0.0/0` | Managed custom edge routes and secure user sessions |

---

## Section 3: Ubuntu host Provisioning Script

Perform a secure terminal login to your clean EC2 host instance:
```bash
ssh -i "your-key-file.pem" ubuntu@YOUR_EC2_STATIC_IP
```

Run this automated setup script. This compiles GPG keys, sets up official repositories, and installs Docker Engine and Docker Compose V2:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo "ST_01: Refreshing system local registry cache..."
echo "=========================================================="
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git apt-transport-https ca-certificates gnupg lsb-release

echo "=========================================================="
echo "ST_02: Fetching and installing Docker Official GPG keys..."
echo "=========================================================="
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --silent --dearmor -o /etc/apt/keyrings/docker.gpg

echo "=========================================================="
echo "ST_03: Aligning stable Ubuntu repository sources list..."
echo "=========================================================="
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "=========================================================="
echo "ST_04: Installing Docker Engine, CLI, Containerd, and Compose V2..."
echo "=========================================================="
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "=========================================================="
echo "ST_05: Resolving Unix System Docker Socket Permissions..."
echo "=========================================================="
# This resolves the common "permission denied while connecting to docker daemon socket" error
sudo usermod -aG docker $USER

echo "=========================================================="
echo "SYSTEM CHECKS COMPLETED"
echo "=========================================================="
echo "Please re-execute shell environment settings using: newgrp docker"
echo "To verify proper build installation, run: docker compose version"
```

To activate group credentials immediately without logging out of the SSH terminal, run:
```bash
newgrp docker
```

---

## Section 4: GitHub Repository Actions Configuration

### Step 4.1: Encrypted Organization/Repository Secrets
Navigate to your **GitHub Code Repository** -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret** and create the following four variables:

| Secret Key Identifier | Example Reference Value | Technical Integration Role |
| :--- | :--- | :--- |
| **`EC2_HOST`** | `54.210.150.85` *(or your Elastic IP)* | The destination host endpoint pointing directly to your AWS EC2. |
| **`EC2_USER`** | `ubuntu` | Standard default shell root profile name assigned by AWS for Ubuntu configurations. |
| **`EC2_SSH_KEY`** | `-----BEGIN RSA PRIVATE KEY----- ... -----END RSA PRIVATE KEY-----` | Your AWS PEM private key. Ensure both the header and footer are copy-pasted completely. |
| **`EC2_PROJECT_PATH`** | `/home/ubuntu/hypercur` | System directory on the remote target EC2 host where the repository files are cloned and built. |

---

## Section 5: The CI/CD Pipeline Configuration File (`.github/workflows/deploy.yml`)

Create or update your repository's build pipeline at `.github/workflows/deploy.yml`:

```yaml
name: Continuous Integration & Deployment Pipeline

on:
  push:
    branches:
      - main
      - master

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code Repository
        uses: actions/checkout@v4

      - name: Setup Node.js Environment
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Development Dependencies
        run: npm ci

      - name: Execute Code Linting
        run: npm run lint

      - name: Execute Assembly Compilation Build
        run: npm run build

      - name: Execute Code Deploy via SSH Tunnel
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script_stop: true
          script: |
            # Create deployment path if missing
            mkdir -p ${{ secrets.EC2_PROJECT_PATH }}
            
            # Check if repository already exists, if not clone it, else reset and pull
            if [ -d "${{ secrets.EC2_PROJECT_PATH }}/.git" ]; then
              cd ${{ secrets.EC2_PROJECT_PATH }}
              echo "Existing repository found. Pulling latest code..."
              git fetch --all
              git reset --hard origin/${{ github.ref_name }}
            else
              echo "No repository found at goal path. Initializing Git Clone..."
              git clone -b ${{ github.ref_name }} https://github.com/${{ github.repository }}.git ${{ secrets.EC2_PROJECT_PATH }}
              cd ${{ secrets.EC2_PROJECT_PATH }}
            fi

            # Environment Verification & Bootstrapping
            if [ ! -f .env ]; then
              echo "Instantiating default environment settings from .env.example..."
              cp .env.example .env
              echo "Please configure real secrets (such as GEMINI_API_KEY) in .env on the host!"
            fi

            # Resolve compose engine path natively
            if docker compose version >/dev/null 2>&1; then
              COMPOSE_CMD="docker compose"
            elif docker-compose --version >/dev/null 2>&1; then
              COMPOSE_CMD="docker-compose"
            else
              echo "=== ERROR: Docker Compose is NOT installed on your EC2 host instance ==="
              exit 1
            fi

            echo "Identified active execution engine: $COMPOSE_CMD"

            # Execute non-disruptive continuous builds
            echo "Rebuilding and restructuring active services..."
            $COMPOSE_CMD down
            $COMPOSE_CMD up -d --build

            # Free up drive partitions by cleaning intermediate caches
            echo "Removing residual orphan and dangling Docker images..."
            docker image prune -f
            echo "CI/CD Deployment complete and healthy!"
```

---

## Section 6: Replacing Raw IP Views with Cloudflare Domains

To transition your system from a raw IP address (e.g., `http://54.210.150.85`) to a polished, professional custom domain (e.g., `https://yourdomain.com`), complete the steps below:

### Step 6.1: Cloudflare DNS Mapping Configuration
1. Log into your **Cloudflare Dashboard** and select your active registered domain name.
2. Navigate to **DNS** -> **Records**.
3. Clear any conflicting `A` records mapped to old host servers.
4. Add the following **two new DNS records**:

| Type | Name | Content (Target IP) | Proxy Status | TTL | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`A`** | `@` *(Root Domain)* | `YOUR_EC2_PUBLIC_IP` | **Proxied (Orange Cloud)** | Auto | Routes base domain with secure Cloudflare protection |
| **`CNAME`**| `www` | `yourdomain.com` *(Root Domain)* | **Proxied (Orange Cloud)** | Auto | Routes www subdomains to the base location |

*Example mapping configuration mapping root domains:*
* `Type: A`
* `Name: @`
* `IPv4 Address: 54.210.150.85`
* `Proxy status: Proxied`

---

### Step 6.2: Configure Secure SSL/TLS Encryption
To prevent security warnings in browser views and ensure all traffic is encrypted, navigate to your domain settings, choose **SSL/TLS** -> **Overview**, and configure the security rules as follows:

```
[Browser Client]  ◄========================►  [Cloudflare Edge]  ◄========================►  [AWS EC2 Server]
                      Encrypted HTTPS                              Encrypted HTTP/HTTPS
```

#### Choose the Optimal SSL/TLS Mode:
* **Recommended Mode: Flexible (Easiest Integration)**
  * **How it works:** Cloudflare manages the complete, secure HTTPS handshakes on their edge servers with public users. Traffic traveling between Cloudflare and your AWS EC2 host runs through high-performance HTTP on Port 80.
  * **Benefit:** You don't need to configure complex SSL certificates (like certbot or Let's Encrypt renewal engines) inside your Docker container or your host system files!

* **Advanced Option: Full (Strict)**
  * **When to use:** For enterprise-grade compliance where encryption is required end-to-end.
  * **Implementation:** Generate a free Cloudflare Origin Certificate, save the cert/key files on your EC2, and configure a Docker-placed Nginx/Caddy proxy inside your Compose structure to listen on port `443` inside private networking layers.

---

### Step 6.3: Resolve the "Too Many Redirects" Loop Error (CRITICAL)
If you configure your domain name and see an error saying `ERR_TOO_MANY_REDIRECTS`, this means your application is trying to force HTTPS redirects, while Cloudflare’s **Flexible** mode is requesting the app via HTTP on Port 80. This causes an infinite redirect loop.

#### Prevention checklist:
1. Ensure your Cloudflare **SSL/TLS Mode** is set to **Flexible** or **Full**.
2. If using **Flexible**, ensure your Node.js code or reverse proxies do not contain global redirection middleware like `secure-express-redirect` or absolute URL redirects back to `https://`.
3. To enforce safe redirection globally, navigate to **Cloudflare SSL/TLS** -> **Edge Certificates**, and toggle **Always Use HTTPS** to **ON**. Cloudflare will handle this mapping natively at their edge network, bypassing your server completely.

---

## Section 7: Running Checks & Diagnosis Playbook

Once the CI/CD pipeline completes with a green checkmark, use these diagnostic playbooks to confirm everything is working properly:

### Command 7.1: Check Service Health Status
Connect to your EC2 instance and run:
```bash
docker compose ps
```
Your container port status mapping should show `0.0.0.0:80->3000/tcp`. This confirms that all requests hitting Port 80 of your EC2 host are mapped directly to port 3000 inside the Docker container.

### Command 7.2: Monitor Live Output Logs
Access stdout records from the live containers using standard logs:
```bash
docker compose logs -f --tail=100
```

### Command 7.3: Diagnose Local Port Bindings
If the application refuses to resolve, run host tools to check if any other system process (such as a standalone installation of Nginx or Apache) is blocking port 80:
```bash
sudo lsof -i :80
```
If a conflicting process is identified, stop it immediately to free up the HTTP port:
```bash
sudo systemctl stop nginx || sudo systemctl stop apache2
sudo systemctl disable nginx || sudo systemctl disable apache2
```

---

*This operations document is compiled with standard compliance paradigms. It is fully ready to be integrated into company asset directories or shared with prospective DevOps team members.*
