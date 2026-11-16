# FoodRush - Build Docker Images for Kubernetes
Write-Host "==> Building Auth Service Image..." -ForegroundColor Cyan
docker build -t foodrush-auth:latest ./services/auth

Write-Host "==> Building Backend Service Image..." -ForegroundColor Cyan
docker build -t foodrush-backend:latest ./services/backend

Write-Host "==> Building Frontend Service Image..." -ForegroundColor Cyan
docker build -t foodrush-frontend:latest ./services/frontend

Write-Host "==> All images built successfully!" -ForegroundColor Green
Write-Host "If using Minikube, run: minikube image load foodrush-auth:latest foodrush-backend:latest foodrush-frontend:latest" -ForegroundColor Yellow
Write-Host "If using Kind, run: kind load docker-image foodrush-auth:latest foodrush-backend:latest foodrush-frontend:latest" -ForegroundColor Yellow

