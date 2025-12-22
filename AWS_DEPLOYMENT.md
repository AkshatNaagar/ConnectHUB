# AWS Elastic Beanstalk Deployment Guide

## Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   aws configure
   ```

2. **EB CLI installed**
   ```bash
   pip install awsebcli
   ```

3. **Environment Variables**
   Create a `.env.production` file or configure in AWS Console:
   - MONGODB_URI (use MongoDB Atlas or AWS DocumentDB)
   - REDIS_HOST (use AWS ElastiCache)
   - JWT_ACCESS_SECRET
   - JWT_REFRESH_SECRET
   - Other required environment variables

## Deployment Steps

### 1. Initialize Elastic Beanstalk

```bash
cd /path/to/ConnectHub
eb init
```

Select:
- Region: Choose your preferred AWS region
- Application name: connecthub
- Platform: Node.js
- Platform branch: Node.js 18 running on 64bit Amazon Linux 2
- CodeCommit: No
- SSH: Yes (for debugging)

### 2. Create Environment

```bash
eb create connecthub-env
```

Options:
- Environment tier: Web server environment
- Load balancer type: application

### 3. Configure Environment Variables

```bash
eb setenv NODE_ENV=production \
  PORT=8080 \
  MONGODB_URI=your_mongodb_uri \
  REDIS_HOST=your_redis_host \
  REDIS_PORT=6379 \
  JWT_ACCESS_SECRET=your_secret \
  JWT_REFRESH_SECRET=your_secret \
  HTTPS_ENABLED=false
```

### 4. Deploy Application

```bash
eb deploy
```

### 5. Open Application

```bash
eb open
```

### 6. Check Status

```bash
eb status
eb health
eb logs
```

## SSL/HTTPS Configuration

### Option 1: Using AWS Certificate Manager (ACM)

1. Request a certificate in ACM
2. Add HTTPS listener in Load Balancer:
   ```bash
   # Update .ebextensions/nodecommands.config with your certificate ARN
   ```

3. Redeploy:
   ```bash
   eb deploy
   ```

### Option 2: Using Let's Encrypt

Add to `.ebextensions/https-instance.config`:

```yaml
packages:
  yum:
    mod24_ssl: []

files:
  /etc/cron.d/certbot_renew:
    content: |
      0 3 * * * root certbot renew --quiet
    mode: "000644"
    owner: root
    group: root
```

## Redis Configuration (AWS ElastiCache)

1. Create ElastiCache Redis cluster
2. Configure security group to allow access from EB instances
3. Set REDIS_HOST environment variable

```bash
eb setenv REDIS_HOST=your-redis-endpoint.cache.amazonaws.com
```

## MongoDB Configuration (MongoDB Atlas)

1. Create MongoDB Atlas cluster
2. Whitelist AWS IP ranges or use VPC peering
3. Set MONGODB_URI environment variable

```bash
eb setenv MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/connecthub
```

## Scaling Configuration

### Auto Scaling

```bash
# Update auto scaling settings
eb scale 2  # Set to 2 instances

# Or configure in .ebextensions/nodecommands.config:
# MinSize: 1
# MaxSize: 4
```

## Monitoring

### View Logs

```bash
eb logs
eb logs --all  # Download all logs
```

### CloudWatch

- Enable enhanced health reporting (already configured)
- View metrics in AWS CloudWatch Console

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Check if Node.js process is running on port 8080
   - Verify environment variables
   - Check logs: `eb logs`

2. **Database Connection Issues**
   - Verify MONGODB_URI is correct
   - Check security groups and network access
   - Ensure IP whitelist includes AWS IP ranges

3. **WebSocket Connection Issues**
   - Verify nginx configuration for WebSocket
   - Check if socket.io route is properly proxied
   - Review `.ebextensions/nodecommands.config`

### Debug Mode

```bash
eb ssh  # SSH into instance
sudo su
cd /var/app/current
cat /var/log/eb-engine.log
cat /var/log/nodejs/nodejs.log
```

## Continuous Deployment

### Using GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS Elastic Beanstalk

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Generate deployment package
        run: zip -r deploy.zip . -x '*.git*'
      
      - name: Deploy to EB
        uses: einaregilsson/beanstalk-deploy@v21
        with:
          aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          application_name: connecthub
          environment_name: connecthub-env
          version_label: ${{ github.sha }}
          region: us-east-1
          deployment_package: deploy.zip
```

## Cost Optimization

1. Use t2.micro for development (free tier eligible)
2. Enable auto-scaling to scale down during low traffic
3. Use reserved instances for production
4. Set up CloudWatch alarms for cost monitoring

## Security Best Practices

1. Use environment variables for sensitive data
2. Enable HTTPS/SSL in production
3. Configure security groups properly
4. Use IAM roles instead of access keys
5. Enable AWS WAF for additional protection
6. Regular security updates: `eb upgrade`

## Cleanup

To delete the environment and avoid charges:

```bash
eb terminate connecthub-env
```

## Support

For issues:
- Check AWS Elastic Beanstalk logs
- Review CloudWatch logs
- Check application logs: `eb logs`
- AWS Support (if you have a support plan)
