# Dokploy Deployment Guide for SpotYme Backend

## Overview
This guide covers deploying the SpotYme backend to Dokploy, a self-hosted PaaS platform that simplifies Docker deployments with automatic SSL and domain management.

## Prerequisites
- Dokploy instance installed and running
- Access to Dokploy admin panel
- Domain name configured (e.g., api.spotyme.com)
- Google Cloud Registry access configured

## Docker Image
The application uses a pre-built Docker image hosted on Google Cloud Registry:
```
gcr.io/make-automation-455521/spotyme-backend:latest
```

## Deployment Steps

### 1. Create New Application in Dokploy

1. Log in to your Dokploy dashboard
2. Click "Create Application"
3. Select "Docker Compose" as the deployment type
4. Name your application (e.g., "spotyme-backend")

### 2. Configure Git Repository

1. **Provider Type**: Select GitHub or Git
2. **Repository**: Connect to your repository
3. **Branch**: Select your deployment branch (e.g., `main`)
4. **Compose Path**: Set to `./docker-compose.dokploy.yml`

### 3. Environment Variables

Add the following environment variables in Dokploy's Environment tab:

#### MongoDB Configuration
```env
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=<strong-password>
MONGO_DATABASE=spotyme
MONGO_USER=spotyme_user
MONGO_PASSWORD=<strong-password>
```

#### Spotify API Configuration
```env
SPOTIFY_CLIENT_ID=<your-spotify-client-id>
SPOTIFY_CLIENT_SECRET=<your-spotify-client-secret>
SPOTIFY_REDIRECT_URI=https://api.spotyme.com/auth/spotify/callback
```

#### Security Keys
```env
SESSION_SECRET=<32+ character random string>
SESSION_STORE_SECRET=<32+ character random string>
JWT_SECRET=<32+ character random string>
ENCRYPTION_KEY=<32+ character random string>
JWT_EXPIRY=7d
```

#### Application URLs
```env
BACKEND_DOMAIN=api.spotyme.com
FRONTEND_URL=https://spotyme.com
```

#### OpenAI Configuration (Optional)
```env
OPENAI_API_KEY=<your-openai-api-key>
```

**Generate secure keys:**
```bash
openssl rand -hex 32
```

### 4. Domain Configuration

#### Option A: Using Dokploy UI
1. Go to the "Domains" tab
2. Add your domain: `api.spotyme.com`
3. Set port to `3000`
4. Enable HTTPS
5. Dokploy will automatically configure Traefik labels

#### Option B: Manual in docker-compose.dokploy.yml
The compose file already includes Traefik labels. Update the domain:
```yaml
- "traefik.http.routers.spotyme-backend.rule=Host(`api.spotyme.com`)"
```

### 5. Deploy

1. Click the "Deploy" button in Dokploy
2. Monitor the deployment logs
3. Wait for both containers to be healthy:
   - `spotyme-backend` (application)
   - `spotyme-mongo` (database)
4. SSL certificates will be automatically generated via Let's Encrypt

### 6. Verify Deployment

Check the following endpoints:
- Health Check: `https://api.spotyme.com/health`
- API Status: `https://api.spotyme.com/api/status`

## File Structure in Dokploy

```
spotyme-backend/
├── docker-compose.dokploy.yml  # Dokploy-specific compose file
├── files/
│   └── init-mongo.js          # MongoDB initialization script
└── ... (other project files)
```

## Network Architecture

- **dokploy-network**: External network for Traefik routing (automatic SSL, domain routing)
- **spotyme-internal**: Internal network for MongoDB communication (isolated from external access)

## Monitoring & Logs

### View Container Logs
1. Navigate to your application in Dokploy
2. Click on "Logs" tab
3. Select container:
   - `spotyme-backend` for application logs
   - `spotyme-mongo` for database logs

### Health Monitoring
- Backend health: Monitored via `/health` endpoint
- MongoDB health: Internal ping command
- Both services have automatic restart policies

## Backup Strategy

### MongoDB Backup
The MongoDB container includes a backup volume. To create backups:

```bash
# Access Dokploy server via SSH
docker exec spotyme-mongo mongodump \
  --username=$MONGO_USER \
  --password=$MONGO_PASSWORD \
  --db=spotyme \
  --out=/backup/$(date +%Y%m%d)
```

### Application Data
- MongoDB data persists in `mongo-data` volume
- Session data stored in MongoDB (persists across deployments)

## Updating the Application

### Method 1: Git Push (Recommended)
1. Push changes to your repository
2. In Dokploy, click "Redeploy"
3. New image will be pulled and deployed

### Method 2: Manual Image Update
1. Build and push new image to GCR:
   ```bash
   docker build -t gcr.io/make-automation-455521/spotyme-backend:latest .
   docker push gcr.io/make-automation-455521/spotyme-backend:latest
   ```
2. In Dokploy, click "Redeploy"

## Troubleshooting

### Container Won't Start
- Check environment variables are set correctly
- Verify MongoDB is healthy before backend starts
- Review container logs for specific errors

### SSL Certificate Issues
- Ensure domain DNS points to Dokploy server
- Wait 10-30 seconds after deployment for cert generation
- Check Traefik logs if certificates aren't generated

### MongoDB Connection Issues
- Verify MongoDB credentials match in environment variables
- Check internal network connectivity
- Ensure init script executed successfully

### Performance Issues
- Review resource limits in docker-compose.dokploy.yml
- Monitor container resource usage in Dokploy
- Scale resources if needed:
  ```yaml
  deploy:
    resources:
      limits:
        cpus: '2'     # Increase CPU
        memory: 1G    # Increase memory
  ```

## Security Considerations

1. **Network Isolation**: MongoDB is only accessible internally
2. **SSL/TLS**: Automatic HTTPS via Let's Encrypt
3. **Authentication**: MongoDB requires authentication
4. **Secrets Management**: All sensitive data in environment variables
5. **CORS Configuration**: Restricted to specified frontend URL

## Advanced Configuration

### Custom Domain with Subpath
To deploy at a subpath (e.g., `example.com/api`):
```yaml
labels:
  - "traefik.http.routers.spotyme-backend.rule=Host(`example.com`) && PathPrefix(`/api`)"
  - "traefik.http.middlewares.spotyme-strip.stripprefix.prefixes=/api"
  - "traefik.http.routers.spotyme-backend.middlewares=spotyme-strip,spotyme-cors"
```

### Rate Limiting
Add rate limiting middleware:
```yaml
labels:
  - "traefik.http.middlewares.spotyme-ratelimit.ratelimit.average=100"
  - "traefik.http.middlewares.spotyme-ratelimit.ratelimit.burst=50"
  - "traefik.http.routers.spotyme-backend.middlewares=spotyme-ratelimit,spotyme-cors"
```

## Support & Resources

- [Dokploy Documentation](https://docs.dokploy.com)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- SpotYme Backend Issues: Check application logs in Dokploy