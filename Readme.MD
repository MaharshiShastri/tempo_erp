# Tempo Instruments ERP

> An integrated, AI-assisted enterprise platform for Sales, CRM, Quotations, Orders, Manufacturing, Inventory, Logistics, Billing, Tally synchronization and operational analytics.

**Status:** Active internal development / production-oriented ERP\
**Backend:** FastAPI + SQLAlchemy + PostgreSQL\
**Frontend:** React + Vite\
**Infrastructure:** Docker + Nginx + Redis + Celery\
**AI:** Groq-powered LLM services + ChromaDB\
**Accounting Integration:** Tally\
**Database Migrations:** Alembic

---

## Overview

Tempo Instruments ERP is an internally developed enterprise resource planning platform designed around the operational workflow of a manufacturing and scientific-instrument business.

The platform connects multiple business functions that are traditionally handled through disconnected spreadsheets, emails, documents and accounting software.

The system currently brings together:

* CRM and customer management
* Sales operations
* Lead generation
* AI-assisted sales communication
* Quotations
* Order management
* Billing
* Inventory and Item Master
* Goods Receipt Notes (GRN)
* Dispatch planning
* Logistics partner management
* Production scheduling
* Production analytics
* Tally synchronization
* Geographic analytics
* Tasks and accountability
* FAQ / internal knowledge management
* Document generation
* Operational dashboards
* Audit and system-error logging

The long-term objective is to evolve the platform into an **AI-assisted operating system for the organization**, rather than simply an ERP database with a user interface.

---

# Architecture

```text
                    ┌──────────────────────────┐
                    │       React Frontend     │
                    │      React + Vite        │
                    └────────────┬─────────────┘
                                 │
                              HTTPS
                                 │
                    ┌────────────▼─────────────┐
                    │          Nginx           │
                    │     Reverse Proxy        │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │        FastAPI           │
                    │      REST API Layer      │
                    └────────────┬─────────────┘
                                 │
             ┌───────────────────┼────────────────────┐
             │                   │                    │
     ┌───────▼───────┐   ┌───────▼──────┐    ┌────────▼─────┐
     │   PostgreSQL  │   │    Redis     │    │   File Store │
     │   ERP Data    │   │ Queue/Cache  │    │ Documents    │
     └───────────────┘   └──────┬───────┘    └──────────────┘
                                │
                         ┌──────▼───────┐
                         │    Celery    │
                         │ Background   │
                         │    Jobs      │
                         └──────────────┘

        ┌──────────────────────────────────────────────┐
        │                 External Systems             │
        │                                              │
        │  Tally   │   Groq AI   │   Snov.io   │ etc.  │
        └──────────────────────────────────────────────┘
```

---

# Technology Stack

## Frontend

* React 19
* Vite
* React Router
* Tailwind CSS
* shadcn/ui-style components
* FullCalendar
* Chart.js
* OpenLayers
* Frappe UI components
* jsPDF / html2canvas
* Lucide icons

## Backend

* Python 3.12
* FastAPI
* SQLAlchemy 2
* Pydantic
* PostgreSQL
* Alembic
* PyJWT
* Argon2
* ReportLab
* OpenPyXL
* PyPDF2
* python-docx

## Infrastructure

* Docker
* Docker Compose
* Nginx
* Redis
* Celery
* Celery Beat

## AI / Data

* Groq
* Llama models
* GPT-compatible models through Groq
* ChromaDB
* AI document extraction
* AI vision extraction
* AI email generation
* AI logistics classification
* AI contract parsing
* AI prompt generation

## Accounting

* Tally integration
* Tally XML/JSON ingestion
* Voucher synchronization
* Item Master synchronization
* Purchase/billing synchronization

---

# Major ERP Modules

## 1. Authentication & RBAC

The system contains role and department-aware access control.

Examples include:

* Admin
* Chief Full Stack Developer
* Sales Representative
* Shop Floor roles
* Logistics roles
* Other department-specific permissions

