# 🏠 RentWeb - Smart Property Management Platform

<div align="center">

**A modern full-stack property management system enabling efficient collaboration between agents and tenants**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2d3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-7-dc382d?style=flat-square&logo=redis)](https://redis.io/)

[Quick Start](#-quick-start) | [Documentation](./my-app/README.md)

</div>

---

## 📖 Overview

RentWeb is a comprehensive property management system that digitizes traditional property management workflows. It streamlines communication between property agents and tenants through features like maintenance ticket management, online rent payments, and property inspection scheduling.

### Core Features

- 🎫 **Smart Ticket System** - Maintenance request management with priority handling
- 💳 **Online Payments** - Stripe integration for secure rent payments
- 🔍 **Inspection Scheduling** - Coordinate property inspections
- 👥 **Role-Based Access** - Separate portals for agents and tenants
- 💬 **Comment System** - Real-time communication on tickets

---

## 🎯 Technical Highlights

| Feature | Implementation | Impact |
|---------|---------------|---------|
| **3-Tier Architecture** | Controller-Service-Repository | Clean separation of concerns |
| **Dual-Layer Caching** | React Query + Redis | 10x faster response time |
| **RBAC** | NextAuth.js | Secure role-based permissions |
| **Payment Gateway** | Stripe API + Webhooks | PCI DSS compliant |
| **API Rate Limiting** | Redis Sliding Window | Protection against abuse |
| **CI/CD** | GitHub Actions | Automated testing & deployment |

---

## 🛠️ Tech Stack

**Frontend**
- Next.js 16 (App Router) + React 19
- TypeScript for type safety
- React Query v5 (TanStack) for data caching
- Tailwind CSS + Shadcn UI components

**Backend**
- Next.js API Routes (RESTful)
- Prisma ORM + PostgreSQL
- Redis for caching & rate limiting
- NextAuth.js for authentication
- Stripe API for payments

**DevOps**
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- Jest for unit testing
- ESLint + TypeScript

---

## 🏛️ Architecture

### 3-Tier Architecture Pattern

```
API Routes (Controller)
    ↓
Services (Business Logic)
    ↓
Repositories (Data Access)
    ↓
Database (PostgreSQL)
```

### Dual-Layer Caching

```
User Request
    ↓
React Query Cache (Frontend, 60s)
    ↓ Miss
Redis Cache (Backend, 60s)
    ↓ Miss
Database Query
```

**Performance:** 100ms → 10ms (Redis) → <1ms (React Query)

---

## 📊 Database Schema

```
User (AGENT | TENANT)
├── Properties
│   ├── Tickets (Maintenance)
│   │   └── TicketReplies
│   ├── Invoices (Rent)
│   └── Inspections
└── Invitations
```

**Key Relationships:**
- One property per tenant (unique constraint)
- Many tickets per property
- Stripe payment tracking on invoices

---

## 🚧 Status

### ✅ Implemented
- User authentication & RBAC
- Ticket management with comments
- Stripe payment integration
- Inspection scheduling
- React Query + Redis caching
- API rate limiting
- CI/CD pipeline
- Unit tests

### 📋 Roadmap
- Real-time notifications (WebSocket)
- File upload system
- Email notifications
- Analytics dashboard

---

## 📚 Documentation

- [Technical Guide](./my-app/README.md) - Full architecture documentation
- [Setup Guide](./my-app/START_LOCAL.md) - Local development setup

---

## 📝 Development Timeline

**Nov 2024 - Jan 2025** (3 months)

- Architecture design & tech selection
- Core features implementation
- Caching optimization
- Testing & CI/CD setup

---

## 🎓 Key Learnings

- Full-stack development with Next.js 16 App Router
- 3-tier architecture implementation
- Type-safe development with TypeScript & Prisma
- Performance optimization with dual-layer caching
- Payment gateway integration (Stripe)
- Authentication & authorization patterns
- Docker containerization
- CI/CD automation

---

## 📄 License

MIT License

---

## 👨‍💻 Author

**ZephyrDeen**

- GitHub: [@ZephyrDeen](https://github.com/ZephyrDeen)
- Project: [RentWeb](https://github.com/ZephyrDeen/RentWeb)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with Next.js 16 & React 19

</div>
