# MOAI Supply Chain ERP

A modernized, enterprise-grade, real-time Kanban dashboard designed for managing End-to-End Supply Chain and Logistics operations. MOAI ERP creates a strict separation between **Ordering Preparation**, **Material Delivery**, and subsequent logistical operations, enforcing stringent compliance logic via a dynamic "100% Clarified Order Checklist".

## ✨ Key Enterprise Features

- **Multi-Tenant Architecture**: Robust company scoping. Multiple organizations can use the platform on the same database, with all users, orders, and master data strictly siloed to their registered `company_name`.
- **Role-Based Access Control (RBAC)**: Strict governance using modular user roles (`Admin`, `Procurement`, `Customs`, `Warehouse`, `Logistics`, `Viewer`). Actions like creating orders, modifying checklists, or advancing pipeline stages are programmatically restricted based on departmental authorization.
- **Audit Trails & Lead Time Analytics**: The system autonomously logs every stage transition, checklist completion, and order creation. A dedicated **Analytics Dashboard** aggregates this data to visualize supply chain bottlenecks and calculate exact stage-by-stage lead times.
- **Master Data Management**: Avoid data entry corruption with strict Supplier and SKU management. Users must define Items in the Master Data directory, which dynamically populates procurement dropdowns during Order Creation.
- **Cloud Document Uploads**: Integrated with Supabase Storage, allowing Customs and Logistics personnel to directly upload PDF/Image proofs (like Air Waybills or Import Permits) to specific tasks to satisfy audit requirements.
- **Secure Authentication**: Built-in login, sign-up, and forgot password flows using Supabase Auth.
- **Six-Process Kanban Architecture**: Comprehensive workflow spanning Ordering Preparation, Material Delivery, Custom Clearance, WH Management, EID Last Mile, and Local 3PP Flow.
- **Real-Time Data Sync**: Powered by Supabase WebSockets, board updates (drag & drop, checklists, new orders) sync instantly across all authenticated clients without requiring a page refresh.
- **Modular Codebase Architecture**: Clean, scalable React component structure separating concerns (Auth, Sidebar, KanbanBoard, Drawer, MasterData, Analytics).

## 🛠️ Tech Stack

- **Frontend Environment**: React 18 + Vite
- **Styling**: Vanilla CSS with modern Bento-style UI
- **Icons**: Lucide React
- **Backend & Database**: Supabase (PostgreSQL + Real-time WebSockets + Supabase Storage)

## 🚀 Getting Started

### 1. Install Dependencies

Ensure you have Node.js installed, then run:

```bash
npm install
```

### 2. Supabase Database Setup

This application requires a Supabase PostgreSQL backend to function securely and handle the real-time enterprise logic.

1. Create a new project at [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open the `supabase_schema.sql` file provided in this repository.
4. Copy and execute the SQL query. This automatically provisions the required tables (`orders`, `companies`, `items`, `suppliers`, `order_history`), configures Row Level Security (RLS) policies, provisions the `documents` storage bucket, and enables WebSocket broadcasts.

### 3. Environment Variables

1. Create a `.env` file in the root directory.
2. Add your project-specific Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Run the Development Server

```bash
npm run dev
```

Open your browser to `http://localhost:5173` to view the app!

## 📖 Checklist Validation Logic

To ensure workflow integrity, cards cannot be arbitrarily moved forward into the next pipeline unless prerequisite tasks are completed by an authorized Role.

Example built-in prerequisites:

- **Move to VC & WBS**: Requires "Verify 100% clarified order..." to be checked.
- **Move to Review Stock**: Requires "Value Contract & WBS validation" to be checked.
- **Move to BoQ & Premium Proposal**: Requires solution checking, NIF file preparation, and stock evaluation.
- **Move to Process 2 (Release Inquiry)**: Requires completed Premium Proposals and operational RO planning.
- **Move to Custom Declaration**: Requires Pre-alert receipt, shipping documents review, and an import permit upload.
- **Move to Release & Delivery**: Requires physical customs visit, duty payment, and local law compliance.
- **Process 4 (WH Management)**: Requires warehouse capacity setups, inventory reconciliations, and outbound prioritization.
- **Process 6 (Local 3PP Flow)**: Requires Sourcing & Local Supply validations and PO/GR closures.
