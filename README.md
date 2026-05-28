# Restauranty

A restaurant management platform built with a **microservices architecture**: 3 Node.js/Express backends + a React frontend, unified behind HAProxy/NGINX Ingress path-based routing.

---

## Architecture

```
                        ┌─────────────────────┐
                        │   HAProxy / Ingress  │
   Browser ───────────► │      (port 80)       │
                        └──────────┬──────────┘
                                   │
           ┌───────────────────────┼──────────────────────┐
           │                       │                      │
      /api/auth/*            /api/items/*          /api/discounts/*
           │                       │                      │
  ┌────────▼────────┐   ┌──────────▼────────┐   ┌────────▼───────────┐
  │  Auth Service   │   │  Items Service    │   │ Discounts Service  │
  │   (port 3001)   │   │   (port 3003)     │   │   (port 3002)      │
  └────────┬────────┘   └──────────┬────────┘   └────────┬───────────┘
           │                       │                      │
           └───────────────────────┼──────────────────────┘
                                   │
                            ┌──────▼──────┐
                            │   MongoDB   │
                            │ (port 27017)│
                            └─────────────┘
```

## Microservices

| Service | Port | Path | Responsibilities |
|---|---|---|---|
| **Auth** | 3001 | `/api/auth/*` | User signup, login, JWT authentication |
| **Discounts** | 3002 | `/api/discounts/*` | Coupon and campaign management |
| **Items** | 3003 | `/api/items/*` | Menu items, dietary categories, orders |
| **Frontend** | 3000 | `/` | React SPA (admin dashboard) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, React Router, Axios, React Icons |
| Backend | Node.js, Express, Mongoose, JWT, bcryptjs |
| Database | MongoDB 7 |
| Image Storage | Cloudinary |
| Monitoring | Prometheus, Grafana |
| Routing (local) | HAProxy |
| Routing (K8s) | NGINX Ingress |
| Containerization | Docker, Docker Compose |
| Orchestration | Kubernetes (Minikube / AKS) |
| Cloud | Azure Kubernetes Service (West Europe) |
| CI/CD | GitHub Actions, ghcr.io |

---

## Prerequisites

