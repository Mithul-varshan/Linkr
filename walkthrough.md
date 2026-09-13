# Walkthrough: Stage 1 - Standalone Auth Service Extraction

We have successfully completed **Stage 1** of transforming Linkr into a microservices architecture.

---

## 1. Architecture Implemented

```
                         React
                        :5173
                          │
                          │
                          ▼
                  ┌───────────────┐
                  │ Main Server   │
                  │ / Gateway     │
                  │    :5000      │
                  └───────┬───────┘
                          │
              ┌───────────┴───────────┐
              │                       │
         /api/auth/*             /shorten
         /auth/*                 /my-links
              │                  /:code
              ▼                       │
      ┌──────────────┐                │
      │ Auth Service │                │
      │    :5002     │                │
      └──────┬───────┘                │
             │                        │
             ▼                        ▼
          MySQL                  Redis + MySQL
          users                     urls
```

### JWT Flow Implemented
```
Auth Service (:5002)
     │
     │ Creates signed JWT (using shared JWT_SECRET)
     ▼
    JWT
     │ (Client includes in Authorization: Bearer <token>)
     └──────────────┐
                    ▼
              Main Server (:5000)
                    │
               Verifies JWT signature (stateless, using JWT_SECRET)
                    │ Extracts req.user = { id: decoded.id }
                    ▼
                URL Logic (Redis + MySQL urls table)
```

---

## 2. Key Concepts Demonstrated

| Concept | Implementation in Stage 1 |
| :--- | :--- |
| **Microservice** | Auth service runs as an independent Node process on port `5002`. |
| **Service Isolation** | Auth service solely owns the `users` table, password hashing, and user credential verification. |
| **Database Ownership** | Main server no longer queries the `users` table directly. |
| **Reverse Proxy** | Main server (`:5000`) proxies `/api/auth/*` and `/auth/*` to Auth Service (`:5002`) using `http-proxy-middleware`. |
| **Stateless JWT Auth** | Main server verifies token signatures using `JWT_SECRET` and extracts `user.id` without querying any user database. |
| **Backward Compatibility** | The React frontend (`:5173`) requires 0 changes and connects seamlessly to `http://localhost:5000`. |
| **Unified Workspace** | Root `package.json` coordinates `services/auth-service`, `server`, and `client`. |

---

## 3. Files Created & Modified

### New Auth Service (`services/auth-service/`)
- [`services/auth-service/package.json`](file:///c:/Users/ASUS/Desktop/Linkr/Linkr/services/auth-service/package.json): Independent dependencies & npm scripts.
- [`services/auth-service/.env`](file:///c:/Users/ASUS/Desktop/Linkr/Linkr/services/auth-service/.env): Service config (Port 5002, DB credentials, JWT settings).
- [`services/auth-service/config/db.js`](file:///c:/Users/ASUS/Desktop/Linkr/Linkr/services/auth-service/config/db.js): MySQL pool connection.
- [`services/auth-service/models/userModel.js`](file:///c:/Users/ASUS/Desktop/Linkr/Linkr/services/auth-service/models/userModel.js): DB queries for `users` (`findByEmail`, `findById`, `createUser`).
- [`services/auth-service/controllers/authController.js`](file:///c:/Users/ASUS/Desktop/Linkr/Linkr/services/auth-service/controllers/authController.js): `signup`, `login`, `getMe`, and `verifyToken`.
- [`services/auth-service/middleware/authMiddleware.js`](file:///c:/Users/ASUS/Desktop/Linkr/Linkr/services/auth-service/middleware/authMiddleware.js): Internal JWT protect middleware for `/me`.
- [`services/auth-service/routes/authRoutes.js`](file:///c:/Users/ASUS/Desktop/Linkr/Linkr/services/auth-service/routes/authRoutes.js): Route handlers with aliases for `/signup`, `/login`, `/me`, `/verify`.
- [`services/auth-service/server.js`](file:///c:/Users/ASUS/Desktop/Linkr/Linkr/services/auth-service/server.js): Standalone Express server on port 5002 with `/health`.

### Updated Main Server / Gateway (`server/`)
- [`server/app.js`](file:///c:/Users/ASUS/Desktop/Linkr/Linkr/server/app.js): Added reverse proxy for `/api/auth` and `/auth` routes forwarding to `AUTH_SERVICE_URL` (`http://localhost:5002`).
- [`server/middleware/authMiddleware.js`](file:///c:/Users/ASUS/Desktop/Linkr/Linkr/server/middleware/authMiddleware.js): Converted to stateless JWT signature verification (`req.user = { id: decoded.id }`), removing coupling to the `users` table.
- [`server/server.js`](file:///c:/Users/ASUS/Desktop/Linkr/Linkr/server/server.js): Added resilient fallback when Redis is offline so server always boots.
- [`server/controllers/urlController.js`](file:///c:/Users/ASUS/Desktop/Linkr/Linkr/server/controllers/urlController.js): Guarded Redis cache lookups and sets to fall back cleanly to MySQL.
- [`server/.env`](file:///c:/Users/ASUS/Desktop/Linkr/Linkr/server/.env) & [`server/.env.example`](file:///c:/Users/ASUS/Desktop/Linkr/Linkr/server/.env.example): Added `AUTH_SERVICE_URL=http://localhost:5002`.

### Root Monorepo (`package.json`)
- [`package.json`](file:///c:/Users/ASUS/Desktop/Linkr/Linkr/package.json): Added `services/*` to workspaces and added `concurrently` scripts (`npm run dev`, `npm run dev:auth`, `npm run dev:server`, `npm run dev:client`).

---

## 4. Verification & Testing Results

| Test Scenario | Endpoint / Action | Result |
| :--- | :--- | :--- |
| **Auth Service Health** | `GET http://localhost:5002/health` | `HTTP 200` (`"service": "auth-service", "status": "alive"`) |
| **Gateway Health** | `GET http://localhost:5000/health` | `HTTP 200` (`"service": "main-server-gateway", "authServiceUrl": "http://localhost:5002"`) |
| **Proxy Signup & Login** | `POST http://localhost:5000/api/auth/login` | `HTTP 200` Returns JWT token and user info |
| **Proxy Profile (`/auth/me`)** | `GET http://localhost:5000/auth/me` with Bearer token | `HTTP 200` Returns `{ user: { id: 600001, email: ... } }` |
| **Protected URL Shorten** | `POST http://localhost:5000/shorten` with Bearer token | `HTTP 200` Token verified by Main Server; short URL created |
| **Protected User Links** | `GET http://localhost:5000/my-links` with Bearer token | `HTTP 200` Retrieves created link attributed to user `600001` |
| **URL Redirection** | `GET http://localhost:5000/stage1test` | `HTTP 302 Found` with `Location: https://github.com/google/antigravity` |
| **Link Deletion** | `DELETE http://localhost:5000/my-links/:id` with Bearer token | `HTTP 200` (`"link deleted successfully"`) |

---

## 5. How to Run Locally

To run all services together with hot reload:
```bash
npm run dev
```

Or run individual services:
```bash
npm run dev:auth     # Starts Auth Service on :5002
npm run dev:server   # Starts Main Server / Gateway on :5000
npm run dev:client   # Starts React Frontend on :5173
```
