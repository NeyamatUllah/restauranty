# Restauranty — Architecture Document

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Microservices Design](#3-microservices-design)
4. [Routing & Load Balancing](#4-routing--load-balancing)
5. [Data Layer](#5-data-layer)
6. [Containerization](#6-containerization)
7. [Kubernetes Orchestration](#7-kubernetes-orchestration)
8. [CI/CD Pipeline](#8-cicd-pipeline)
9. [Monitoring & Logging](#9-monitoring--logging)
10. [Security & Compliance](#10-security--compliance)
11. [Environment Variables](#11-environment-variables)
12. [Folder Structure](#12-folder-structure)
13. [Local Development Runbook](#13-local-development-runbook)

---

## 1. Project Summary

**Restauranty** is a restaurant management platform built as a set of independent Node.js microservices and a React frontend. The project is the Week 9 capstone of the IronHack DevOps Bootcamp, covering the full lifecycle from local development to production-grade cloud deployment.

| Concern | Technology |
|---|---|
| Frontend | React (CRA or Vite) |
| API Services | Node.js / Express |
| Database | MongoDB |
| Media Storage | Cloudinary |
| Local Routing | HAProxy |
| Containers | Docker |
| Orchestration | Kubernetes (Minikube / AKS) |
| Package Manager | Helm |
| Ingress | NGINX Ingress Controller |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |
| Logging | stdout → K8s log aggregation (ELK optional) |
| Secret Management | Kubernetes Secrets / CI Secret Manager |

---

## 2. High-Level Architecture

### Local Development

```
Browser
   │
   │  HTTP :80
   ▼
┌──────────────────────────────────────┐
│              HAProxy                 │
│         (haproxy.cfg, :80)           │
└────┬──────────┬──────────┬───────────┘
     │          │          │          │
/api/auth  /api/discounts /api/items  /
     │          │          │          │
 ┌───▼───┐ ┌────▼────┐ ┌───▼───┐ ┌───▼────┐
 │ auth  │ │discount │ │ items │ │client  │
 │ :3001 │ │  :3002  │ │ :3003 │ │ :3000  │
 └───┬───┘ └────┬────┘ └───┬───┘ └────────┘
     │          │          │
     └──────────┴──────────┘
                │
         ┌──────▼──────┐
         │   MongoDB   │
         │   :27017    │
         └─────────────┘
                │
         ┌──────▼──────┐
         │ Cloudinary  │
         │  (external) │
         └─────────────┘
```

### Production (Kubernetes)

```
Internet
   │
   │  HTTPS :443
   ▼
┌─────────────────────────────────────────────┐
│         NGINX Ingress Controller             │
│   (replaces HAProxy — path-based routing)   │
└────┬──────────────┬──────────────┬───────────┘
     │              │              │          │
/api/auth   /api/discounts  /api/items        /
     │              │              │          │
┌────▼────┐  ┌──────▼─────┐  ┌────▼────┐ ┌───▼──────┐
│  auth   │  │ discounts  │  │  items  │ │ frontend │
│ Service │  │  Service   │  │ Service │ │ Service  │
└────┬────┘  └──────┬─────┘  └────┬────┘ └──────────┘
     │              │              │
┌────▼──────────────▼──────────────▼────┐
│          auth  discounts  items       │
│          Pod(s)  Pod(s)   Pod(s)      │
│          (Deployments, replicated)    │
└──────────────────┬────────────────────┘
                   │
          ┌────────▼────────┐
          │ MongoDB Service │
          │ (StatefulSet or │
          │  Atlas external)│
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │   Cloudinary    │
          │   (external)    │
          └─────────────────┘
```

---

## 3. Microservices Design

### Overview

Each microservice is:
- A standalone Node.js / Express application
- Independently versioned and deployable
- Owned by its own `Dockerfile` and Kubernetes manifests
- Connected to MongoDB under its own database collection namespace

### auth — Port 3001

**Responsibility:** User identity — registration, login, JWT issuance.

```
POST /api/auth/register   → create user, return JWT
POST /api/auth/login      → validate credentials, return JWT
GET  /api/auth/verify     → validate a token (used by other services)
```

JWT tokens are signed with a shared `SECRET`. The `discounts` and `items` services validate tokens by reading the `Authorization: Bearer <token>` header and verifying the signature locally (shared secret) or by calling `/api/auth/verify`.

### discounts — Port 3002

**Responsibility:** Campaigns and coupon management.

```
GET    /api/discounts/          → list active campaigns
POST   /api/discounts/          → create campaign (auth required)
PUT    /api/discounts/:id       → update campaign (auth required)
DELETE /api/discounts/:id       → remove campaign (auth required)
```

Requires a valid JWT in every mutating request.

### items — Port 3003

**Responsibility:** Menu items, dietary information, and orders.

```
GET    /api/items/              → list all menu items
POST   /api/items/              → create item (auth required)
PUT    /api/items/:id           → update item (auth required)
DELETE /api/items/:id           → delete item (auth required)
POST   /api/items/orders        → place an order (auth required)
```

Also integrates with **Cloudinary** for menu item image uploads.

### client — Port 3000

**Responsibility:** React single-page application.

- Calls all APIs relative to the same host (`/api/auth`, `/api/items`, etc.)
- Never hardcodes backend ports — relies entirely on the router (HAProxy / Ingress)
- `REACT_APP_API_URL=http://localhost:80` (or the K8s domain)

---

## 4. Routing & Load Balancing

### Local — HAProxy

HAProxy listens on `:80` and routes by URL prefix:

```haproxy
frontend http-in
    bind *:80
    acl is_auth      path_beg /api/auth
    acl is_discounts path_beg /api/discounts
    acl is_items     path_beg /api/items
    acl is_root      path_beg /

    use_backend auth-backend      if is_auth
    use_backend discounts-backend if is_discounts
    use_backend items-backend     if is_items
    use_backend frontend-backend  if is_root

backend auth-backend
    server auth1 localhost:3001

backend discounts-backend
    server discounts1 localhost:3002

backend items-backend
    server items1 localhost:3003

backend frontend-backend
    server frontend1 127.0.0.1:3000
```

### Production — NGINX Ingress Controller

The `ingress.yaml` replicates the same routing logic for Kubernetes:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: restauranty-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: restauranty.40.114.182.90.nip.io
      http:
        paths:
          - path: /api/auth
            pathType: Prefix
            backend:
              service:
                name: auth
                port:
                  number: 3001
          - path: /api/discounts
            pathType: Prefix
            backend:
              service:
                name: discounts
                port:
                  number: 3002
          - path: /api/items
            pathType: Prefix
            backend:
              service:
                name: items
                port:
                  number: 3003
          - path: /
            pathType: Prefix
            backend:
              service:
                name: client
                port:
                  number: 80
```

---

## 5. Data Layer

### MongoDB

- **Local:** Run as a Docker container on port `27017`
- **Production:** MongoDB Atlas (managed) or a K8s StatefulSet
- Each microservice uses its own database name to maintain isolation

```
mongodb://mongo-service:27017/auth
mongodb://mongo-service:27017/discounts
mongodb://mongo-service:27017/items
```

### Cloudinary

- Used by the `items` microservice for image storage
- Credentials stored in `.env` locally, and in **Kubernetes Secrets** in production
- Never committed to Git

---

## 6. Containerization

### Dockerfile Pattern (per microservice)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

Each service (`auth`, `discounts`, `items`, `client`) has its own `Dockerfile` at the root of that service's directory.

### docker-compose.yaml

Used for local multi-container development without needing Kubernetes:

```
services:
  mongo        → MongoDB :27017
  auth         → :3001, depends on mongo
  discounts    → :3002, depends on mongo
  items        → :3003, depends on mongo
  client       → :3000, depends on auth, items
  haproxy      → :80, depends on all services
```

---

## 7. Kubernetes Orchestration

### Manifest Files

Raw manifests are in `infrastructure/k8s/` (used for Minikube / reference). Production deployments use the **Helm chart** at `infrastructure/helm/`.

```
infrastructure/k8s/
├── auth-deployment.yaml
├── auth-service.yaml
├── discounts-deployment.yaml
├── discounts-service.yaml
├── items-deployment.yaml
├── items-service.yaml
├── frontend-deployment.yaml
├── frontend-service.yaml
├── mongo-statefulset.yaml
├── mongo-service.yaml
├── ingress.yaml
├── monitoring-ingress.yaml
├── secrets.yaml.example  ← never commit actual values
├── network-policies.yaml
├── prometheus-configmap.yaml
├── prometheus-deployment.yaml
├── prometheus-service.yaml
├── grafana-configmaps.yaml
├── grafana-deployment.yaml
└── grafana-service.yaml
```

### Helm Chart

The Helm chart at `infrastructure/helm/` packages all manifests with configurable values:

```
infrastructure/helm/
├── Chart.yaml
├── values.yaml           ← image tag, replicas, ingress host, monitoring toggle
└── templates/
    ├── _helpers.tpl
    ├── *-deployment.yaml
    ├── *-service.yaml
    ├── ingress.yaml
    ├── monitoring-ingress.yaml
    ├── network-policies.yaml
    └── grafana/prometheus configmaps
```

Deploy or upgrade with a single command:

```bash
helm upgrade --install restauranty infrastructure/helm \
  --namespace restauranty --create-namespace --wait
```

### Deployment Pattern (per microservice)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: auth
  template:
    metadata:
      labels:
        app: auth
    spec:
      containers:
        - name: auth
          image: <registry>/restauranty-auth:latest
          ports:
            - containerPort: 3001
          envFrom:
            - secretRef:
                name: auth-secret
```

### Service Pattern

```yaml
apiVersion: v1
kind: Service
metadata:
  name: auth-service
spec:
  selector:
    app: auth
  ports:
    - port: 3001
      targetPort: 3001
  type: ClusterIP   # internal only — Ingress is the public face
```

---

## 8. CI/CD Pipeline

### GitHub Actions — `.github/workflows/ci-cd.yaml`

```
Trigger: push to main / pull_request
│
├── CI Jobs (on every PR):
│   ├── Lint & test: auth
│   ├── Lint & test: discounts
│   ├── Lint & test: items
│   └── Build: client
│
└── CD Jobs (on merge to main):
    ├── Build & push Docker images to registry
    │   ├── restauranty-auth:$SHA
    │   ├── restauranty-discounts:$SHA
    │   ├── restauranty-items:$SHA
    │   └── restauranty-client:$SHA
    │
    └── Deploy to Kubernetes
        └── helm upgrade --install restauranty infrastructure/helm \
              --namespace restauranty --create-namespace --wait
```

### Secrets in GitHub Actions

Store these in GitHub → Settings → Secrets:
- `KUBE_CONFIG` (base64-encoded AKS kubeconfig)
- `MONGODB_URI`, `SECRET`, `ORIGIN`
- `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`

---

## 9. Monitoring & Logging

### Monitoring — Prometheus + Grafana

```
infrastructure/monitoring/
├── prometheus.yaml           ← scrape configs for each service
└── grafana-dashboard.json    ← pre-built dashboard
```

Each Node.js service exposes a `/metrics` endpoint (via `prom-client` library) with:
- HTTP request count & latency
- Active connections
- Error rates

Prometheus scrapes every 15s. Grafana reads from Prometheus and visualises:
- Request rate per service
- Error rate per service
- Pod CPU/memory (via kube-state-metrics)

### Logging

- All services log to **stdout** (structured JSON preferred)
- Kubernetes collects stdout automatically via the container runtime
- In production: use a log aggregator:

```
Option A (simple):  kubectl logs <pod> / stern (multi-pod tailing)
Option B (managed): CloudWatch (AWS) / Azure Monitor / GCP Logging
Option C (self-hosted): ELK Stack (Elasticsearch + Logstash + Kibana)
```

---

## 10. Security & Compliance

### Network Security

- All services run as `ClusterIP` — not reachable from outside the cluster
- Only the **Ingress** is public-facing
- `NetworkPolicy` objects restrict inter-service traffic:
  - `discounts` and `items` can reach `mongo` only
  - `client` cannot reach `mongo` at all
  - No direct service-to-service calls except where explicitly defined

### Secret Management

| Environment | How secrets are stored |
|---|---|
| Local Dev | `.env` files (gitignored) |
| Docker Compose | `.env` files (gitignored) |
| Kubernetes | `Secret` objects (base64, never committed) |
| CI/CD | GitHub Actions / platform secret manager |

### Authentication & Authorization

- `auth` service issues signed JWTs (`HS256`, shared `SECRET`)
- `discounts` and `items` validate the token on every protected route
- Token expiry enforced server-side

### Compliance Notes (GDPR baseline)

- User passwords hashed with `bcrypt` (never stored plain)
- JWT secrets rotated via K8s Secrets without redeploying
- No PII logged to stdout
- Cloudinary media access controlled via signed URLs

Full details in `SECURITY.md`.

---

## 11. Environment Variables

Each microservice `.env` template:

```env
# Shared
SECRET=<jwt-signing-secret>
PORT=3001               # 3001 auth | 3002 discounts | 3003 items

# Database
MONGODB_URI=mongodb://localhost:27017/<service-name>

# Cloudinary (items service only)
CLOUD_NAME=<cloudinary-cloud-name>
CLOUD_API_KEY=<cloudinary-api-key>
CLOUD_API_SECRET=<cloudinary-api-secret>
```

React client `.env`:

```env
REACT_APP_API_URL=http://localhost:80
```

---

## 12. Folder Structure

```
final-project-restauranty/
│
├── src/
│   ├── backend/
│   │   ├── auth/               # Node.js microservice — JWT auth
│   │   │   ├── Dockerfile
│   │   │   ├── .env.example
│   │   │   └── package.json
│   │   ├── discounts/          # Node.js microservice — campaigns
│   │   │   ├── Dockerfile
│   │   │   ├── .env.example
│   │   │   └── package.json
│   │   └── items/              # Node.js microservice — menu + orders
│   │       ├── Dockerfile
│   │       ├── .env.example
│   │       └── package.json
│   ├── client/                 # React SPA
│   │   ├── Dockerfile
│   │   ├── .env.example
│   │   └── package.json
│   └── haproxy.cfg             # Local routing config
│
├── docker-compose.yaml         # Full local stack
│
├── infrastructure/
│   ├── k8s/                        # raw manifests (Minikube / reference)
│   │   ├── *-deployment.yaml
│   │   ├── *-service.yaml
│   │   ├── ingress.yaml
│   │   ├── monitoring-ingress.yaml
│   │   ├── grafana-configmaps.yaml
│   │   ├── network-policies.yaml
│   │   ├── secrets.yaml.example
│   │   └── prometheus-configmap.yaml
│   ├── helm/                       # Helm chart (production deploys)
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   └── monitoring/
│       ├── prometheus.yaml
│       └── grafana-dashboard.json
│
├── .github/
│   └── workflows/
│       └── ci-cd.yaml
│
├── docs/
│   ├── ARCHITECTURE.md         ← this document
│   ├── TODO.md
│   ├── SECRETS.md
│   └── PRESENTATION.md
│
├── SECURITY.md
└── README.md
```

---

## 13. Local Development Runbook

### Prerequisites

- Node.js 20+
- Docker Desktop
- MongoDB (via Docker)
- HAProxy

### Step 1 — Start MongoDB

```bash
docker run -d \
  --name my-mongo \
  -p 27017:27017 \
  -v mongo-data/data/db \
  mongo:latest
```

### Step 2 — Start each microservice (4 terminals)

```bash
# Terminal 1
cd src/backend/auth && cp .env.example .env && npm install && npm start

# Terminal 2
cd src/backend/discounts && cp .env.example .env && npm install && npm start

# Terminal 3
cd src/backend/items && cp .env.example .env && npm install && npm start

# Terminal 4
cd client && cp .env.example .env && npm install && npm start
```

### Step 3 — Start HAProxy

```bash
haproxy -f haproxy.cfg
```

### Step 4 — Access the app

Open `http://localhost:80` — HAProxy routes everything.

---

*Document version: 2.0 — May 2026*
*Author: Neyamat Ullah — IronHack Week 9 DevOps Capstone*
