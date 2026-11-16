# 🍔 FoodRush - Online Food Ordering Kubernetes Microservices Platform

A production-ready microservices-based online food delivery system designed specifically for **Kubernetes (K8s)** and local containerized development.

---

## 🏛 Architecture Overview

```
                                      +---------------------------------------------+
                                      |            Client Browser / User            |
                                      +---------------------------------------------+
                                                             |
                                                             | (Port 80 / NodePort 30080)
                                                             v
                      +-----------------------------------------------------------------------------+
                      |                      Frontend Microservice (React + Nginx)                  |
                      |  - Menu Catalog Browsing       - Cart Management & Line Totals              |
                      |  - JWT Authentication State    - Live Order Status Tracking Stepper         |
                      |  - Reverse Proxy: /api/auth/* -> Auth Service | /api/* -> Backend Service   |
                      +-----------------------------------------------------------------------------+
                                       /                                           \
                   /api/auth/* (Internal Cluster DNS)             /api/* (Internal Cluster DNS)
                                     /                                               \
                                    v                                                 v
   +--------------------------------------------------+     +--------------------------------------------------+
   |             Auth Microservice (FastAPI)          |     |           Backend & Orders API (FastAPI)         |
   | - JWT Token Generation & Verification            |     | - Restaurant & Menu Query Endpoints              |
   | - User Registration & Role Enforcement           |     | - ACID Transactional Order Creation              |
   | - BCrypt Password Hashing                        |     | - Order Status Workflow (PREPARING -> DELIVERED) |
   | - Health Probes (/health)                        |     | - Payments & Admin Dashboard Endpoints           |
   +--------------------------------------------------+     +--------------------------------------------------+
                                    \                                                 /
                                     \                                               /
                                      \----> +----------------------------------+ <---/
                                             |     MySQL Database Microservice  |
                                             | - Persistent Volume Claim (PVC)  |
                                             | - Relational Schema & Init Seed  |
                                             | - Users, Restaurants, Menus,     |
                                             |   Orders, OrderItems, Payments   |
                                             +----------------------------------+
```

---

## 📦 Microservices Breakdown

| Service | Technology | Port | Responsibilities |
| :--- | :--- | :--- | :--- |
| **`frontend`** | React 18, Vite, Nginx | `80` (NodePort `30080`) | Menu browsing, restaurant filtering, cart drawer, checkout modal, live order status tracker, and internal Nginx reverse-proxy routing. |
| **`auth-service`** | FastAPI, PyJWT, BCrypt, SQLAlchemy | `8000` (ClusterIP) | JWT authentication, user registration, credential verification, profile retrieval (`/auth/me`). |
| **`backend-service`** | FastAPI, SQLAlchemy, PyMySQL | `8000` (ClusterIP) | Restaurant catalog, menus, atomic order placement (Orders + OrderItems + Payments), order tracking, status updates, admin analytics. |
| **`mysql-service`** | MySQL 8.0, Stateful PVC | `3306` (ClusterIP) | Relational database storage with automated SQL migration seed. |

---

## 🗄 Relational Database Schema

