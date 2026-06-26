# Test Plan — Manivtha CRM

This document describes the testing strategy, environments, and validation procedures to verify correct functionality before release.

---

## 1. Test Environments

*   **Local Containerized Environment**: Built and run via `docker compose up -d`. Runs on localhost ports:
    *   Frontend: `http://localhost:5175`
    *   Backend API: `http://localhost:5050`
    *   MySQL Database: `localhost:3307`
*   **Target Staging / Production Server**: Live environment served via Let's Encrypt SSL.
    *   URL: `https://crm.joharsmp.info`

---

## 2. Testing Strategies

### A. Automated Integration Testing (Postman Suite)
The API layer is verified using the collection stored at [manivtha-crm.postman_collection.json](file:///C:/Users/missa/OneDrive/Desktop/project-crm/tests/api/manivtha-crm.postman_collection.json).

*   **Variables**:
    *   `base_url`: Target host URL (default: `http://localhost:5050`).
    *   `token`: JWT authentication token, captured automatically by `TC-A01` upon successful login.
*   **Run Procedure**:
    1.  Start backend API.
    2.  Execute seed command: `node seed.js`.
    3.  Import the collection in Postman, select Environment, and run. Alternatively, run using Newman:
        ```bash
        newman run tests/api/manivtha-crm.postman_collection.json --env-var base_url=http://localhost:5050
        ```

### B. Automated Continuous Integration (Smoke Testing)
A GitHub Actions workflow is triggered on pushes/pull-requests to verify that the Express app launches without compilation issues.
*   File: [.github/workflows/ci.yml](file:///C:/Users/missa/OneDrive/Desktop/project-crm/.github/workflows/ci.yml)
*   Method: Copies template environment, installs node modules, and spins up the Express server for 5 seconds using a Unix timeout block.

### C. Manual Verification Checklist
Manual verification validates frontend visual rendering and client form validations.
*   File: [test-cases.md](file:///C:/Users/missa/OneDrive/Desktop/project-crm/tests/manual/test-cases.md)
*   Core checks:
    *   Form input errors (empty fields, 7-digit numbers, past dates).
    *   Session cache longevity (verifying token preservation on reload).
    *   Print-friendly invoice stylesheets.
    *   Responsive layouts at 375px width using Chrome DevTools.
