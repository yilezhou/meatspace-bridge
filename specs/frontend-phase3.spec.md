# Frontend Specification: Task Creation & Evidence Upload (Phase 3)

**Project:** Meatspace-Bridge (Sentinel Nexus)  
**Role:** Lead Frontend Architect  
**Status:** Draft  
**Date:** 2026-02-06  

## 1. Executive Summary
Phase 3 focuses on the "Meatspace" interaction loop: defining a physical task, executing it, and verifying the result. This specification details the frontend architecture for the **Task Creation Wizard**, **Evidence Upload Component**, and the **Verification Dashboard**.

## 2. Technical Stack & Dependencies
- **UI Framework:** React (Next.js App Router)
- **Component Library:** Shadcn UI (Forms, Cards, Dialogs, Progress)
- **Form Management:** React Hook Form + Zod (Schema Validation)
- **State Management:** Zustand (for Wizard state) or React Context
- **Backend/Storage:** Supabase (PostgreSQL + Storage)
- **Maps:** Leaflet or Mapbox (for Location selection)

---

## 3. Component Architecture

### 3.1 Task Creation Wizard (`CreateBountyForm`)
A multi-step guided experience to ensure high-quality task definitions.

**Location:** `/dashboard/bounties/new`

#### User Flow (Steps)
1.  **Definition:** Title, Description, Category (e.g., Recon, Drop-off, Retrieval).
2.  **Location:** Interactive map picker. Select coordinates + radius.
3.  **Incentives:** Budget (CR/Tokens), Deadline, Reputation Requirements.
4.  **Review:** Summary view before submission.

#### Technical Implementation
-   **Component Structure:**
    ```tsx
    <Form {...form}>
      <Stepper active={step} />
      {step === 1 && <BasicInfoStep control={form.control} />}
      {step === 2 && <LocationStep control={form.control} setValue={form.setValue} />}
      {step === 3 && <BudgetStep control={form.control} />}
      <NavigationButtons onNext={validateAndNext} onBack={prev} />
    </Form>
    ```
-   **Validation (Zod):** Split schemas per step to allow partial validation before moving forward.
    ```ts
    const step1Schema = z.object({ title: z.string().min(5), ... });
    const step2Schema = z.object({ lat: z.number(), lng: z.number(), ... });
    ```

### 3.2 Evidence Upload (`ProofUpload`)
A robust file uploader optimized for mobile devices (agents in the field).

**Location:** `/tasks/[id]/submit`

#### Features
-   **Direct-to-Storage:** Uploads directly to Supabase Storage bucket `bounty_evidence`.
-   **Image Compression:** Client-side compression (via `browser-image-compression`) before upload to save bandwidth/storage.
-   **Preview:** Immediate visual feedback of the selected image.
-   **EXIF Stripping (Optional):** Option to preserve or strip metadata depending on privacy requirements (default: preserve GPS for verification).

#### Technical Implementation
-   **Supabase Client:**
    ```ts
    const { data, error } = await supabase.storage
      .from('bounty_evidence')
      .upload(`${taskId}/${userId}-${timestamp}.jpg`, file);
    ```
-   **UI States:** Idle -> Compression -> Uploading (Progress Bar) -> Success/Error.

### 3.3 Verification UI (`TaskVerifier`)
The interface for the Bounty Creator (or Consensus Node) to validate work.

**Location:** `/dashboard/bounties/[id]/review`

#### Layout
-   **Split View:**
    -   **Left:** Task Requirements (Original instructions + Location map).
    -   **Right:** Submission Evidence (Photo viewer with Zoom/Pan).
-   **Action Bar:** Fixed footer or prominent card.
    -   **Approve:** Triggers smart contract release (or DB status update).
    -   **Reject:** Opens a modal requiring a "Rejection Reason" (e.g., "Photo blurry", "Wrong location").

#### Component Props
```ts
interface VerificationProps {
  taskId: string;
  submissionId: string;
  evidenceUrl: string;
  requirements: TaskRequirements;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}
```

---

## 4. Data Models (Frontend Types)

```typescript
// Task Definition
interface BountyDraft {
  title: string;
  description: string;
  budget: number;
  currency: 'USD' | 'ETH' | 'CREDITS';
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  expiresAt: Date;
}

// Submission
interface SubmissionEvidence {
  id: string;
  bountyId: string;
  agentId: string;
  storagePath: string; // Supabase path
  publicUrl: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}
```

## 5. Security & Policies (Supabase)

### Storage Policies (`bounty_evidence` bucket)
1.  **Insert:** Authenticated users only.
2.  **Select:** Public (or restricted to Bounty Creator + Submitter).
3.  **Update/Delete:** None (Evidence is immutable once submitted).

### Database RLS
-   **Bounties:** Creators can `UPDATE` their own bounties only if status is `DRAFT`.
-   **Submissions:** Agents can `INSERT`. Creators can `UPDATE` status (Approve/Reject).

## 6. Implementation Roadmap
1.  **Setup:** Create Storage bucket and RLS policies.
2.  **Phase 3.1:** Build `ProofUpload` component (isolated).
3.  **Phase 3.2:** Build `CreateBountyForm` with Zod validation.
4.  **Phase 3.3:** Integrate `TaskVerifier` with mock data.
5.  **Integration:** Connect components to real Supabase endpoints.
