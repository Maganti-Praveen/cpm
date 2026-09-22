# Sai IT Services - Client Relationship & Project Management Portal (Sai CRM)

A full-stack, enterprise-grade Client Relationship and Project Management platform designed to deliver complete project transparency, real-time collaboration, and automated financial operations between service providers and client partners.

---

## Key Features

- **Multi-Role Access Control (RBAC)**: Tailored dashboards and permissions for **Admin**, **Staff**, and **Client** users.
- **Enterprise Security**: JWT stateless authentication, Two-Factor Authentication (2FA via 6-digit OTPs), Express rate limiting, and database audit logs.
- **Project & Milestone Tracking**: Multi-stage project lifecycles (`Planning`, `In Progress`, `Under Review`, `Completed`) with automated milestone progress calculation (0 to 100%).
- **Task Management & Kanban**: Interactive Kanban boards (`To Do`, `In Progress`, `Review`, `Done`), unique task keys (`TSK-101`), and a client deliverable review queue for single-click sign-offs.
- **Financial Engine & Online Billing**: Automated invoice generation, downloadable PDF tax receipts, and integrated **Razorpay** checkout (UPI, Cards, NetBanking, Digital Wallets).
- **Real-Time Communication**: Bi-directional WebSockets (`ws`) supporting direct DMs, group channels, message pinning, and confidential **4-digit PIN locks (`ConversationLock`)**.
- **AI/ML Timeline Forecasting**: Embedded machine learning regression engine (`ml-regression`) computing completion velocity and forecasting target delivery dates.
- **Multi-Channel Alerts**: In-app notification bell counter, VAPID Web Push alerts (desktop and mobile), and multi-provider transactional emails (Resend and SMTP).

---

## Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, Vite, Redux Toolkit, Tailwind CSS v4, Lucide React, Recharts |
| **Backend** | Node.js, Express 5 (ES Modules), WebSockets (`ws`) |
| **Database & ORM**| PostgreSQL (Neon), Prisma ORM v7 |
| **Caching Layer** | Redis 6 |
| **Third-Party Services**| Razorpay (Payments), Cloudinary (CDN), Resend / Nodemailer (Emails), Web Push (VAPID) |

---

## Quick Start (Local Setup)

### 1. Prerequisites
- Node.js (v20+)
- PostgreSQL database
- Redis (optional, fallback supported)

### 2. Installation & Setup

```bash
# Clone the repository
git clone https://github.com/Maganti-Praveen/cpm.git
cd cpm

# Install backend dependencies
cd backend
npm install
npx prisma generate
npx prisma db push

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Run in Development Mode

```bash
# Start Backend (Port 5000)
cd backend
npm run dev

# Start Frontend (Port 5173)
cd ../frontend
npm run dev
```

---

## Deployment on Render

1. **Backend Service**:
   - Environment: `Node`
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npm start`
   - Add Environment Variables (`DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS`, etc.)

2. **Frontend Static Site**:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - Add Rewrite Rule: `/* -> /index.html` (Status `200`)

---

## License

This project is licensed under the ISC License.
