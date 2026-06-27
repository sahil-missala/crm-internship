# 📘 User Guide — Manivtha Tours & Travels CRM

This guide walks you through accessing the CRM, submitting customer enquiries, managing leads as an administrator/executive, linking Telegram bot updates, and confirming bookings.

---

## 🌐 1. Application Access & Credentials

Use the following published links to access the portals:

*   **Customer Enquiry Portal (Public)**: [https://testlinkforcrminternshipproject.joharsmp.info/enquiry](https://testlinkforcrminternshipproject.joharsmp.info/enquiry)
*   **Company Dashboard (Private)**: [https://testlinkforcrminternshipproject.joharsmp.info/login](https://testlinkforcrminternshipproject.joharsmp.info/login)
*   **API Health Status**: [https://api-testlinkforcrminternshipproject.joharsmp.info/health](https://api-testlinkforcrminternshipproject.joharsmp.info/health)

### Staff Login Credentials

| Role | Email Address | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@manivtha.com` | `admin123` | Full access, status updates, cancel, confirm, and Telegram unlinking |
| **Booking Executive** | `staff@manivtha.com` | `staff123` | Logging notes, callback schedules, and updating details |

---

## 📝 2. Submitting a Customer Enquiry

1. Open the **Customer Enquiry Portal** at `https://testlinkforcrminternshipproject.joharsmp.info/enquiry`.
2. Fill out the request form:
    *   **Customer Name**, **Phone Number (10 digits)**, and **Email**.
    *   **Trip Type** (Airport Transfer, Local Rental, Outstation One-Way, or Round Trip).
    *   **Pickup & Drop-off locations**.
    *   **Travel Dates** (and Return Date if Round Trip).
    *   **Number of Passengers** and any **Special Requirements** (e.g. Innova Crysta, luggage space).
3. Click **Submit Enquiry**.
4. Once submitted successfully, a screen will show instructions for tracking the enquiry status on Telegram.

---

## 🖥️ 3. Managing Enquiries (Dashboard Flow)

1. Log into the **Company Dashboard** at `https://testlinkforcrminternshipproject.joharsmp.info/login` using the Admin or Executive credentials.
2. The homepage displays active follow-ups due today and a summary of lead counts.
3. Navigate to **Enquiries** in the left sidebar to view all requests.
4. Note the dynamic **Lead Temperature** tags:
    *   🔥 **Hot Lead**: Travel date is soon (within 3 days), passenger count is high, or callback note activity is frequent.
    *   ☀️ **Warm Lead**: Active follow-ups scheduled, moderate passenger count.
    *   ❄️ **Cold Lead**: No upcoming callbacks logged, travel date is far in the future.

---

## 🤖 4. Telegram Chatbot Integration

To receive automated updates and check booking status directly in Telegram:

### Linking a Customer Telegram Account
1. On the **Enquiry Details** page in the dashboard, scroll to the **Chat with Customer** section on the right.
2. You will see a custom link: `https://t.me/your_bot_username?start=enq_ID`.
3. Share this link with the customer, or click **Copy** and open it in Telegram.
4. Click **Start** in the Telegram bot chat. The bot will automatically link that Telegram account to the specific enquiry.
5. In the Admin Dashboard, the status will immediately update to `🟢 Linked (ID: xxxxxxxxx)`.

### Unlinking a Telegram Account (Admin Only)
1. If you need to link a different account or reset the session, look at the **Telegram Bot** status row.
2. Click the red **Unlink** button next to the Chat ID.
3. Confirm the browser prompt. The Chat ID will be reset to `NULL` in the database, and the status changes to `🔴 Not Linked`.

### Telegram Bot Commands
Once a customer's chat is linked, they can use the following commands in the bot:
*   `/status`: Lists the route details and active status of all bookings. Recently cancelled bookings are displayed for 24 hours before being hidden.
*   `/enquiry`: Instantly replies with a direct link to submit a new enquiry form. This link is dynamically configured using the `ENQUIRY_FORM_URL` variable in your `.env` configuration file.
*   `/cancel`: Lets the customer request booking cancellation directly from the bot chat.

---

## 🚗 5. Confirming Bookings & Invoices

1. On the **Enquiry Details** page, click the green **Mark as Confirmed Booking** button at the bottom.
2. Allocate the trip details:
    *   **Vehicle Type** (e.g. Innova / Dzire Sedan).
    *   **Driver Name** and **Driver Phone**.
    *   **Pickup Date & Time**.
    *   **Total Amount** and **Advance Paid**.
3. Click **Confirm & Generate Invoice**.
4. The system updates the status to **Confirmed** and automatically redirects to the **Bookings** list where you can click **Print Invoice** to generate a clean, single-page printed invoice (formatted as `INV-YYYY-MM-XXXX`) without sidebars or clutter.