Authentication is JWT based.

---

# 2. CRM

The CRM subsystem manages:

* Website inquiries
* Leads
* Lead assignment
* Lead status
* Sales regions
* Real-time CRM events

The system also contains an SSE-based event stream for real-time operational updates.

---

# 3. Lead Generation Engine

The ERP integrates with Snov.io for prospect discovery.

The lead-generation workflow includes:

```text
Target Company
      ↓
Prospect Search
      ↓
Role Filtering
      ↓
Decision Maker Scoring
      ↓
Email Discovery
      ↓
Email Verification
      ↓
Lead Staging
      ↓
Human Approval
      ↓
Sales Outreach
```

Lead scoring considers factors such as:

* Manufacturing relevance
* Department
* Job title
* Decision-making authority
* Company size

---

# 4. AI Sales Communication

The system already contains AI-assisted email generation.

The email engine uses:

* Contact information
* Designation
* Company information
* Product information
* Retrieved ERP knowledge
* ChromaDB knowledge retrieval
* LLM generation

The objective is to generate technical B2B communication rather than generic marketing copy.

---

# 5. Quotations

The quotation subsystem supports:

* Quote generation
* Product pricing
* Dealer pricing
* Packing
* Freight
* Tax calculation
* Special models
* Quotation status
* Quotation history
* Change snapshots
* PDF generation
* Quotation analytics
* Conversion into orders

The system maintains quotation-to-order relationships for traceability.

---

# 6. Sales Orders

The Order subsystem handles:

* Order Acceptance
* Purchase Orders
* Customer information
* Order items
* Quantity
* Rates
* Discounts
* Payment terms
* Delivery terms
* Production stages
* Order tracking
* PDF generation
* Pending order management

Orders can also be extracted from uploaded documents using AI/OCR workflows.

---

# 7. Inventory & Item Master

The Item Master contains information such as:

* Item code
* Item name
* Item group
* Rate
* Unit
* HSN
* Specifications
* Revision
* Stock
* Active/inactive status

The system also maintains:

* Stock adjustments
* Stock ledger
* Purchase ledger
* Tally synchronization

---

# 8. Warehouse / GRN

The WMS layer supports:

* Vendor bill scanning
* AI document/image extraction
* GRN creation
* Item enrichment
* GRN calculations
* GRN export
* Purchase bill relationships

AI is used to extract structured data from documents/images before persistence.

---

# 9. Logistics & Dispatch

The logistics subsystem includes:

* Logistics partners
* Zones
* Zone rates
* Fuel matrices
* ODA matrices
* Freight calculations
* Dispatch records
* Truck planning
* Dispatch visualization
* Partner contract extraction

The system also uses AI to extract logistics information from uploaded contracts.

---

# 10. Production

Production functionality includes:

* Production stages
* Production stage history
* Production scheduling
* Planned start/end
* Actual start/end
* Priority
* Assigned team
* Production analytics
* Production pulse

The architecture already contains the foundation required for a more advanced manufacturing planning system.

---

# 11. Tally Integration

Tally integration is a major part of the ERP.

The platform supports:

* Tally connectivity
* Tally XML
* Tally JSON
* Voucher synchronization
* Item Master synchronization
* Purchase data
* Sales/order synchronization
* Staging workflows

Tally is treated as an external accounting/financial system while the ERP provides the operational layer.

---

# 12. Analytics

The analytics layer currently covers areas such as:

* Sales KPIs
* Sales targets
* Transport KPIs
* R&D KPIs
* GTM ROI
* Production KPIs
* Purchase analytics
* System health
* Geographic analytics
* Quotation analytics
* Personal sales analytics

---

# 13. Task & Accountability System

The ERP includes an internal task management subsystem.

Tasks support:

* Assignment
* Multiple assignees
* Deadlines
* Attachments
* Completion status
* Editing
* Deletion
* PDF export
* Activity/accountability workflows

