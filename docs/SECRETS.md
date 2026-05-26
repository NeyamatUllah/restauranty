# GitHub Actions Secrets

These secrets must be added to the GitHub repository before the CI/CD pipeline can run successfully.

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

---

## Required Secrets

| Secret | Description | Example |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | `mongodb://mongo:27017/resturanty` |
| `SECRET` | JWT signing secret | any strong random string |
| `ORIGIN` | Allowed CORS origin | `http://localhost` |
| `CLOUD_NAME` | Cloudinary cloud name | `dqaknd11h` |
| `CLOUD_API_KEY` | Cloudinary API key | found on Cloudinary dashboard |
| `CLOUD_API_SECRET` | Cloudinary API secret | found on Cloudinary dashboard |
| `KUBE_CONFIG` | Base64-encoded kubeconfig | see below |

---

## How to encode KUBE_CONFIG

Run this on the machine where kubectl is configured:

```bash
cat ~/.kube/config | base64 -w 0
```

Copy the output and paste it as the value of the `KUBE_CONFIG` secret.

---

## Which jobs need which secrets

| Secret | CI job | Build & Push job | Deploy job |
|---|---|---|---|
| `MONGODB_URI` | | | ✓ |
| `SECRET` | | | ✓ |
| `ORIGIN` | | | ✓ |
| `CLOUD_NAME` | | | ✓ |
| `CLOUD_API_KEY` | | | ✓ |
| `CLOUD_API_SECRET` | | | ✓ |
| `KUBE_CONFIG` | | | ✓ |
| `GITHUB_TOKEN` | auto | auto | auto |

The `CI` and `Build & Push` jobs do not require any secrets — they will run on every pull request automatically.
