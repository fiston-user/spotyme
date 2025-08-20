# Docker Deployment Guide for SpotYme Backend

## Overview
This guide covers how to build, run, and deploy the SpotYme backend using Docker.

## Prerequisites
- Docker Engine 20.10+ installed
- Docker Compose v2.0+ installed
- Git (for cloning the repository)

## Quick Start

### 1. Environment Setup
```bash
# Copy the environment template
cp docker.env.example .env

# Edit .env with your actual values
nano .env
```

### 2. Build and Run with Docker Compose
```bash
# Build the Docker images
npm run docker:build

# Start all services (backend + MongoDB)
npm run docker:up

# Check logs
npm run docker:logs
```

The backend will be available at `http://localhost:3000`

## Configuration

### Environment Variables
Key environment variables to configure in your `.env` file:

- **MongoDB**:
  - `MONGO_ROOT_USERNAME`: MongoDB root username
  - `MONGO_ROOT_PASSWORD`: MongoDB root password (use strong password)
  - `MONGO_USER`: Application database user
  - `MONGO_PASSWORD`: Application database password

- **Spotify API**:
  - `SPOTIFY_CLIENT_ID`: Your Spotify app client ID
  - `SPOTIFY_CLIENT_SECRET`: Your Spotify app client secret
  - `SPOTIFY_REDIRECT_URI`: OAuth callback URL

- **Security**:
  - `SESSION_SECRET`: Session encryption key (min 32 chars)
  - `JWT_SECRET`: JWT signing key (min 32 chars)
  - `ENCRYPTION_KEY`: Data encryption key (32+ chars)

### Generate Secure Keys
```bash
# Generate secure random keys
openssl rand -hex 32  # Use for SESSION_SECRET, JWT_SECRET, ENCRYPTION_KEY
```

## Docker Commands

### Using npm scripts (recommended):
```bash
npm run docker:build    # Build images
npm run docker:up       # Start services
npm run docker:down     # Stop services
npm run docker:logs     # View logs
npm run docker:clean    # Remove containers and volumes
npm run docker:rebuild  # Rebuild from scratch
```

### Using docker-compose directly:
```bash
# Development
docker-compose up -d
docker-compose logs -f

# Production
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml logs -f
```

## Production Deployment

### 1. Build Production Image
```bash
# Build the image
docker build -t spotyme-backend:latest .

# Tag for your registry
docker tag spotyme-backend:latest your-registry/spotyme-backend:latest
```

### 2. Push to Registry
```bash
# Login to your registry (Docker Hub, AWS ECR, etc.)
docker login your-registry

# Push the image
docker push your-registry/spotyme-backend:latest
```

### 3. Deploy with Production Compose
```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Production Environment Variables
Create a production `.env` file with:
- Strong, unique passwords
- Production MongoDB URI (if using external database)
- Production-ready Spotify redirect URI
- Proper FRONTEND_URL for CORS

## Health Checks

Both services include health checks:
- Backend: `http://localhost:3000/health`
- MongoDB: Internal ping command

Monitor health status:
```bash
docker-compose ps
docker inspect spotyme-backend --format='{{.State.Health.Status}}'
```

## Backup and Restore

### MongoDB Backup
```bash
# Create backup
docker exec spotyme-mongo mongodump \
  --username=$MONGO_USER \
  --password=$MONGO_PASSWORD \
  --db=spotyme \
  --out=/backup/$(date +%Y%m%d)

# Copy backup to host
docker cp spotyme-mongo:/backup ./backups
```

### MongoDB Restore
```bash
# Copy backup to container
docker cp ./backups/20240101 spotyme-mongo:/backup/

# Restore backup
docker exec spotyme-mongo mongorestore \
  --username=$MONGO_USER \
  --password=$MONGO_PASSWORD \
  --db=spotyme \
  /backup/20240101/spotyme
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs backend
docker-compose logs mongodb

# Verify environment variables
docker-compose config
```

### Connection issues
- Ensure MongoDB is healthy before backend starts
- Check network connectivity: `docker network ls`
- Verify environment variables are set correctly

### Permission issues
- The backend runs as non-root user (nodejs:1001)
- Ensure volumes have correct permissions

### Reset everything
```bash
# Stop and remove everything
npm run docker:clean

# Rebuild from scratch
npm run docker:rebuild
```

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong passwords** for all services
3. **Restrict MongoDB port** in production (bind to 127.0.0.1)
4. **Enable MongoDB authentication** (already configured)
5. **Use HTTPS** in production with reverse proxy (nginx/traefik)
6. **Regularly update** base images for security patches
7. **Monitor logs** for suspicious activity

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build and push Docker image
        env:
          DOCKER_REGISTRY: ${{ secrets.DOCKER_REGISTRY }}
          DOCKER_USERNAME: ${{ secrets.DOCKER_USERNAME }}
          DOCKER_PASSWORD: ${{ secrets.DOCKER_PASSWORD }}
        run: |
          echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin
          docker build -t $DOCKER_REGISTRY/spotyme-backend:${{ github.sha }} .
          docker push $DOCKER_REGISTRY/spotyme-backend:${{ github.sha }}
```

## Monitoring

### View resource usage
```bash
docker stats spotyme-backend spotyme-mongo
```

### Container logs
```bash
# Follow logs
docker-compose logs -f --tail=100

# Export logs
docker-compose logs > spotyme-logs-$(date +%Y%m%d).txt
```

## Scaling

For horizontal scaling, consider:
1. Using external MongoDB (MongoDB Atlas, AWS DocumentDB)
2. Load balancer (nginx, HAProxy)
3. Container orchestration (Kubernetes, Docker Swarm)
4. Session store sharing (Redis for sessions)

## Support

For issues or questions:
1. Check container logs first
2. Verify all environment variables are set
3. Ensure Docker and Docker Compose are up to date
4. Review the troubleshooting section above