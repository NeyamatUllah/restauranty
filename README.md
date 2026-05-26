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
| Orchestration | Kubernetes |
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

---

## CI/CD Pipeline

GitHub Actions (`.github/workflows/ci-cd.yaml`) runs on every push to `main` (skips doc-only changes):

| Job | Trigger | Action |
|---|---|---|
| Build & Test | push + PR | `npm ci` for auth, discounts, items |
| Build & Push | merge to main | Builds & pushes Docker images to ghcr.io |
| Deploy | after build | `kubectl apply` to Kubernetes cluster |

Required secrets: see [docs/SECRETS.md](docs/SECRETS.md)

---

## Monitoring

- **Prometheus** — scrapes `/metrics` from all 3 services every 15s → `http://localhost:9090`
- **Grafana** — dashboard auto-provisions on start, no manual setup needed → `http://localhost:3030`

Metrics available: HTTP request rate, error rate, total users, requests by route.

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
