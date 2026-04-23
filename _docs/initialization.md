# 🚀 Project Initialization

This guide provides step-by-step instructions to set up the **UGSkill** development environment on your local machine.

---

## 1. Prerequisites

Ensure you have the following installed:
- **Node.js**: v20 or higher
- **Package Manager**: npm (v10+)
- **Databases**:
  - **PostgreSQL**: v15+ (Local or Supabase)
  - **MongoDB**: v6+ (Local or Atlas)
  - **Redis**: v7+ (Local)

---

## 2. Repository Setup

Clone the repository and install dependencies for both backend and frontend.

```bash
# Clone the repo
git clone https://github.com/Nikhil-Vzo/UG-Skill.git
cd ugskill

# Setup Backend
cd ugskill-api
npm install

# Setup Frontend
cd ../ugskill-web
npm install
```

---

## 3. Environment Configuration

The application requires specific environment variables to function correctly across both the API and the Web client.

> [!IMPORTANT]
> **Ask the developer** for the `.env` values. Do not attempt to guess or use default production keys.

### Backend (`ugskill-api`)
Create a `.env` file in the `ugskill-api/` directory. For the required keys and values:
**Ask the developer.**

### Frontend (`ugskill-web`)
Create a `.env` file in the `ugskill-web/` directory. For the required keys and values:
**Ask the developer.**

---

## 4. Database Initialization

### PostgreSQL (Drizzle)
Push the schema to your database:
```bash
cd ugskill-api
npx drizzle-kit push
```

### MongoDB
Ensure MongoDB is running locally at `localhost:27017` or update the connection string.

### Seed Test Accounts
After the schema is pushed, seed the development test accounts:
```bash
cd ugskill-api
npm run seed:dev
```

This creates three portal-specific test accounts:

| Portal | Role | Email | Password | Login URL |
|--------|------|-------|----------|-----------|
| **Student** | `student` | `student@ugskill.com` | `Student@123` | `/login` |
| **Admin** | `super_admin` | `admin@ugskill.com` | `Admin@123` | `/admin` |
| **HR / Recruiter** | `hr` | `hr@ugskill.com` | `Hr@123` | `/hr` |

> [!NOTE]
> Each portal has its own login page and dashboard. Roles are enforced server-side — a student cannot access admin routes and vice versa.

---

## 5. Running the Application

### Start Backend
```bash
cd ugskill-api
npm run dev
```

### Start Frontend
```bash
cd ugskill-web
npm run dev
```

---

## 6. Health Check

Once the backend is running, you can verify its status and the connectivity of downstream services (PostgreSQL, MongoDB, Redis) via the health endpoint:

- **Endpoint**: `GET /api/v1/health`
- **URL**: `http://localhost:5000/api/v1/health` (or port `4000` if using Docker)

**Example Response:**
```json
{
  "success": true,
  "data": {
    "status": "UP",
    "timestamp": "2026-04-18T06:10:54.000Z",
    "services": {
      "database": "CONNECTED",
      "mongodb": "CONNECTED",
      "redis": "CONNECTED"
    }
  }
}
```

---

## 7. API Documentation (Swagger)

For a detailed view of all available endpoints (LMS, Placement, Exams, AI) and their request/response schemas, use the interactive Swagger UI.

- **URL**: `http://localhost:5000/api/v1/docs`
- **Raw JSON**: `http://localhost:5000/api/v1/docs.json`

> [!NOTE]
> Swagger is enabled only in **development mode** (when `NODE_ENV` is not `production`).

---

## 8. Docker Setup (Alternative)

If you prefer using Docker to manage your infrastructure (databases + API):

```bash
cd ugskill-api

# Build and start services
docker-compose up -d --build
```

**Services initialized by Docker:**
- **API**: `http://localhost:4000`
- **MongoDB**: `localhost:27017`
- **Redis**: `localhost:6379`

> [!IMPORTANT]
> Even with Docker, you **must** provide a `.env` file in the `ugskill-api/` directory with values for `PG_DATABASE_URL`, `JWT_SECRET`, etc. **Ask the developer** for these values.

---

## 9. Troubleshooting

If you encounter issues with:
- **Database Connection**: Verify your `.env` settings (Ask the developer).
- **Socket.io**: Ensure Redis is running.
- **Node Modules**: Try deleting `node_modules` and running `npm install` again.

For any other technical queries, **Ask the developer.**


