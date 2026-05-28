# Restauranty — Project TODO & Progress Tracker

## How to use this file
- [ ] = not started
- [~] = in progress
- [x] = done

---

## Phase 0 — Code Fixes (do these first)

- [x] Fix default user role: `src/backend/auth/models/User.model.js:24` — change `default: 'admin'` to `default: 'user'`
- [x] Fix missing `/` on orders route: `src/backend/items/app.js:38` — change `"api/items/orders"` to `"/api/items/orders"`
- [x] Add JWT `isAuthenticated` middleware to POST, PUT, DELETE in `src/backend/discounts/routes/campaigns.routes.js`
- [x] Update `docs/ARCHITECTURE.md` paths from `backend/` to `src/backend/` to match real structure

---

## Phase 1 — Containerization

- [x] Write `Dockerfile` for `src/backend/auth/`
- [x] Write `Dockerfile` for `src/backend/discounts/`
- [x] Write `Dockerfile` for `src/backend/items/`
- [x] Write `Dockerfile` for `src/client/`
- [x] Write `docker-compose.yaml` at project root (wires all services + MongoDB + HAProxy)
- [x] Add `.gitignore` at project root (cover `.env`, `node_modules`, build artifacts)
- [x] Test: `docker compose up` — verify all 4 services start and HAProxy routes correctly

---

## Phase 2 — Kubernetes Orchestration

- [x] Create `infrastructure/k8s/` folder
- [x] Write `infrastructure/k8s/mongo-statefulset.yaml`
- [x] Write `infrastructure/k8s/mongo-service.yaml`
- [x] Write `infrastructure/k8s/auth-deployment.yaml`
- [x] Write `infrastructure/k8s/auth-service.yaml`
- [x] Write `infrastructure/k8s/discounts-deployment.yaml`
- [x] Write `infrastructure/k8s/discounts-service.yaml`
- [x] Write `infrastructure/k8s/items-deployment.yaml`
- [x] Write `infrastructure/k8s/items-service.yaml`
- [x] Write `infrastructure/k8s/frontend-deployment.yaml`
- [x] Write `infrastructure/k8s/frontend-service.yaml`
- [x] Write `infrastructure/k8s/ingress.yaml` (NGINX, mirrors HAProxy routing)
- [x] Write `infrastructure/k8s/secrets.yaml.example` (template only — never commit real values)
- [x] Write `infrastructure/k8s/network-policies.yaml`
- [x] Test: `kubectl apply -f infrastructure/k8s/` on Minikube — verify Ingress routes correctly

---

## Phase 3 — CI/CD Pipeline

- [x] Create `.github/workflows/` folder
- [x] Write `.github/workflows/ci-cd.yaml` with:
  - [x] CI job: lint + build each service on every pull request
  - [x] CD job: build & push Docker images to ghcr.io on merge to main
  - [x] CD job: deploy to Kubernetes (`kubectl apply`) on merge to main
- [x] Add required secrets to GitHub repo settings:
  - [x] `KUBE_CONFIG`
  - [x] `MONGODB_URI`, `SECRET`, `ORIGIN`, `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`
- [x] Test: open a PR and verify CI runs and passes

---

## Phase 4 — Monitoring & Logging

- [x] Create `infrastructure/monitoring/` folder
- [x] Write `infrastructure/monitoring/prometheus.yaml` (scrape configs for all 3 `/metrics` endpoints)
- [x] Write `infrastructure/monitoring/grafana-dashboard.json` (HTTP request rate, error rate, user count panels)
- [x] Add Prometheus + Grafana to `docker-compose.yaml` for local testing
- [x] Add Prometheus + Grafana K8s manifests (or Helm values) to `infrastructure/k8s/`
- [x] Test: open Grafana at `localhost:3030` — confirm metrics flowing from all 3 services

---

## Phase 5 — Security & Compliance

- [x] Write `SECURITY.md` at project root covering:
  - [x] Secret management approach (`.env` locally, K8s Secrets in production)
  - [x] JWT signing and token expiry policy
  - [x] CORS policy (lock down `origin: '*'` for production)
  - [x] User data handling (bcrypt, no PII in logs)
  - [x] IAM / RBAC notes for Kubernetes
- [x] Review and tighten `network-policies.yaml` (confirm services cannot reach each other except via Ingress)
- [x] Confirm no `.env` files are tracked in git

---

## Phase 6 — Documentation

- [x] Write `README.md` at project root covering:
  - [x] Project overview
  - [x] Prerequisites (Node.js, Docker, kubectl, HAProxy)
  - [x] Local dev runbook (MongoDB + 4 terminals + HAProxy)
  - [x] Docker Compose runbook
  - [x] Kubernetes deploy runbook
  - [x] How to view metrics (Prometheus / Grafana)
  - [x] Environment variable reference

---

## Phase 7 — AKS Cloud Deployment

- [x] Use existing AKS cluster (`aks-3tier-neyamat`, West Europe, `rg-3tier-aks-neyamat`)
- [x] Create dedicated `restauranty` namespace to isolate from other workloads
- [x] Add host-based ingress (`restauranty.40.114.182.90.nip.io`) to avoid conflicts with shared NGINX controller
- [x] Add `KUBE_CONFIG` GitHub secret (base64-encoded AKS kubeconfig)
- [x] Scope CI/CD deploy job to `restauranty` namespace
- [x] Add public Ingress for Prometheus and Grafana (`monitoring-ingress.yaml`)
- [x] Fix Grafana dashboard provisioning on K8s via ConfigMaps (`grafana-configmaps.yaml`)
- [x] Test: all 7 pods Running; all 3 APIs and frontend responding; full CI/CD pipeline green

---

## Phase 8 — Helm

- [x] Create `infrastructure/helm/` chart (Chart.yaml, values.yaml, templates/)
- [x] Convert all 21 K8s manifests to parameterised Helm templates
- [x] Add `_helpers.tpl` with shared label and secret env helpers
- [x] Wrap monitoring stack in `monitoring.enabled` flag
- [x] Update CI/CD deploy step from `kubectl apply` to `helm upgrade --install`
- [x] Allow `workflow_dispatch` to trigger build and deploy jobs
- [x] Validate: `helm lint` and `helm template` pass with zero errors
- [x] Test: pipeline green; all 7 pods Running via Helm release on AKS

---

## Progress Summary

| Phase | Status | Notes |
|---|---|---|
| 0 — Code Fixes | **done** | 3 bugs + 1 doc fix |
| 1 — Containerization | **done** | All 8 services confirmed Up via docker compose ps |
| 2 — Kubernetes | **done** | All manifests verified on Minikube — Ingress routes tested end-to-end |
| 3 — CI/CD | **done** | Full pipeline green — CI → build/push → deploy to AKS |
| 4 — Monitoring | **done** | Prometheus scraping all 3 services; Grafana dashboard auto-provisioned |
| 5 — Security | **done** | SECURITY.md written; network policies in place; no .env in git |
| 6 — Documentation | **done** | README.md written covering all phases |
| 7 — AKS Deploy | **done** | Live on AKS (West Europe); all 7 pods running; monitoring URLs public |
| 8 — Helm | **done** | Full Helm chart in infrastructure/helm/; CI/CD uses helm upgrade --install; pipeline green |
