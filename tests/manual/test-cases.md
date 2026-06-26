# Manual Test Cases — Manivtha CRM

| TC ID | Module | Description | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| **TC-M01** | Customer Portal | Valid submission | Fill name, 10-digit phone, pickup, drop, travel date. Select source/trip. Click Submit. | Green success card shown; form disabled; "Submit another" link works. | Pending | Open |
| **TC-M02** | Customer Portal | Missing required field | Leave Customer Name empty. Attempt to click Submit. | Inline warning "Customer name is required" displayed below input; form block. | Pending | Open |
| **TC-M03** | Customer Portal | Phone validation | Input "12345" (5 digits) in Phone. Attempt to Submit. | Inline warning "Phone number must be exactly 10 digits" shown. | Pending | Open |
| **TC-M04** | Customer Portal | Past travel date | Select travel date before today. Click Submit. | Inline warning "Travel date cannot be in the past" shown. | Pending | Open |
| **TC-M05** | Customer Portal | Round Trip dynamic date | Select "Round Trip" in Trip Category dropdown. | Return Date input appears below; becomes required. | Pending | Open |
| **TC-M06** | Customer Portal | Form disabled after submit | Complete submission successfully. | Form elements become disabled; inputs cannot be clicked. | Pending | Open |
| **TC-M07** | Login Portal | Valid credentials | Input `admin@manivtha.com` / `admin123`. Click Sign In. | Redirects to `/dashboard`; token cached in localStorage. | Pending | Open |
| **TC-M08** | Login Portal | Invalid password | Input `admin@manivtha.com` / `wrongpass`. Click Sign In. | Error message "Invalid credentials. Please try again." shown in red. | Pending | Open |
| **TC-M09** | Login Portal | Form validation | Click Sign In with empty email and password. | Warning message "Please fill in all credentials." shown without triggering API. | Pending | Open |
| **TC-M10** | Login Portal | Session persists | Log in successfully. Reload the browser page. | Session persists; remains logged in dashboard (token in localStorage). | Pending | Open |
| **TC-M11** | Dashboard | Stats validation | Verify counters against actual MySQL records. | Total Enquiries, Pending Followups, and Bookings counts match DB. | Pending | Open |
| **TC-M12** | Dashboard | Empty State | TRUNCATE enquiries table. Open Dashboard. | Stats card show 0; Recent table displays EmptyState component. | Pending | Open |
| **TC-M13** | Dashboard | Pagination | Create 25 enquiries. Visit All Enquiries page. | Table limits to 20 records; Page footer shows "Page 1 of 2" with Next active. | Pending | Open |
| **TC-M14** | Enquiry Detail | Inline details edit | Click "Edit Details" on left, modify phone, click Save. | Fields update; status logs updated in DB; locks back to read-only. | Pending | Open |
| **TC-M15** | Enquiry Detail | Status transition | Change status to "Contacted", click Update. | Timeline feed updates; status badge color changes to amber yellow pill. | Pending | Open |
| **TC-M16** | Enquiry Detail | Notes timeline feed | Write note in right column, click Save Note. | Notes prepends to timeline instantly with staff author and timestamp. | Pending | Open |
| **TC-M17** | Follow-ups | Today's callbacks | Set an enquiry followup date to today. Open Follow-ups page. | Record appears as a custom card; shows client phone and trip metadata. | Pending | Open |
| **TC-M18** | Follow-ups | Mark Contacted | Click "Mark as Contacted" on today's follow-up card. | Status updates to Contacted; note appended; card disappears from list. | Pending | Open |
| **TC-M19** | Telegram Bot | Notification trigger | Submit a new enquiry. Check Telegram group. | Bot alerts group with client details, route, and dynamic Lead priority. | Pending | Open |
| **TC-M20** | Telegram Bot | Confirmation alert | Confirm a booking on detail sheet. Check Telegram. | Bot alerts group with Confirmed Booking notification. | Pending | Open |
| **TC-M21** | UI Layout | Responsive width | View all portal pages at 375px width in Chrome DevTools. | Sidebar wraps, grid collapses, tables fit or scroll; no text overlaps. | Pending | Open |
