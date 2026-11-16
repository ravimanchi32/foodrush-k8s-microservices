#!/bin/bash
set -e

echo "==> Building Auth Service Image..."
docker build -t foodrush-auth:latest ./services/auth

echo "==> Building Backend Service Image..."
docker build -t foodrush-backend:latest ./services/backend

echo "==> Building Frontend Service Image..."
docker build -t foodrush-frontend:latest ./services/frontend

echo "==> All images built successfully!"
echo "If using Minikube: minikube image load foodrush-auth:latest foodrush-backend:latest foodrush-frontend:latest"
echo "If using Kind: kind load docker-image foodrush-auth:latest foodrush-backend:latest foodrush-frontend:latest"

