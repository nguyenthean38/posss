# 🐳 DOCKER SETUP - PHONESTORE POS

## 📋 YÊU CẦU

- Docker Desktop hoặc Docker Engine
- Docker Compose v2.0+
- 2GB RAM trống
- 5GB disk space

---

## 🚀 QUICK START

### 1. Clone Repository
```bash
git clone <repository-url>
cd qu-n-ly-ban-l
```

### 2. Copy Environment File
```bash
cp .env.example .env
```

### 3. Start Docker Containers
```bash
docker-compose up -d
```

### 4. Wait for Services to Start
```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 5. Access Application
- **Frontend**: http://localhost:8080/frontend/login.html
- **Backend API**: http://localhost:8080/backend/
- **phpMyAdmin**: http://localhost:8081

---

## 🏗️ ARCHITECTURE

```
┌─────────────────────────────────────────┐
│         Docker Compose Stack            │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │   Backend    │  │   Database   │   │
│  │  PHP 8.2 +   │──│   MySQL 8.0  │   │
│  │   Apache     │  │              │   │
│  │  Port: 8080  │  │  Port: 3306  │   │
│  └──────────────┘  └──────────────┘   │
│         │                  │           │
│         │                  │           │
│  ┌──────────────┐  ┌──────────────┐   │
│  │   Frontend   │  │ phpMyAdmin   │   │
│  │  HTML/JS/CSS │  │              │   │
│  │  (in backend)│  │  Port: 8081  │   │
│  └──────────────┘  └──────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📦 SERVICES

### 1. Backend (PHP + Apache)
- **Container**: `phonestore_backend`
- **Port**: 8080
- **Image**: Custom (built from Dockerfile)
- **Features**:
  - PHP 8.2 with PDO, MySQLi
  - Apache with mod_rewrite
  - Session management
  - File upload support

### 2. Database (MySQL)
- **Container**: `phonestore_db`
- **Port**: 3306
- **Image**: mysql:8.0
- **Credentials**:
  - Root: root / root123
  - User: phonestore / phonestore123
  - Database: phonestore_pos

### 3. phpMyAdmin
- **Container**: `phonestore_phpmyadmin`
- **Port**: 8081
- **Image**: phpmyadmin:latest
- **Login**: root / root123

---

## 🔧 CONFIGURATION

### Environment Variables (.env)
```env
# Database
DB_HOST=db
DB_NAME=phonestore_pos
DB_USER=phonestore
DB_PASSWORD=phonestore123

# Application
APP_ENV=development
APP_URL=http://localhost:8080

# Session
SESSION_LIFETIME=3600
```

### Database Connection
Backend tự động kết nối với MySQL container qua hostname `db`.

---

## 📝 COMMON COMMANDS

### Start Services
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d backend
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database)
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f db
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific
docker-compose restart backend
```

### Execute Commands in Container
```bash
# Access backend shell
docker-compose exec backend bash

# Access MySQL shell
docker-compose exec db mysql -u phonestore -pphonestore123 phonestore_pos

# Run PHP command
docker-compose exec backend php -v
```

### Rebuild Containers
```bash
# Rebuild backend
docker-compose build backend

# Rebuild and restart
docker-compose up -d --build
```

---

## 🗄️ DATABASE MANAGEMENT

### Import Database
```bash
# Via docker-compose (automatic on first run)
# database.sql is auto-imported from backend/database.sql

# Manual import
docker-compose exec -T db mysql -u phonestore -pphonestore123 phonestore_pos < backend/database.sql
```

### Export Database
```bash
docker-compose exec db mysqldump -u phonestore -pphonestore123 phonestore_pos > backup.sql
```

### Access MySQL CLI
```bash
docker-compose exec db mysql -u phonestore -pphonestore123 phonestore_pos
```

### Reset Database
```bash
# Stop services
docker-compose down

# Remove database volume
docker volume rm qu-n-ly-ban-l_db_data

# Start again (will recreate database)
docker-compose up -d
```

---

## 🔍 TROUBLESHOOTING

### Problem: Port already in use
```bash
# Check what's using the port
netstat -ano | findstr :8080  # Windows
lsof -i :8080                 # Mac/Linux