- [Node.js 20+](https://nodejs.org)
- [Docker & Docker Compose](https://docs.docker.com/get-docker/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/) *(for Kubernetes deploy)*
- [Minikube](https://minikube.sigs.k8s.io/) *(for local Kubernetes)*

---

## Quick Start — Docker Compose (recommended)

```bash
# 1. Clone the repo
git clone https://github.com/NeyamatUllah/restauranty.git
cd restauranty

# 2. Create .env files from examples
cp src/backend/auth/.env.example src/backend/auth/.env
cp src/backend/discounts/.env.example src/backend/discounts/.env
cp src/backend/items/.env.example src/backend/items/.env
# Fill in MONGODB_URI, SECRET, CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET

# 3. Start everything
docker compose up
```

| Service | URL |
|---|---|
| App | http://localhost |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3030 (admin / admin) |

---

## Local Development (without Docker)

```bash
# Terminal 1 — Auth
cd src/backend/auth && npm install && npm start

# Terminal 2 — Discounts
cd src/backend/discounts && npm install && npm start

# Terminal 3 — Items
cd src/backend/items && npm install && npm start

# Terminal 4 — Frontend
cd src/client && npm install && npm start

# Start HAProxy
haproxy -f src/haproxy.cfg
```

---

## Kubernetes Deployment

### Local — Minikube

```bash
# 1. Start Minikube
minikube start
minikube addons enable ingress

# 2. Create secrets
cp infrastructure/k8s/secrets.yaml.example infrastructure/k8s/secrets.yaml
# Fill in base64-encoded values — see docs/SECRETS.md
kubectl apply -f infrastructure/k8s/secrets.yaml
rm infrastructure/k8s/secrets.yaml

# 3. Deploy all services
kubectl apply -f infrastructure/k8s/

# 4. Verify
kubectl get pods
kubectl get ingress
```

### Cloud — Azure Kubernetes Service (AKS)

The app is deployed to AKS in West Europe in a dedicated `restauranty` namespace, isolated from other workloads on the shared cluster.

**Live URLs:**

| Endpoint | URL |
|---|---|
| App | http://restauranty.40.114.182.90.nip.io |
| Auth API | http://restauranty.40.114.182.90.nip.io/api/auth/ |
| Discounts API | http://restauranty.40.114.182.90.nip.io/api/discounts/ |
| Items API | http://restauranty.40.114.182.90.nip.io/api/items/ |

To redeploy manually (requires Azure CLI and `kubectl` configured):

```bash
# Get cluster credentials
az aks get-credentials \
  --resource-group rg-3tier-aks-neyamat \
  --name aks-3tier-neyamat

# Create/update secrets
kubectl create secret generic restauranty-secrets \
  --namespace restauranty \
  --from-literal=MONGODB_URI="<uri>" \
  --from-literal=SECRET="<jwt-secret>" \
  --from-literal=ORIGIN="http://restauranty.40.114.182.90.nip.io" \
  --from-literal=CLOUD_NAME="<cloudinary-name>" \
  --from-literal=CLOUD_API_KEY="<key>" \
  --from-literal=CLOUD_API_SECRET="<secret>" \
  --dry-run=client -o yaml | kubectl apply -f -

# Deploy with Helm
helm upgrade --install restauranty infrastructure/helm \
  --namespace restauranty \
  --create-namespace \
  --wait

# Verify
kubectl get pods -n restauranty
helm list -n restauranty
```

> The ingress uses host-based routing (`restauranty.40.114.182.90.nip.io`) so it coexists with other apps on the shared NGINX Ingress controller without path conflicts.

### Helm Chart

The Kubernetes deployment is managed via a Helm chart at `infrastructure/helm/`.

| Command | Description |
|---|---|
| `helm upgrade --install restauranty infrastructure/helm -n restauranty --create-namespace` | Install or upgrade the release |
| `helm list -n restauranty` | Show the current release status |
| `helm rollback restauranty -n restauranty` | Roll back to the previous release |
| `helm uninstall restauranty -n restauranty` | Remove all chart resources |

Key values in `infrastructure/helm/values.yaml`:

| Value | Default | Description |
|---|---|---|
| `image.owner` | `neyamatullah` | GitHub Container Registry owner |
| `image.tag` | `latest` | Docker image tag |
| `replicas.*` | `1` | Replicas per service |
| `ingress.host` | `restauranty.40.114.182.90.nip.io` | Public hostname |
| `ingress.ip` | `40.114.182.90` | LB IP for monitoring ingress |
| `monitoring.enabled` | `true` | Toggle Prometheus + Grafana |
| `mongo.storage` | `1Gi` | MongoDB PVC size |

To override values at deploy time:

```bash
helm upgrade --install restauranty infrastructure/helm \
  --namespace restauranty \
  --set image.tag=v1.2.0 \
  --set replicas.auth=2
```

#### Azure LB health probe

By default AKS configures the Load Balancer health probe as HTTP `GET /` on the ingress node port. If there is no wildcard-host ingress serving `/`, nginx returns 404 and Azure marks the backend unhealthy — blocking all external traffic.

Fix: switch the probe to TCP (checks the port is open, which is all an ingress controller needs):

```bash
az network lb probe update \
  --resource-group MC_rg-3tier-aks-neyamat_aks-3tier-neyamat_westeurope \
  --lb-name kubernetes \
  --name ab501583bb93c4ed4b7e54745dac07ff-TCP-80 \
  --protocol Tcp \
  --path ""
```

> Re-apply this after any AKS node pool upgrade, as AKS may reconcile the LB configuration and reset the probe back to HTTP.

---

## CI/CD Pipeline

GitHub Actions (`.github/workflows/ci-cd.yaml`) runs on every push to `main` (skips doc-only changes):

| Job | Trigger | Action |
|---|---|---|
| Build & Test | push + PR | `npm ci` for auth, discounts, items |
| Build & Push | merge to main | Builds & pushes Docker images to ghcr.io |
| Deploy | after build | `kubectl apply` to AKS (`restauranty` namespace) |

Required secrets: see [docs/SECRETS.md](docs/SECRETS.md)

---

## Monitoring

| Service | Local (Docker Compose) | AKS |
|---|---|---|
| Prometheus | http://localhost:9090 | http://prometheus.40.114.182.90.nip.io |
| Grafana | http://localhost:3030 (admin / admin) | http://grafana.40.114.182.90.nip.io (admin / admin) |

Prometheus scrapes `/metrics` from all 3 services every 15s. The Grafana **Restauranty** dashboard auto-provisions on startup — no manual setup needed.

Metrics available: HTTP request rate, error rate, total users, requests by route.

---

## Project Structure

```
restauranty/
├── README.md
├── SECURITY.md
├── docker-compose.yaml
├── haproxy.cfg                          # local dev routing
├── haproxy-docker.cfg                   # Docker Compose routing
│
├── src/                                 # application source
│   ├── backend/
│   │   ├── auth/                        # JWT auth service (port 3001)
│   │   ├── discounts/                   # coupons & campaigns (port 3002)
│   │   └── items/                       # menu & dietary (port 3003)
│   └── client/                          # React SPA (port 3000)
│       └── src/
│           ├── components/              # Navbar, route guards, UI widgets
│           ├── context/                 # auth context
│           ├── pages/                   # Admin, Login, Signup, Home…
│           └── services/               # Axios API calls
│
├── infrastructure/
│   ├── k8s/                             # 20 Kubernetes manifests
│   │   ├── ingress.yaml                 # restauranty.40.114.182.90.nip.io
│   │   ├── monitoring-ingress.yaml      # Prometheus + Grafana public URLs
│   │   ├── grafana-configmaps.yaml      # datasource + dashboard provisioning
│   │   ├── network-policies.yaml
│   │   ├── secrets.yaml.example
│   │   └── {auth,discounts,items,frontend,mongo,grafana,prometheus}-*.yaml
│   └── monitoring/
│       ├── prometheus.yaml
│       ├── grafana-dashboard.json
│       └── grafana/provisioning/
│           ├── datasources/prometheus.yaml
│           └── dashboards/dashboard.yaml
│
├── .github/
│   └── workflows/
│       └── ci-cd.yaml                   # CI → build/push → deploy to AKS
│
└── docs/
    ├── SECRETS.md
    └── TODO.md
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Service port (3001 / 3002 / 3003) |
| `MONGODB_URI` | MongoDB connection string |
| `SECRET` | JWT signing secret (min 32 chars) |
| `ORIGIN` | Allowed CORS origin |
| `CLOUD_NAME` | Cloudinary cloud name |
| `CLOUD_API_KEY` | Cloudinary API key |
| `CLOUD_API_SECRET` | Cloudinary API secret |

---

## Security

See [SECURITY.md](SECURITY.md) for the full security policy covering secret management, JWT, CORS, password hashing, and Kubernetes RBAC.
