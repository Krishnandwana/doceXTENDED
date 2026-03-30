# Team Roles and Responsibilities

## Team Members

### Krish
**Role:** AI Lead + Full-Stack Support  
**Primary Ownership:**
- `ai/` modules and model pipeline decisions
- AI quality, fraud checks, OCR strategy, face verification strategy

**Secondary Ownership (Support):**
- Backend integration support for AI endpoints and pipeline flow
- Frontend support for AI output display, confidence messaging, and UX alignment

**Key Tasks:**
- Design and improve AI services (`ocr`, `face`, `fraud`, `quality`, preprocessing/postprocessing)
- Define thresholds, model configs, and risk logic
- Help unblock both backend and frontend when AI integration issues occur
- Validate end-to-end behavior for AI-related features

---

### Keshav
**Role:** Backend Engineer  
**Primary Ownership:**
- `backend/` services, API routes, processing orchestration, and backend reliability

**Key Tasks:**
- Build and maintain FastAPI endpoints and backend workflows
- Manage request/response contracts and job lifecycle (`upload -> process -> status -> results`)
- Integrate AI services into backend safely and consistently
- Handle backend validation, error handling, logging, and performance improvements
- Keep backend docs and API behavior stable for frontend consumption

---

### Khsuhi
**Role:** Frontend Engineer  
**Primary Ownership:**
- `frontend/` application, UI flows, and user experience

**Key Tasks:**
- Build and maintain frontend pages, routing, and interaction flows
- Integrate frontend with backend APIs and handle loading/error states
- Ensure extracted data and verification outputs are displayed clearly
- Maintain responsive design and usability across devices
- Keep frontend docs aligned with active product scope

---

## Collaboration Model

- Krish defines AI behavior and supports cross-team integration issues.
- Keshav owns backend implementation and API contract stability.
- Khsuhi owns frontend implementation and user flow quality.

## Handoff Rules

- AI logic updates from Krish should be shared with Keshav for backend contract updates.
- Backend response shape changes by Keshav must be communicated to Khsuhi before merge.
- Frontend display/UX changes by Khsuhi that depend on AI/backend outputs should be reviewed with Krish and Keshav.

## Current Product Scope Note

- Frontend is currently focused on ID verification flow.
- Backend still contains additional document-analysis APIs for future use.
