# HIE System Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Health Information Exchange (HIE) system in production environments. The system supports multiple deployment options including cloud, hybrid, and on-premises configurations.

## 🚀 Quick Deployment (Docker Compose)

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 20GB storage space

### 1. Clone and Setup
```bash
git clone <repository-url>
cd hie-prototype
cp .env.example .env
```

### 2. Configure Environment Variables
```bash
# Edit .env file with your settings
nano .env
```

Required environment variables:
```env
# Database
DATABASE_URL=postgresql://hie_user:your_password@postgres:5432/hie_db
DB_PASSWORD=your_secure_password

# Security
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here
ENCRYPTION_KEY=your_32_character_encryption_key

# Redis
REDIS_PASSWORD=your_redis_password

# OAuth (optional)
OAUTH_CLIENT_ID=your_oauth_client_id
OAUTH_CLIENT_SECRET=your_oauth_client_secret

# MFA (optional)
MFA_SECRET=your_mfa_secret
SMS_API_KEY=your_sms_api_key
```

### 3. Deploy with Docker Compose
```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Initialize Database
```bash
# Run database migrations
docker-compose exec backend npm run init-db

# Load demo data (optional)
docker-compose exec backend npm run seed-demo-data
```

### 5. Access the System
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **Fraud Detection API**: http://localhost:5001
- **Health Check**: http://localhost:3000/health

## ☁️ Cloud Deployment (AWS)

### Architecture Overview
```
Internet Gateway
    │
Application Load Balancer
    │
┌───────────────┬───────────────┬───────────────┐
│   ECS Fargate │   ECS Fargate │   ECS Fargate │
│   Frontend    │   Backend     │   Fraud API   │
└───────────────┴───────────────┴───────────────┘
    │               │               │
    └───────────────┼───────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
    RDS PostgreSQL         ElastiCache Redis
```

### 1. Infrastructure Setup (Terraform)

Create `infrastructure/main.tf`:
```hcl
provider "aws" {
  region = var.aws_region
}

# VPC and Networking
resource "aws_vpc" "hie_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "hie-vpc"
  }
}

resource "aws_subnet" "private_subnet" {
  count             = 2
  vpc_id            = aws_vpc.hie_vpc.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "hie-private-subnet-${count.index + 1}"
  }
}