This provides the foundation for eventually implementing AI-driven operational task management.

---

# 14. Internal Knowledge Base

The platform contains a FAQ/knowledge subsystem.

ChromaDB is already used for vector retrieval in parts of the AI workflow.

This creates an important foundation for a future ERP-wide AI knowledge assistant.

---

# 15. Document Generation

The platform generates business documents using:

* ReportLab
* python-docx
* OpenPyXL
* jsPDF

Generated documents include:

* Quotations
* Orders
* Invoices
* Exercises
* Production reports
* Logistics reports
* Task exports

---

# Backend Structure

```text
server.py
│
├── routers/
│   ├── auth_router.py
│   ├── orders_router.py
│   ├── billing_router.py
│   ├── task_router.py
│   ├── dispatch_router.py
│   ├── item_routers.py
│   ├── company_router.py
│   ├── crm_router.py
│   ├── wms_router.py
│   ├── tally_router.py
│   ├── quotations.py
│   ├── analytics_router.py
│   ├── production_schedule.py
│   └── ...
│
├── database/
│   ├── models.py
│   └── repository.py
│
├── services/
│   ├── AI services
│   ├── Tally services
│   ├── document services
│   ├── production services
│   ├── logistics services
│   └── billing services
│
├── schemas/
│   └── Pydantic models
│
├── core/
│   ├── logging.py
│   └── middleware.py
│
└── alembic/
    └── database migrations
```

---

# Frontend Structure

```text
erp-frontend/
│
├── src/
│   ├── views/
│   ├── components/
│   ├── hooks/
│   ├── api/
│   ├── print/
│   ├── utils/
│   └── lib/
│
└── public/
```

The frontend uses a central ERP state composition approach where domain-specific hooks are combined into the main ERP state.

Examples include:

* `useOrders`
* `useTasks`
* `useQuotation`
* `useProduction`
* `useAnalytics`
* `useBilling`
* `useCRM`
* `useDispatchPlanner`
* `useLogistics`
* `useItemMaster`
* `useLeadGenerator`

---

# Background Processing

Celery and Redis are used for background workloads.

```text
FastAPI
   │
   ├── immediate request/response
   │
   └── Redis
         │
         └── Celery Worker
                │
                ├── background processing
                ├── integrations
                └── scheduled jobs
```

Celery Beat is also configured for scheduled jobs.

---

# Database

PostgreSQL is the primary persistence layer.

SQLAlchemy provides the ORM layer.

Alembic manages schema migrations.

Major database domains include:

* Users
* Orders
* Order Items
* Bills
* Bill Items
* Item Master
* Stock Ledger
* Logistics
* Dispatch
* Tasks
* CRM Leads
* Companies
* GRNs
* Purchase Bills
* Lead Generation
* FAQ
* Notifications
* Audit Logs
* Quotations
* Production Stages
* Production Schedules

---

# Deployment

The current deployment model uses Docker Compose:

```text
Nginx
  ↓
FastAPI
  ↓
PostgreSQL

Redis
  ↓
Celery Worker
  ↓
Celery Beat
```

The production deployment should place the application behind HTTPS/TLS and should keep PostgreSQL and Redis inaccessible directly from the public internet.

---

# Environment Variables

Sensitive credentials should be provided through environment variables and secret management.

Examples include:

```text
DATABASE_URL
GROQ_API_KEY
SNOVIO_CLIENT
SNOVIO_SECRET
TALLY_HOST
TALLY_COMPANY
TALLY_TIMEOUT_SECONDS
QUOTATION_ANALYTICS_EMAIL
QUOTATION_ANALYTICS_EMAIL_PASSWORD
QUOTATION_ANALYTICS_RECIPIENT
```

Never commit production secrets, private keys, certificates or `.env` files.

---

# Development

## Backend

```bash
python -m venv .venv
```