- **`users`**: `id`, `name`, `email` (UNIQUE), `password_hash`, `role` (`customer`, `admin`, `restaurant_owner`), `phone`, `address`, `created_at`
- **`restaurants`**: `id`, `name`, `description`, `cuisine`, `image_url`, `rating`, `address`, `is_active`, `created_at`
- **`menu_items`**: `id`, `restaurant_id` (FK), `name`, `description`, `price`, `category`, `image_url`, `is_available`
- **`orders`**: `id`, `user_id` (FK), `restaurant_id` (FK), `total_amount`, `status` (`CONFIRMED`, `PREPARING`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`), `delivery_address`, timestamps
- **`order_items`**: `id`, `order_id` (FK), `menu_item_id` (FK), `item_name`, `quantity`, `unit_price`, `subtotal`
- **`payments`**: `id`, `order_id` (FK), `amount`, `payment_method` (`CARD`, `UPI`, `CASH_ON_DELIVERY`), `status` (`SUCCESS`, `PENDING`), `transaction_id`, `created_at`

---

## 🌍 Environment Configurations (Dev, QA, Prod)

This project includes multi-environment configuration files at the root level and per-service level:

| File | Environment | Purpose & Key Differences |
| :--- | :--- | :--- |
| [`.env.example`](file:///d:/mint/k8s-project/.env.example) | Template | Reference template containing all possible config keys and documentation. |
| [`.env.dev`](file:///d:/mint/k8s-project/.env.dev) | **Development** | `DEBUG=True`, `LOG_LEVEL=DEBUG`, 3-day token expiry, local dev database credentials, dev ports (`3000`, `8001`, `8002`, `30080`). |
| [`.env.qa`](file:///d:/mint/k8s-project/.env.qa) | **QA / Staging** | `DEBUG=False`, `LOG_LEVEL=INFO`, 12-hour token expiry, QA cluster DNS endpoints (`*.foodrush-qa.svc.cluster.local`), NodePort `31080`. |
| [`.env.prod`](file:///d:/mint/k8s-project/.env.prod) | **Production** | `DEBUG=False`, `LOG_LEVEL=WARNING`, 1-hour strict token expiry, production cluster DNS (`*.foodrush-prod.svc.cluster.local`), high-security secrets, NodePort `32080`. |
| [`.env`](file:///d:/mint/k8s-project/.env) | **Active Config** | Default active environment (copy of `.env.dev` for immediate one-command startup). |

### Switching Environments:

- **Docker Compose:**
  ```bash
  # Run in Development (Default)
  docker compose --env-file .env.dev up --build

  # Run in QA / Staging
  docker compose --env-file .env.qa up --build

  # Run in Production
  docker compose --env-file .env.prod up --build
  ```

- **Kubernetes (Kustomize Overlays):**
  Deploy tailored configurations to dedicated namespaces (`foodrush-dev`, `foodrush-qa`, `foodrush-prod`):
  ```bash
  # Deploy to Dev (1 replica per service, dev namespace)
  kubectl apply -k k8s/environments/dev

  # Deploy to QA (2 replicas per service, NodePort 31080, qa namespace)
  kubectl apply -k k8s/environments/qa

  # Deploy to Production (3 replicas per service, NodePort 32080, prod namespace)
  kubectl apply -k k8s/environments/prod
  ```

---

## 🚀 Quick Start: Run with Docker Compose

To test the entire stack immediately without Kubernetes:

```bash
docker compose up --build
```

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Auth Microservice Docs**: [http://localhost:8001/docs](http://localhost:8001/docs)
- **Backend Microservice Docs**: [http://localhost:8002/docs](http://localhost:8002/docs)

---

## ☸️ Deploying to Kubernetes

### 1. Build the Docker Images

Run the build script to generate the local images:

**Windows (PowerShell):**
```powershell
.\build-images.ps1
```

**Linux / macOS (Bash):**
```bash
chmod +x build-images.sh
./build-images.sh
```

*(Note for Minikube or Kind:)*
```bash
# For Minikube:
minikube image load foodrush-auth:latest foodrush-backend:latest foodrush-frontend:latest

# For Kind:
kind load docker-image foodrush-auth:latest foodrush-backend:latest foodrush-frontend:latest
```

---

### 2. Deploy Everything with Kustomize

Deploy the entire namespace, storage, secrets, configs, deployments, and services in one command:

```bash
kubectl apply -k k8s/
```

Or apply directory by directory:
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/mysql/
kubectl apply -f k8s/auth/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/ingress.yaml
```

---

### 3. Verify Kubernetes Deployment

Check the running pods and services in the `foodrush` namespace:

```bash
kubectl get all -n foodrush
kubectl get pvc -n foodrush
```

Expected output:
```text
NAME                                      READY   STATUS    RESTARTS   AGE
pod/auth-deployment-xxxx-1                1/1     Running   0          45s
pod/auth-deployment-xxxx-2                1/1     Running   0          45s
pod/backend-deployment-yyyy-1             1/1     Running   0          45s
pod/backend-deployment-yyyy-2             1/1     Running   0          45s
pod/frontend-deployment-zzzz-1            1/1     Running   0          45s
pod/frontend-deployment-zzzz-2            1/1     Running   0          45s
pod/mysql-deployment-wwww-1               1/1     Running   0          45s

NAME                       TYPE        CLUSTER-IP       PORT(S)
service/auth-service       ClusterIP   10.96.120.10     8000/TCP
service/backend-service    ClusterIP   10.96.180.20     8000/TCP
service/frontend-service   NodePort    10.96.220.30     80:30080/TCP
service/mysql-service      ClusterIP   10.96.100.5      3306/TCP
```

---

### 4. Access the Application

- **Via NodePort (Minikube / Docker Desktop / Cloud VM):**
  Open your browser at:
  ```text
  http://localhost:30080
  ```
  *(If using Minikube on Windows/macOS, run `minikube service frontend-service -n foodrush`)*

- **Via Port Forwarding:**
  ```bash
  kubectl port-forward svc/frontend-service 3000:80 -n foodrush
  ```
  Then browse to [http://localhost:3000](http://localhost:3000).

- **Via Ingress:**
  If you have an Ingress controller (e.g., `ingress-nginx`), access via `http://localhost/` or the configured Ingress IP.

---

## 🔑 Pre-seeded Demo Credentials

The database initializes automatically with test users:

| Role | Email | Password | Features Accessible |
| :--- | :--- | :--- | :--- |
| **Customer** | `jane@example.com` | `password123` | Browse menus, place orders, track live status, view history. |
| **Admin** | `admin@foodrush.com` | `password123` | View all customer orders, advance order workflow states, admin dashboard. |

*(You can also click the quick-login buttons directly in the Sign In modal or create a new account!)*

---

## 🧪 Testing the Microservices Workflow

1. **Browse Restaurants**:
   - Open the web UI, choose cuisine filters (Italian, Indian, Burgers, Sushi), or search for dishes like "Pizza" or "Biryani".
2. **Order & Checkout**:
   - Click **View Menu** on Bella Trattoria or Spice Symphony.
   - Add items to the cart, open the Cart drawer, select payment method (`CARD`), and click **Place Order**.
3. **Real-time Order Tracking**:
   - Watch the order transition through the visual progress tracker:
     `CONFIRMED` ➔ `PREPARING` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED`.
   - Log in as `admin@foodrush.com` to use the simulation control to advance the order state.

