# MOAI Procurement ERP

A modernized, real-time Kanban dashboard designed for managing Supply Chain and Procurement operations. MOAI ERP creates a strict separation between **Ordering Preparation** and **Material Delivery**, enforcing stringent compliance logic via a dynamic "100% Clarified Order Checklist".

## ✨ Key Features

- **Secure Admin Authentication**: Built-in login and sign-up flow using Supabase Auth to restrict dashboard access.
- **Triple-Process Kanban Flow**: Distinct phase gates separating Planning/Sales, Material Delivery (EPC/Hub), and **Custom Clearance** (Brokerage/Logistics).
- **Strict Validation Gates**: Users are prevented from dragging tasks into later stages unless specific checklist prerequisites have been met.
- **Live Fulfillment Progress**: A dynamic, interactive side-drawer panel tracking the completion percentage of each order's checklist.
- **Real-Time Data Sync**: Powered by Supabase WebSockets, board updates (drag & drop, checklists, new orders) sync instantly across all clients without requiring a page refresh.
- **Built-in System Dictionary**: A dedicated help and documentation center translating common ERP and procurement terminology (e.g., CPO, ESTA, WBS, BoQ).

## 🛠️ Tech Stack

- **Frontend Environment**: React 18 + Vite
- **Styling**: Vanilla CSS with modern Bento-style UI
- **Icons**: Lucide React
- **Backend & Database**: Supabase (PostgreSQL + Real-time WebSockets)

## 🚀 Getting Started

### 1. Install Dependencies

Ensure you have Node.js installed, then run:

```bash
npm install
```

### 2. Supabase Database Setup

This application requires a Supabase PostgreSQL backend to function.

1. Create a new project at [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open the `supabase_schema.sql` file provided in this repository.
4. Copy and execute the SQL query to automatically generate the `orders` table, apply security policies, and enable WebSocket broadcasts.

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

_(Note: If Supabase keys are left empty, the app will safely fall back to a local offline mock-data state for layout demonstration purposes)._

## 📖 Checklist Validation Logic

To ensure workflow integrity, cards cannot be arbitrarily moved forward into the next pipeline.

Example built-in prerequisites:

- **Move to VC & WBS**: Requires "Verify 100% clarified order..." to be checked.
- **Move to Review Stock**: Requires "Value Contract & WBS validation" to be checked.
- **Move to BoQ & Premium Proposal**: Requires solution checking, NIF file preparation, and stock evaluation.
- **Move to Process 2 (Release Inquiry)**: Requires completed Premium Proposals and operational RO planning.
- **Move to Custom Declaration**: Requires Pre-alert receipt, shipping documents review, and an import permit.
- **Move to Duty & Payment**: Requires custom declaration verification, HC code checks, and broker coordination.
- **Move to Release & Delivery**: Requires physical customs visit, duty payment, and local law compliance.