Activate the environment and install dependencies:

```bash
pip install -r requirements.txt
```

Run migrations:

```bash
alembic upgrade head
```

Start FastAPI:

```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8500
```

---

## Frontend

```bash
cd erp-frontend
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

---

# Docker

Start the complete stack:

```bash
docker compose up --build
```

Services:

```text
nginx
web
worker
beat
redis
```

---

# Engineering Principles

The ERP is being developed around several principles:

### Operational traceability

Important business operations should be traceable from source transaction to final outcome.

### Human-in-the-loop AI

AI should assist employees rather than silently make irreversible business decisions.

### ERP as a system of record

Operational transactions should ultimately be persisted in PostgreSQL.

### External-system boundaries

Tally and other external systems should have explicit integration boundaries.

### Auditability

Business-changing operations should produce audit events.

### Incremental automation

Manual workflows should first become structured workflows and only then be automated.

---

# Current Development Status

The system already contains substantial functionality across:

* CRM
* Sales
* Quotations
* Orders
* Billing
* Inventory
* GRN
* Logistics
* Dispatch
* Production
* Analytics
* Tally
* Lead generation
* AI-assisted workflows
* Internal knowledge
* Tasks

The next engineering phase is focused on:

1. Security hardening
2. Deployment hardening
3. Test coverage
4. Transactional consistency
5. Manufacturing intelligence
6. Document signing
7. AI agents
8. Better observability
9. Automated operational workflows

---

# Planned Manufacturing Roadmap

## Bill of Materials

Introduce:

```text
Finished Product
      ↓
     BOM
      ↓
Subassemblies
      ↓
Raw Materials
```

Sales Orders should be able to generate material requirements automatically.

## Reorder Automation

Use:

```text
Current Stock
+ Open Purchase Orders
- Reserved Stock
- Production Requirements
= Projected Available Stock
```

The system can then generate procurement recommendations.

## Quality Control

Introduce QC checkpoints between production stages.

Every QC decision should record:

* Operator
* Timestamp
* Order
* Stage
* Checklist
* Result
* Remarks
* Signature

---

# Long-Term Vision

The long-term goal is to evolve the ERP into an intelligent operational platform:

```text
                   TEMPO ERP
                       │
        ┌──────────────┼──────────────┐
        │              │              │
     Humans          Rules            AI
        │              │              │
        └──────────────┼──────────────┘
                       │
                 ERP System of
                     Record
                       │
        ┌──────────────┼──────────────┐
        │              │              │
      Sales        Operations      Finance
        │              │              │
      CRM          Production       Tally
      Leads        Inventory        Billing
      Quotes       Logistics
      Orders       Dispatch
```

The eventual objective is an **AI-assisted ERP where employees can ask questions, investigate operational problems, receive recommendations, and execute approved workflows without leaving the ERP.**

---

# Security Notice

Before external production deployment, the system should undergo a dedicated security hardening phase covering:

* Secret management
* HTTPS/TLS
* JWT lifecycle
* Password hashing
* RBAC
* CORS
* Rate limiting
* File-upload security
* Audit logging
* Database permissions
* Backup and disaster recovery
* Dependency scanning
* Container hardening

The repository should also exclude:

* Python virtual environments
* Compiled binaries
* `.pyc` files
* generated documents
* uploaded production files
* local databases
* secrets

---

# Project Philosophy

Tempo ERP is not intended to be another generic ERP.

It is designed around the actual operating processes of a manufacturing and technical-sales organization.

The system therefore prioritizes:

**Operational reality → structured data → automation → intelligence.**

The AI layer is being developed on top of a real ERP data model rather than as an isolated chatbot.

---

## Author / Engineering

Tempo Instruments ERP
Internal Enterprise Software Platform

Built with:

**React · FastAPI · PostgreSQL · SQLAlchemy · Redis · Celery · Docker · Nginx · Tally · Groq · ChromaDB**
