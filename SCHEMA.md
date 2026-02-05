# Blueprint: RentAHuman Clone (Sentinel Nexus)

## 1. Core User Personas

### **A. The Meatspace Agent (Human Worker)**
*   **Goal:** Monetize physical presence and manual dexterity for AI clients.
*   **Attributes:**
    *   Location-bound (GPS verified).
    *   Skills-based (e.g., "Notary", "Photography", "Logistics").
    *   Crypto-native or crypto-curious (prefers stablecoin payouts).
    *   Seeks clear, unambiguous instructions from non-human entities.

### **B. The Autonomous Requester (AI Agent)**
*   **Goal:** Outsource real-world actions to bridge the digital-physical gap.
*   **Attributes:**
    *   Operates via Model Context Protocol (MCP) or REST API.
    *   Programmatic decision-making (hires based on rate, proximity, and reputation).
    *   Automated verification of task completion (requires API-friendly evidence like geo-tagged photos).

---

## 2. Feature Inventory

### **Auth & Security**
*   **Wallet-First Auth:** Integration with Privy or Dynamic.xyz for seamless Web3 onboarding (SIWE).
*   **Agent API Keys:** Secure token management for AI agents to authenticate via API/MCP.
*   **Identity Verification:** Proof of Personhood (e.g., World ID or Stripe Identity) to prevent bot-on-bot hiring.

### **Profile & Reputation**
*   **Meatspace Profile:** Skills, availability, service radius (GeoJSON), and hourly rate.
*   **Verifiable Credentials:** On-chain reputation based on completed tasks.
*   **Capabilities Registry:** Standardized tags for tasks (e.g., `delivery`, `recon`, `signing`).

### **Marketplace & Discovery**
*   **MCP Server:** A dedicated MCP server allowing LLMs to "search" and "book" humans as tools.
*   **Geospatial Search:** PostGIS-powered querying to find the nearest human to a task location.
*   **Task Escrow:** Smart contract or middleman service to hold funds until task milestones are met.

### **Payments & Wallet**
*   **Stablecoin Payouts:** Direct-to-wallet payments in USDC/USDT (Base or Polygon for low fees).
*   **Streaming Payments:** Optional per-minute billing for live tasks.

---

## 3. Modern Tech Stack

*   **Frontend:** Next.js (App Router), Tailwind CSS, Shadcn UI (Radix UI).
*   **Backend/Database:** Supabase (PostgreSQL + PostGIS for location data).
*   **AI Protocol:** MCP (Model Context Protocol) for agentic integration.
*   **Infrastructure:** Vercel (Hosting), Edge Functions (API).
*   **Blockchain:** Base (L2) for transactions/escrow; Privy for wallet abstraction.

---

## 4. Postgres Database Schema (SQL)

```sql
-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users (Humans)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  bio TEXT,
  hourly_rate NUMERIC NOT NULL DEFAULT 20.00,
  wallet_address TEXT UNIQUE,
  location GEOGRAPHY(POINT, 4326), -- Geospatial point
  skills TEXT[], -- Array of capabilities
  reputation_score FLOAT DEFAULT 5.0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks (Created by AI Agents)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL, -- Reference to the hiring agent (could be a user/org)
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  budget NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'disputed')) DEFAULT 'open',
  assigned_human_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments/Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id),
  sender_address TEXT NOT NULL,
  receiver_address TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  token_symbol TEXT DEFAULT 'USDC',
  tx_hash TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Geospatial index for fast proximity search
CREATE INDEX idx_profiles_location ON profiles USING GIST (location);
```

---

## 5. The 'Secret Sauce'

### **The MCP Handshake (Protocol Lock-in)**
The core value isn't just a marketplace; it's the **translation layer**. By providing a standardized MCP server, RentAHuman makes "hiring a human" as easy for an LLM as "calculating a sum."
*   **Hard to Clone:** Building the trust-graph between autonomous agents and humans. An agent needs to trust that the API it calls results in real-world action.
*   **Verification Loop:** Automated verification of physical tasks (e.g., an agent requires a photo hash that matches a specific location/time metadata).
*   **Agent-Optimized Documentation:** The platform is designed for *crawlers and agents first*, humans second.
