# Kubernetes GUI Manager - Deployment Guide

This guide covers various deployment options for making your Kubernetes GUI Manager publicly accessible.

## Table of Contents

1. [Quick Deployment Options](#quick-deployment-options)
2. [Heroku Deployment](#heroku-deployment)
3. [Vercel Deployment](#vercel-deployment)
4. [Netlify Deployment](#netlify-deployment)
5. [DigitalOcean App Platform](#digitalocean-app-platform)
6. [AWS Elastic Beanstalk](#aws-elastic-beanstalk)
7. [Docker Deployment](#docker-deployment)
8. [Custom VPS Deployment](#custom-vps-deployment)
9. [Security Considerations](#security-considerations)

## Quick Deployment Options

### Option 1: Heroku (Recommended for Beginners)
- **Pros**: Easy setup, free tier available, automatic HTTPS
- **Cons**: Requires kubectl access on server
- **Time**: 5-10 minutes

### Option 2: Vercel (Static Frontend Only)
- **Pros**: Free, fast, excellent CDN
- **Cons**: Frontend only, need separate backend
- **Time**: 2-5 minutes

### Option 3: Netlify (Static Frontend Only)
- **Pros**: Free, easy, forms handling
- **Cons**: Frontend only
- **Time**: 2-5 minutes

## Heroku Deployment

### Prerequisites
- Heroku account (free)
- Heroku CLI installed
- GitHub repository

### Step 1: Install Heroku CLI
```bash
# Download from: https://devcenter.heroku.com/articles/heroku-cli
# Or use npm:
npm install -g heroku
```

### Step 2: Login to Heroku
```bash
heroku login
```

### Step 3: Create Heroku App
```bash
heroku create kubernetes-gui-manager
```

### Step 4: Add Build Pack
```bash
heroku buildpacks:set heroku/nodejs
```

### Step 5: Deploy
```bash
git push heroku main
```

### Step 6: Open App
```bash
heroku open
```

### Additional Configuration
```bash
# Set environment variables
heroku config:set PORT=3000

# Enable dyno
heroku ps:scale web=1

# View logs
heroku logs --tail
```

## Vercel Deployment (Frontend Only)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Create vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "public/index.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/",
      "dest": "/public/index.html"
    }
  ]
}
```

### Step 3: Deploy
```bash
vercel --prod
```

### Step 4: Configure Backend
You'll need a separate backend service (API Gateway, serverless functions, etc.)

## Netlify Deployment (Frontend Only)

### Step 1: Create netlify.toml
```toml
[build]
  publish = "public"
  command = ""

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Step 2: Deploy via Git
1. Connect your GitHub repository to Netlify
2. Set build directory to `public`
3. Deploy automatically

## DigitalOcean App Platform

### Step 1: Create doctl
```bash
# Install doctl: https://docs.digitalocean.com/reference/doctl/how-to/install/
```

### Step 2: Create App
```bash
doctl apps create --spec .do/app.yaml
```

### Step 3: Create app.yaml
```yaml
name: kubernetes-gui-manager
services:
- name: web
  source_dir: /
  github:
    repo: Srk-1974/Kuberneties
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 3000
  routes:
  - path: /
```

## AWS Elastic Beanstalk

### Step 1: Install EB CLI
```bash
pip install awsebcli --upgrade --user
```

### Step 2: Initialize
```bash
eb init kubernetes-gui-manager
```

### Step 3: Create Environment
```bash
eb create production
```

### Step 4: Deploy
```bash
eb deploy
```

## Docker Deployment

### Step 1: Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Step 2: Create .dockerignore
```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
```

### Step 3: Build and Run
```bash
# Build image
docker build -t kubernetes-gui-manager .

# Run container
docker run -p 3000:3000 kubernetes-gui-manager
```

### Step 4: Deploy to Docker Hub
```bash
# Tag
docker tag kubernetes-gui-manager yourusername/kubernetes-gui-manager

# Push
docker push yourusername/kubernetes-gui-manager
```

## Custom VPS Deployment

### Prerequisites
- VPS (DigitalOcean, Linode, Vultr, etc.)
- Domain name (optional)
- SSH access

### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

### Step 2: Deploy Application
```bash
# Clone repository
git clone https://github.com/Srk-1974/Kuberneties.git
cd Kuberneties

# Install dependencies
npm install

# Start with PM2
pm2 start server.js --name kubernetes-gui

# Setup PM2 startup
pm2 startup
pm2 save
```

### Step 3: Configure Nginx
```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/kubernetes-gui
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/kubernetes-gui /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 4: SSL Certificate (Optional)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Security Considerations

### 1. Authentication
Consider adding authentication to protect your Kubernetes GUI:

```javascript
// Example: Basic Auth Middleware
app.use((req, res, next) => {
    const auth = {login: 'admin', password: 'your-secure-password'};
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');
    
    if (login && password && login === auth.login && password === auth.password) {
        return next();
    }
    
    res.set('WWW-Authenticate', 'Basic realm="401"');
    res.status(401).send('Authentication required');
});
```

### 2. Environment Variables
Never commit sensitive data:
```bash
# Use environment variables
KUBECONFIG_PATH=/path/to/kubeconfig
ADMIN_PASSWORD=secure-password
```

### 3. Network Security
- Use HTTPS
- Implement rate limiting
- Consider VPN access
- Regular security updates

### 4. Kubernetes RBAC
Create a dedicated service account with limited permissions:
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: kubernetes-gui-sa
  namespace: default
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: kubernetes-gui-role
rules:
- apiGroups: [""]
  resources: ["pods", "services", "namespaces"]
  verbs: ["get", "list", "watch", "describe"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "describe", "scale", "restart"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: kubernetes-gui-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: kubernetes-gui-role
subjects:
- kind: ServiceAccount
  name: kubernetes-gui-sa
  namespace: default
```

## Deployment Checklist

### Pre-Deployment
- [ ] Test application locally
- [ ] Review security settings
- [ ] Set up monitoring
- [ ] Prepare environment variables
- [ ] Backup existing data

### Post-Deployment
- [ ] Verify HTTPS works
- [ ] Test all features
- [ ] Set up backups
- [ ] Configure monitoring alerts
- [ ] Document access procedures

### Monitoring
- Application health checks
- Error tracking
- Performance monitoring
- Security monitoring
- Resource usage tracking

## Recommended Deployment Strategy

### For Production Use:
1. **Start with Heroku** (easy, managed)
2. **Add authentication** (security first)
3. **Configure SSL** (HTTPS required)
4. **Set up monitoring** (track issues)
5. **Implement backups** (data safety)

### For Development/Testing:
1. **Use mock mode** (no cluster needed)
2. **Deploy to Vercel/Netlify** (frontend only)
3. **Use local backend** (development)

---

## Quick Start Summary

### Fastest Public Deployment (Heroku):
```bash
# 1. Install Heroku CLI
npm install -g heroku

# 2. Login and create app
heroku login
heroku create kubernetes-gui-manager

# 3. Deploy
git push heroku main

# 4. Open your public site
heroku open
```

### Alternative: Static Frontend (Vercel):
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy frontend
vercel --prod

# 3. Setup separate backend service
# (API Gateway, serverless, or VPS)
```

## Support

For deployment issues:
1. Check platform-specific documentation
2. Review application logs
3. Verify environment variables
4. Test with mock mode first
5. Check network connectivity

---

**Note**: Always prioritize security when deploying applications that interact with Kubernetes clusters. Use authentication, HTTPS, and proper RBAC permissions.