resource "aws_subnet" "public_subnet" {
  count                   = 2
  vpc_id                  = aws_vpc.hie_vpc.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "hie-public-subnet-${count.index + 1}"
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "hie_db" {
  identifier     = "hie-database"
  engine         = "postgres"
  engine_version = "14.9"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true
  
  db_name  = "hie_db"
  username = "hie_user"
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.hie_db_subnet_group.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true
  deletion_protection = false

  tags = {
    Name = "hie-database"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "hie_cache_subnet_group" {
  name       = "hie-cache-subnet-group"
  subnet_ids = aws_subnet.private_subnet[*].id
}

resource "aws_elasticache_cluster" "hie_redis" {
  cluster_id           = "hie-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.hie_cache_subnet_group.name
  security_group_ids   = [aws_security_group.redis_sg.id]
}

# ECS Cluster
resource "aws_ecs_cluster" "hie_cluster" {
  name = "hie-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}
```

### 2. Deploy Infrastructure
```bash
cd infrastructure
terraform init
terraform plan
terraform apply
```

### 3. Deploy Applications to ECS

Create ECS task definitions and services:
```bash
# Build and push Docker images
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com

docker build -t hie-backend ./backend
docker tag hie-backend:latest <account-id>.dkr.ecr.us-west-2.amazonaws.com/hie-backend:latest
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/hie-backend:latest

docker build -t hie-frontend ./hie-frontend
docker tag hie-frontend:latest <account-id>.dkr.ecr.us-west-2.amazonaws.com/hie-frontend:latest
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/hie-frontend:latest

# Deploy ECS services
aws ecs create-service --cli-input-json file://ecs-backend-service.json
aws ecs create-service --cli-input-json file://ecs-frontend-service.json
```

## 🏢 On-Premises Deployment

### System Requirements

#### Minimum Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **Network**: 100 Mbps
- **OS**: Ubuntu 20.04 LTS or CentOS 8

#### Recommended Requirements
- **CPU**: 8 cores
- **RAM**: 16GB
- **Storage**: 500GB SSD
- **Network**: 1 Gbps
- **OS**: Ubuntu 22.04 LTS

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js (for development)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python (for fraud detection)
sudo apt install python3 python3-pip -y
```

### 2. SSL Certificate Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generate SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Nginx Configuration
```nginx
# /etc/nginx/sites-available/hie-system
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Fraud Detection API
    location /fraud/ {
        proxy_pass http://localhost:5001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. Database Backup Setup
```bash
# Create backup script
cat > /opt/hie-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="hie_db"
DB_USER="hie_user"

mkdir -p $BACKUP_DIR

# Database backup
docker-compose exec -T postgres pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/hie_db_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/hie_db_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: hie_db_$DATE.sql.gz"
EOF

chmod +x /opt/hie-backup.sh

# Schedule daily backups
sudo crontab -e
# Add: 0 2 * * * /opt/hie-backup.sh
```

## 🔧 Configuration Management

### Environment-Specific Configurations

#### Development
```env
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_CORS=true
RATE_LIMIT_ENABLED=false
```

#### Staging
```env
NODE_ENV=staging
LOG_LEVEL=info
ENABLE_CORS=true
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=1000
```

#### Production
```env
NODE_ENV=production
LOG_LEVEL=warn
ENABLE_CORS=false
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=100
SECURITY_HEADERS_ENABLED=true
```

### Database Configuration

#### Connection Pooling
```javascript
// config/database.js
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: process.env.NODE_ENV === 'production' ? 20 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

## 📊 Monitoring and Logging

### 1. Application Monitoring (Prometheus + Grafana)

Create `monitoring/docker-compose.yml`:
```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

volumes:
  prometheus_data:
  grafana_data:
```

### 2. Log Aggregation (ELK Stack)

```yaml
# logging/docker-compose.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.8.0
    ports:
      - "5044:5044"
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./logstash/config:/usr/share/logstash/config

  kibana:
    image: docker.elastic.co/kibana/kibana:8.8.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200

volumes:
  elasticsearch_data:
```

## 🔒 Security Hardening

### 1. Firewall Configuration
```bash
# UFW firewall setup
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Fail2Ban Setup
```bash
# Install Fail2Ban
sudo apt install fail2ban -y

# Configure Fail2Ban
sudo cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
findtime = 600
bantime = 7200
maxretry = 10
EOF

sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. System Updates
```bash
# Automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades

# Configure automatic updates
echo 'Unattended-Upgrade::Automatic-Reboot "false";' | sudo tee -a /etc/apt/apt.conf.d/50unattended-upgrades
```

## 🚨 Disaster Recovery

### 1. Backup Strategy
```bash
#!/bin/bash
# /opt/disaster-recovery.sh

BACKUP_DIR="/opt/backups"
S3_BUCKET="hie-backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
docker-compose exec -T postgres pg_dump -U hie_user hie_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Application files backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /opt/hie-prototype

# Upload to S3
aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz s3://$S3_BUCKET/database/
aws s3 cp $BACKUP_DIR/app_$DATE.tar.gz s3://$S3_BUCKET/application/

# Cleanup local backups older than 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
```

### 2. Recovery Procedures
```bash
# Database recovery
gunzip -c backup_file.sql.gz | docker-compose exec -T postgres psql -U hie_user -d hie_db

# Application recovery
tar -xzf app_backup.tar.gz -C /opt/

# Restart services
docker-compose down
docker-compose up -d
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancers (Nginx, HAProxy, or cloud load balancers)
- Implement database read replicas
- Use Redis cluster for session storage
- Container orchestration with Kubernetes

### Vertical Scaling
- Monitor resource usage with Prometheus
- Scale CPU and memory based on demand
- Optimize database queries and indexes
- Implement caching strategies

### Database Scaling
```sql
-- Read replica setup
CREATE PUBLICATION hie_publication FOR ALL TABLES;

-- On replica server
CREATE SUBSCRIPTION hie_subscription 
CONNECTION 'host=primary_host port=5432 user=replication_user dbname=hie_db' 
PUBLICATION hie_publication;
```

## 🧪 Testing in Production

### Health Checks
```bash
# Automated health check script
#!/bin/bash
# /opt/health-check.sh

ENDPOINTS=(
  "http://localhost:3000/health"
  "http://localhost:5001/health"
  "http://localhost/health"
)

for endpoint in "${ENDPOINTS[@]}"; do
  if curl -f -s "$endpoint" > /dev/null; then
    echo "✅ $endpoint is healthy"
  else
    echo "❌ $endpoint is down"
    # Send alert (email, Slack, etc.)
  fi
done
```

### Load Testing
```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

Load test configuration (`load-test.yml`):
```yaml
config:
  target: 'https://your-domain.com'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
  defaults:
    headers:
      Authorization: 'Bearer {{ token }}'

scenarios:
  - name: "Login and fetch patients"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@hospital.co.ke"
            password: "password123"
          capture:
            - json: "$.data.tokens.accessToken"
              as: "token"
      - get:
          url: "/api/patients"
```

## 📞 Support and Maintenance

### Maintenance Schedule
- **Daily**: Automated backups, log rotation
- **Weekly**: Security updates, performance monitoring review
- **Monthly**: Full system backup, disaster recovery testing
- **Quarterly**: Security audit, dependency updates

### Support Contacts
- **System Administrator**: admin@hie-system.co.ke
- **Database Administrator**: dba@hie-system.co.ke
- **Security Team**: security@hie-system.co.ke
- **Emergency Hotline**: +254-XXX-XXXX

### Documentation Updates
- Keep deployment documentation current
- Update runbooks for common issues
- Maintain change log for all deployments
- Document all configuration changes

---

This deployment guide provides comprehensive instructions for deploying the HIE system in various environments while maintaining security, performance, and reliability standards.

