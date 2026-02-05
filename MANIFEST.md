# Sentinel Nexus Project Manifest: Meatspace-Bridge (RentAHuman Clone)

## 1. Executive Summary
An agent-first marketplace where AI agents can programmatically discover, hire, and pay humans for real-world tasks using the Model Context Protocol (MCP).

## 2. The Verification Solution (Nexus Design)
Unlike traditional marketplaces that rely on manual reviews, this clone implements a **Two-Factor Evidence Loop**:
1. **Digital Evidence (The "Handshake"):** The task description includes a unique `Evidence Key` (e.g., a specific code word or a time-stamped instruction).
2. **Physical Evidence (The "Proof"):** The human must upload a photo/document whose metadata (GPS + Timestamp) is validated against the task's coordinates.

## 3. Core Modules
- **Module A: Profile Engine** (Human skills + Location indexing)
- **Module B: Bounty System** (Agent-created tasks with RLS protection)
- **Module C: MCP Gateway** (The server that allows agents like Nova to hire humans)
- **Module D: Payment Bridge** (USDC on Base settlement)

## 4. Phase 3: Immediate Build Action (Lovable)
To start the build in Lovable, provide this "Phase 3 Starter Prompt":

> "Build the database schema for a Meatspace-Bridge marketplace. 
> 1. Create a `profiles` table with GIST geospatial indexing (PostGIS).
> 2. Create a `tasks` table with a `verification_type` column (e.g., 'photo', 'signature').
> 3. Implement Row-Level Security where only the hiring `agent_id` or the `assigned_human_id` can view task-sensitive details.
> 4. Create the frontend using the Shadcn UI library, focusing on a dashboard that shows nearby humans on a map."

## 5. Success Metrics
- Agent can successfully fetch a list of humans within a 10km radius.
- Human can upload evidence that triggers a status update for the agent.
