# Restauranty — Presentation Outline (Google Slides)

**IronHack Week 9 Final Project**
**Speaker:** Neyamat Ullah
**Repo:** https://github.com/NeyamatUllah/restauranty
**Live app:** http://restauranty.40.114.182.90.nip.io

---

## Slide 1 — Title

**Title:** Restauranty: End-to-End DevOps Deployment
**Subtitle:** IronHack Week 9 Final Project — Neyamat Ullah
**Footer:** `github.com/NeyamatUllah/restauranty` | `restauranty.40.114.182.90.nip.io`

---

## Slide 2 — What is Restauranty?

**Title:** The Project

- Restaurant management platform with an admin dashboard
- Manage menu items, discounts, coupons, and users
- Built with a real microservices architecture
- Goal: take raw source code → fully deployed, monitored, secured cloud app

**Visual:** Screenshot of the live frontend

---

## Slide 3 — Architecture

**Title:** Microservices Architecture

```
Browser → HAProxy / NGINX Ingress
              ├── /api/auth      → Auth Service (Node.js :3001)
              ├── /api/items     → Items Service (Node.js :3003)
              ├── /api/discounts → Discounts Service (Node.js :3002)
              └── /              → React Frontend (:3000)
                          ↓
                       MongoDB (:27017)
```

- 3 independent Node.js/Express services
- React SPA frontend
- Single entry point (HAProxy locally, NGINX Ingress on K8s)
- MongoDB shared database

**Visual:** Architecture diagram from README

---

## Slide 4 — Tech Stack

**Title:** Technology Stack

| Layer | Tool |
|---|---|
| Frontend | React, Axios |
| Backend | Node.js, Express, JWT |
| Database | MongoDB |
| Routing (local) | HAProxy |
| Containerization | Docker, Docker Compose |
| Orchestration | Kubernetes (AKS) |
| Package Manager | Helm |
| CI/CD | GitHub Actions |
| Registry | GitHub Container Registry (ghcr.io) |
| Monitoring | Prometheus + Grafana |
| Cloud | Azure Kubernetes Service — West Europe |

---

## Slide 5 — Phase 1: Containerization

**Title:** Containerizing All Services

- Written **4 Dockerfiles** (auth, discounts, items, client)
- **docker-compose.yaml** wires all 8 services together:
  - 3 backends + React frontend + MongoDB + HAProxy + Prometheus + Grafana
- Single command to run everything locally:

```bash
docker compose up
```

**Visual:** `docker compose ps` output showing all 8 services Up

---

## Slide 6 — Phase 2: Kubernetes

**Title:** Kubernetes Orchestration

- **21 manifest files** in `infrastructure/k8s/`
- Deployments + Services for every component
- MongoDB as a StatefulSet with persistent volume
- **NGINX Ingress** replicates HAProxy routing in K8s
- **NetworkPolicies** — services cannot talk to each other directly, only through Ingress
- Tested locally on Minikube, deployed to AKS

**Visual:** `kubectl get pods -n restauranty` showing all 7 pods Running

---

## Slide 7 — Helm Chart

**Title:** Packaging with Helm

- All 21 manifests converted to a Helm chart at `infrastructure/helm/`
- Single command replaces `kubectl apply` on every service:

```bash
helm upgrade --install restauranty infrastructure/helm \
  --namespace restauranty --create-namespace --wait
```

- Key values configurable without touching manifests:

| Value | What it controls |
|---|---|
| `image.tag` | Pin a specific Docker image version |
| `replicas.*` | Scale any service independently |
| `monitoring.enabled` | Toggle Prometheus + Grafana on/off |
| `ingress.host` | Redeploy to a different cluster/domain |

- `helm rollback restauranty` — instant one-command rollback to previous release

**Visual:** `helm list -n restauranty` showing the release

---

## Slide 8 — Phase 3: CI/CD Pipeline

**Title:** Automated CI/CD with GitHub Actions

3-stage pipeline on every push to `main`:

```
┌─────────┐    ┌─────────────────┐    ┌──────────────────┐
│   CI    │───▶│  Build & Push   │───▶│  Deploy to AKS   │
│         │    │                 │    │                  │
│ npm ci  │    │ docker build    │    │ helm upgrade     │
│ 3 svcs  │    │ push → ghcr.io  │    │ --install        │
└─────────┘    └─────────────────┘    └──────────────────┘
```

- PRs only run CI (no deploy)
- Doc-only changes skipped entirely
- 7 GitHub secrets manage all credentials securely

**Visual:** GitHub Actions green pipeline screenshot

---

## Slide 9 — Phase 4: Monitoring

**Title:** Prometheus + Grafana Monitoring

- All 3 services expose `/metrics` endpoint
- Prometheus scrapes every 15 seconds
- Grafana **auto-provisions** datasource + dashboard on startup — no manual setup needed
- Dashboard panels:
  - HTTP request rate per service
  - Error rate
  - Total registered users
  - Requests by route