# Change port in docker-compose.yml
ports:
  - "8090:80"  # Use different port
```

### Problem: Database connection failed
```bash
# Check database is running
docker-compose ps

# Check database logs
docker-compose logs db

# Wait for database to be ready
docker-compose exec db mysqladmin ping -h localhost
```

### Problem: Permission denied
```bash
# Fix permissions
docker-compose exec backend chown -R www-data:www-data /var/www/html
docker-compose exec backend chmod -R 755 /var/www/html
```

### Problem: Session not working
```bash
# Check PHP session directory
docker-compose exec backend ls -la /tmp

# Restart backend
docker-compose restart backend
```

### Problem: Can't access frontend
```bash
# Check backend is running
docker-compose ps

# Check backend logs
docker-compose logs backend

# Test backend directly
curl http://localhost:8080/frontend/login.html
```

---

## 🧪 TESTING

### Test Backend API
```bash
# Test health
curl http://localhost:8080/backend/index.php

# Test login API
curl -X POST http://localhost:8080/backend/index.php?action=auth&method=login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Test Database Connection
```bash
docker-compose exec backend php -r "
  \$pdo = new PDO('mysql:host=db;dbname=phonestore_pos', 'phonestore', 'phonestore123');
  echo 'Database connected successfully!';
"
```

### Test Frontend
Open browser: http://localhost:8080/frontend/login.html

---

## 📊 MONITORING

### Check Container Status
```bash
docker-compose ps
```

### Check Resource Usage
```bash
docker stats
```

### Check Disk Usage
```bash
docker system df
```

### View Container Details
```bash
docker-compose exec backend php -i  # PHP info
docker-compose exec db mysql --version  # MySQL version
```

---

## 🔐 SECURITY

### Production Recommendations

1. **Change Default Passwords**
```env
DB_ROOT_PASSWORD=<strong-password>
DB_PASSWORD=<strong-password>
```

2. **Disable phpMyAdmin**
```yaml
# Comment out in docker-compose.yml
# phpmyadmin:
#   ...
```

3. **Use HTTPS**
```yaml
# Add SSL certificates
volumes:
  - ./ssl:/etc/apache2/ssl
```

4. **Restrict Database Access**
```yaml
# Remove port exposure
# ports:
#   - "3306:3306"
```

5. **Enable Production Mode**
```env
APP_ENV=production
APP_DEBUG=false
```

---

## 🚀 DEPLOYMENT

### Build for Production
```bash
# Build optimized image
docker-compose -f docker-compose.prod.yml build

# Start production stack
docker-compose -f docker-compose.prod.yml up -d
```

### Backup Before Deploy
```bash
# Backup database
docker-compose exec db mysqldump -u phonestore -pphonestore123 phonestore_pos > backup_$(date +%Y%m%d).sql

# Backup uploads
tar -czf uploads_backup.tar.gz backend/uploads/
```

---

## 📚 USEFUL LINKS

- Docker Documentation: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- PHP Docker Image: https://hub.docker.com/_/php
- MySQL Docker Image: https://hub.docker.com/_/mysql
- phpMyAdmin: https://hub.docker.com/_/phpmyadmin

---

## 🆘 SUPPORT

### Clean Everything and Start Fresh
```bash
# Stop all containers
docker-compose down

# Remove all volumes (⚠️ deletes all data)
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Clean Docker system
docker system prune -a

# Start fresh
docker-compose up -d --build
```

### Get Help
```bash
# View docker-compose help
docker-compose --help

# View service logs
docker-compose logs --help
```

---

## ✅ CHECKLIST

- [ ] Docker Desktop installed
- [ ] Copied .env.example to .env
- [ ] Ports 8080, 8081, 3306 available
- [ ] Run `docker-compose up -d`
- [ ] Wait for services to start
- [ ] Access http://localhost:8080/frontend/login.html
- [ ] Login with default credentials
- [ ] Test POS functionality

**Dự án đã sẵn sàng chạy với Docker!** 🎉
