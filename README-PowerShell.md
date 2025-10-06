# Deploy with Docker (PowerShell)

This guide provides PowerShell scripts for Docker deployment of the funds-trackon application, equivalent to the provided shell scripts.

## Prerequisites

- Windows PowerShell 5.1 or PowerShell Core 6+
- Docker Desktop for Windows
- Docker Compose

## PowerShell Scripts

### `start.ps1`

Starts the funds-trackon development environment using Docker Compose.

```powershell
# Start with building (default)
.\start.ps1

# Start without rebuilding images
.\start.ps1 -NoBuild

# Start without waiting for services
.\start.ps1 -NoWait
```

**Parameters:**

- `-NoBuild`: Skip building Docker images (use existing images)
- `-NoWait`: Don't wait for services to be ready

### `stop.ps1`

Stops and removes the Docker containers for the funds-trackon development environment.

```powershell
# Stop services
.\stop.ps1

# Stop services and remove volumes (deletes all data)
.\stop.ps1 -RemoveVolumes

# Force stop without confirmation
.\stop.ps1 -Force
```

**Parameters:**

- `-RemoveVolumes`: Also remove Docker volumes (this will delete all data)
- `-Force`: Force stop containers without confirmation

### `test-rbac-endpoints.ps1`

Tests the RBAC (Role-Based Access Control) endpoints to verify they work correctly.

```powershell
# Test public endpoints only
.\test-rbac-endpoints.ps1

# Test with custom backend URL
.\test-rbac-endpoints.ps1 -BaseUrl "http://localhost:8001"

# Test with authentication token
.\test-rbac-endpoints.ps1 -Token "your-jwt-token-here"

# Skip authenticated endpoint tests
.\test-rbac-endpoints.ps1 -SkipAuthTests
```

**Parameters:**

- `-BaseUrl`: Base URL of the backend API (default: `http://localhost:8000`)
- `-Token`: JWT authentication token for testing protected endpoints
- `-SkipAuthTests`: Skip tests that require authentication

## Environment Setup

1. **Create environment file:**

   ```powershell
   Copy-Item .env.example .env
   # Edit .env with your configuration
   ```

2. **Start the services:**

   ```powershell
   .\start.ps1
   ```

3. **Access the application:**
   - Frontend: `http://localhost:3000` (or configured FRONTEND_PORT)
   - Backend API: `http://localhost:8000` (or configured BACKEND_PORT)
   - MongoDB: localhost:27017 (or configured MONGO_PORT)

## Services

- **mongo**: MongoDB 7 database with persisted volume `mongo_data`
- **backend**: FastAPI (Uvicorn) serving at configured port
- **web**: React static site served by nginx at configured port

## Useful Docker Commands

```powershell
# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f backend

# Restart specific service
docker compose restart backend

# Rebuild and restart services
docker compose up -d --build

# Check service status
docker compose ps

# Execute commands in running container
docker compose exec backend bash
```

## Troubleshooting

### Common Issues

1. **Environment file not found:**

   ```text
   ❌ Error: .env file not found. Please create one based on .env.example
   ```

   **Solution:** Copy `.env.example` to `.env` and configure your settings.

2. **Port conflicts:**
   - Check if ports are already in use: `netstat -ano | findstr :3000`
   - Modify ports in `.env` file

3. **Permission issues:**
   - Ensure Docker Desktop is running
   - Run PowerShell as Administrator if needed

4. **CORS issues:**
   - Frontend served at configured port is allowed by default
   - Update CORS settings in backend configuration if you change ports

5. **MongoDB connection issues:**
   - Ensure MongoDB container is healthy: `docker compose ps`
   - Check MongoDB logs: `docker compose logs mongo`

### Getting Authentication Tokens

To test authenticated endpoints with `test-rbac-endpoints.ps1`:

1. Start the backend server
2. Login through the frontend to get a JWT token
3. Use browser developer tools to copy the token from localStorage/sessionStorage
4. Run the test script with the token:

   ```powershell
   .\test-rbac-endpoints.ps1 -Token "your-jwt-token-here"
   ```

## Development Workflow

1. **Make code changes**
2. **Rebuild services:**

   ```powershell
   docker compose build backend web
   docker compose up -d
   ```

3. **Check logs:**

   ```powershell
   docker compose logs -f backend
   ```

4. **Test endpoints:**

   ```powershell
   .\test-rbac-endpoints.ps1 -Token "your-token"
   ```

## Volumes

- `mongo_data`: MongoDB data persistence
- `uploads`: File uploads from backend

## Security Notes

- Never commit `.env` files to version control
- Use strong passwords for database and API keys
- Regularly update Docker images for security patches
- Consider using Docker secrets for sensitive data in production

## Cross-Platform Compatibility

These PowerShell scripts are designed for Windows but can also run on:

- Windows with PowerShell Core
- Linux with PowerShell Core
- macOS with PowerShell Core

For Linux/macOS, you might prefer the provided shell scripts (`.sh`) instead.
