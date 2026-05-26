# Security Policy

## 1. Secret Management

### Local Development
Each service reads secrets from its own `.env` file:
- `src/backend/auth/.env`
- `src/backend/discounts/.env`
- `src/backend/items/.env`

These files are listed in `.gitignore` and **must never be committed to git**. Use `.env.example` as a template.

### Production (Kubernetes)
Secrets are stored as a Kubernetes Secret (`restauranty-secrets`) and injected into pods as environment variables. The secret is created via the CI/CD pipeline from GitHub Actions secrets.

```bash
# Never commit secrets.yaml — use the template:
cp infrastructure/k8s/secrets.yaml.example infrastructure/k8s/secrets.yaml
# Fill in values, apply, then delete the file
kubectl apply -f infrastructure/k8s/secrets.yaml
rm infrastructure/k8s/secrets.yaml
```

---

## 2. Authentication & JWT

- All protected routes require a valid JWT in the `Authorization: Bearer <token>` header
- Tokens are signed with **HS256** using the `SECRET` environment variable
- The `isAuthenticated` middleware validates tokens on every protected request
- **Action required for production:** Set a long, random `SECRET` (minimum 32 characters) and rotate it periodically

---

## 3. Password Storage

- Passwords are hashed with **bcrypt** (10 salt rounds) before storage in MongoDB
- Plain-text passwords are never stored or logged
- Password comparison uses `bcrypt.compareSync` — timing-safe by design

---

## 4. CORS Policy

All three services currently use `origin: '*'` which allows requests from any domain.

**This is acceptable for local development but must be restricted for production:**

```js
// Replace in all 3 app.js files before going to production:
app.use(cors({
  origin: process.env.ORIGIN   // set to your actual frontend URL
}));
```

The `ORIGIN` environment variable is already defined in `.env` and Kubernetes secrets — only the code change is needed.

---

## 5. User Data Handling

- Passwords are never returned in API responses (MongoDB projection excludes the `password` field)
- No personally identifiable information (PII) is written to application logs
- User roles default to `user` — admin access must be explicitly granted

---

## 6. Kubernetes RBAC & Network Policies

### Network Policies (`infrastructure/k8s/network-policies.yaml`)
- **Default deny**: all ingress traffic is blocked by default
- **Ingress controller** (NGINX) is the only allowed entry point to app services
- **MongoDB** only accepts connections from `auth`, `discounts`, and `items` pods
- Services cannot communicate directly with each other — all traffic goes through the Ingress

### RBAC
- Use a dedicated `ServiceAccount` per service in production (not the default account)
- Grant only the minimum permissions required (`least privilege`)
- Avoid using `cluster-admin` roles for application workloads

---

## 7. Container Security

- All service images are built on `node:20-alpine` — minimal attack surface
- No processes run as root inside containers (Alpine default)
- Images are built and pushed via CI/CD — no manual image pushes to the registry

---

## 8. Reporting a Vulnerability

If you discover a security issue in this project, please open a private GitHub issue or contact the repository owner directly.