| Service | URL |
|---|---|
| Prometheus | http://prometheus.40.114.182.90.nip.io |
| Grafana | http://grafana.40.114.182.90.nip.io (admin / admin) |

**Visual:** Grafana dashboard screenshot with live metrics

---

## Slide 10 — Phase 5: Security

**Title:** Security & Compliance

| Area | What was done |
|---|---|
| Secrets | Never in git — `.env` locally, K8s Secrets in production |
| Authentication | JWT on all protected routes |
| CORS | `process.env.ORIGIN` — no hardcoded `*` in production |
| Network | K8s NetworkPolicies — deny all, allow only what's needed |
| Passwords | bcryptjs hashing — no plaintext ever stored |
| Code fixes | Fixed `user.findByIdAndUpdate` TypeError, added auth guards to all write routes |

**Deliverable:** `SECURITY.md` documents the full policy

---

## Slide 11 — Cloud Deployment (AKS)

**Title:** Live on Azure Kubernetes Service

- Cluster: `aks-3tier-neyamat` — West Europe (Amsterdam)
- Dedicated `restauranty` namespace — isolated from other workloads on shared cluster
- Host-based Ingress routing via nip.io wildcard DNS
- Every merge to `main` auto-deploys via GitHub Actions

| Endpoint | URL |
|---|---|
| App | http://restauranty.40.114.182.90.nip.io |
| Auth API | http://restauranty.40.114.182.90.nip.io/api/auth/ |
| Discounts API | http://restauranty.40.114.182.90.nip.io/api/discounts/ |
| Items API | http://restauranty.40.114.182.90.nip.io/api/items/ |
| Prometheus | http://prometheus.40.114.182.90.nip.io |
| Grafana | http://grafana.40.114.182.90.nip.io |

**Visual:** Azure portal showing the AKS cluster

---

## Slide 12 — Challenges & Solutions

**Title:** What Went Wrong (and How I Fixed It)

**Challenge 1: Azure LB health probe blocking all traffic**
- Problem: AKS configures the LB probe as HTTP GET `/` — nginx returns 404 with host-based routing → backend marked unhealthy → all external traffic dropped
- Fix: Switched probe protocol from HTTP to TCP — port open = healthy

**Challenge 2: Grafana had no dashboards on K8s**
- Problem: Docker Compose used volume mounts for provisioning — K8s has no equivalent
- Fix: Created 3 ConfigMaps mounted at Grafana's provisioning paths — auto-provisions on startup

**Challenge 3: Ingress conflict on shared cluster**
- Problem: Wildcard host ingress clashed with other students' apps on the same controller
- Fix: Dedicated namespace + host-based ingress (`restauranty.<ip>.nip.io`)

---

## Slide 13 — Project Structure

**Title:** What's in the Repo

```
restauranty/
├── src/                    # 3 backends + React client
│   ├── backend/
│   │   ├── auth/           # JWT auth service
│   │   ├── discounts/      # coupons & campaigns
│   │   └── items/          # menu & dietary
│   └── client/             # React SPA
├── infrastructure/
│   ├── k8s/                # 21 raw Kubernetes manifests
│   ├── helm/               # Helm chart (Chart.yaml, values.yaml, templates/)
│   └── monitoring/         # Prometheus + Grafana config
├── .github/workflows/      # CI/CD pipeline
├── docker-compose.yaml
├── README.md
└── SECURITY.md
```

**GitHub:** https://github.com/NeyamatUllah/restauranty

---

## Slide 14 — What I Learned

**Title:** Key Takeaways

- Microservices are only as good as the infrastructure around them
- Kubernetes solves orchestration but adds its own complexity (secrets, probes, namespaces)
- CI/CD is the multiplier — every improvement ships automatically
- Monitoring is not optional — you can't fix what you can't see
- Cloud providers have quirks — always verify LB health probe defaults

---

## Slide 15 — What's Next

**Title:** Future Improvements

| Improvement | Why |
|---|---|
| **Terraform** | Provision the AKS cluster as code, not manually via Azure portal |
| **Loki** | Centralized log aggregation alongside Grafana |
| **HPA** | Horizontal Pod Autoscaler for handling traffic spikes |
| **HTTPS / TLS** | cert-manager + Let's Encrypt for production-grade security |

---

## Slide 16 — Live Demo & Q&A

**Title:** Live Demo

Demo steps:
1. Open the live app — http://restauranty.40.114.182.90.nip.io
2. Show Grafana dashboard with live metrics — http://grafana.40.114.182.90.nip.io
3. Open GitHub Actions — push a small change, watch CI/CD deploy to AKS in real time

**"Any questions?"**

---

## Presenter Notes

- Open all URLs in browser tabs **before** the presentation starts
- Have the GitHub Actions page ready at `github.com/NeyamatUllah/restauranty/actions`
- Make a small commit beforehand to confirm the pipeline is green
- Estimated time: **10–15 minutes** including demo
