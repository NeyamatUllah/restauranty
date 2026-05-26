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
- [ ] Test: `kubectl apply -f infrastructure/k8s/` on Minikube — verify Ingress routes correctly

---

## Phase 3 — CI/CD Pipeline

- [x] Create `.github/workflows/` folder
- [x] Write `.github/workflows/ci-cd.yaml` with:
  - [x] CI job: lint + build each service on every pull request
  - [x] CD job: build & push Docker images to ghcr.io on merge to main
  - [x] CD job: deploy to Kubernetes (`kubectl apply`) on merge to main
- [x] Add required secrets to GitHub repo settings:
  - [ ] `KUBE_CONFIG`
  - [x] `MONGODB_URI`, `SECRET`, `ORIGIN`, `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`
- [x] Test: open a PR and verify CI runs and passes

---

## Phase 4 — Monitoring & Logging

- [x] Create `infrastructure/monitoring/` folder
- [x] Write `infrastructure/monitoring/prometheus.yaml` (scrape configs for all 3 `/metrics` endpoints)
- [x] Write `infrastructure/monitoring/grafana-dashboard.json` (HTTP request rate, error rate, user count panels)
- [x] Add Prometheus + Grafana to `docker-compose.yaml` for local testing
- [x] Add Prometheus + Grafana K8s manifests (or Helm values) to `infrastructure/k8s/`
- [ ] Test: open Grafana at `localhost:3030` — confirm metrics flowing from all 3 services

---

## Phase 5 — Security & Compliance

- [ ] Write `SECURITY.md` at project root covering:
  - [ ] Secret management approach (`.env` locally, K8s Secrets in production)
  - [ ] JWT signing and token expiry policy
  - [ ] CORS policy (lock down `origin: '*'` for production)
  - [ ] User data handling (bcrypt, no PII in logs)
  - [ ] IAM / RBAC notes for Kubernetes
- [ ] Review and tighten `network-policies.yaml` (confirm services cannot reach each other except via Ingress)
- [ ] Confirm no `.env` files are tracked in git

---

## Phase 6 — Documentation

- [ ] Write `README.md` at project root covering:
  - [ ] Project overview
  - [ ] Prerequisites (Node.js, Docker, kubectl, HAProxy)
  - [ ] Local dev runbook (MongoDB + 4 terminals + HAProxy)
  - [ ] Docker Compose runbook
  - [ ] Kubernetes deploy runbook
  - [ ] How to view metrics (Prometheus / Grafana)
  - [ ] Environment variable reference

---

## Progress Summary

| Phase | Status | Notes |
|---|---|---|
| 0 — Code Fixes | **done** | 3 bugs + 1 doc fix |
| 1 — Containerization | **done** | All 6 services confirmed Up via docker compose ps |
| 2 — Kubernetes | **done** | 14 manifests in infrastructure/k8s/ — Minikube test pending |
| 3 — CI/CD | **done** | CI + build/push passing; deploy fails (expected — no K8s cluster yet) |
| 4 — Monitoring | **in progress** | Prometheus + Grafana written; local test pending |
| 5 — Security | not started | |
| 6 — Documentation | not started | |
