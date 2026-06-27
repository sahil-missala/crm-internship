# 🚗 Manivtha Tours & Travels — Customer Booking CRM

[![Docker Status](https://img.shields.io/badge/docker-compose-blue.svg?logo=docker)](https://www.docker.com/)
[![React 18](https://img.shields.io/badge/frontend-React%2018-blue?logo=react)](https://react.dev/)
[![Node.js v20](https://img.shields.io/badge/backend-Node.js%20v20-green?logo=node.js)](https://nodejs.org/)
[![MySQL 8.0](https://img.shields.io/badge/database-MySQL%208.0-orange?logo=mysql)](https://www.mysql.com/)
[![Telegram Bot](https://img.shields.io/badge/bot-Telegram%20Bot-blue?logo=telegram)](https://telegram.org/)

A modern, containerized Customer Booking CRM built for **Manivtha Tours & Travels** (a premium car rental and travel itinerary agency). 

The application is divided into a public-facing **Customer Enquiry Portal** where customers submit travel enquiries, and a private **Company Dashboard** for booking executives and administrators to track enquiries, schedule callbacks, converse directly with customers via Telegram, confirm bookings, allocate vehicles/drivers, and dynamically generate invoices.

---

## 🔒 Security Warning: Keep Your Credentials Safe

Before pushing this project to GitHub or any public repository, please read these security instructions carefully:

1. **Do Not Commit `.env` Files**: 
   - We have added a root `.gitignore` file to ensure `.env` and `backend/.env` files are never tracked by Git.
   - Always copy credentials to `.env` locally, but never push `.env` to GitHub.
2. **Exposed Credentials to Clear**:
   - In your `.env` and `backend/.env`, you currently have a live Telegram Bot Token:
     `TELEGRAM_BOT_TOKEN=8720835820:AAHg-1KTw4n42TghcW_Khy7Nm4pkGp9oDe0`
   - Make sure to clear this value from any files before publishing the repository. Leave them empty like this:
     `TELEGRAM_BOT_TOKEN=`
     `TELEGRAM_CHAT_ID=`
3. **Use `.env.example`**:
   - Use the `.env.example` template to outline what variables are required without exposing actual values.

---

## 📁 Repository Structure

```
├── backend/                  # Node.js + Express API server
│   ├── src/
│   │   ├── config/           # DB and API configs
│   │   ├── controllers/      # Business logic controllers
│   │   ├── routes/           # REST API routing
│   │   ├── services/         # Telegram Bot & WhatsApp engines
│   │   └── utils/            # Shared formatting helpers
│   ├── Dockerfile
│   └── seed.js               # Database migrations & seed data
├── frontend/                 # React + Vite client webapp
│   ├── src/
│   │   ├── api/              # Axios API clients
│   │   ├── components/       # Shared UI widgets
│   │   ├── context/          # Auth context state providers
│   │   ├── pages/            # View pages (Customer Form & Dashboard)
│   │   └── utils/            # Local helpers & validators
│   ├── Dockerfile
│   └── nginx.conf            # Nginx config for static production serving
├── docs/                     # Guides & database schema documentation
├── tests/                    # Postman API test suites & manual checklists
├── docker-compose.yml        # Orchestration configurations
└── .gitignore                # Git exclusions
```

---

## 🚀 Core Features

1. **Admin Telegram Chat Unlinking**: Admin details connections panel features an "Unlink" trigger that resets the Telegram association dynamically and logs the event to the timeline notes.
2. **Rule-Based Lead Temperature Priority**: Dynamically classifies enquiries into **Hot** 🔥, **Warm** ☀️, and **Cold** ❄️ based on passenger counts, scheduling proximity, and executive follow-up activity.
3. **Automated Invoice Generator**: Automatically compiles bookings into printed invoices (formatted as `INV-YYYY-MM-XXXX`) with Tailwind print styling rules.
4. **Chatbot Web Enquiry Link**: Customers texting `/enquiry` to the Telegram bot instantly receive a direct link to the online booking enquiry form (customizable via `ENQUIRY_FORM_URL` in `.env`).
5. **Recent Status Filtering**: Bot `/status` commands only display active enquiries and recently cancelled bookings (cancelled within the last 24 hours).

---

## 🐳 Running Locally (Dockerized)

To build and run the entire CRM container stack (MySQL, API, and Client) on any machine with Docker installed:

1. Clone the repository and open the workspace.
2. Create your environment configuration:
   ```bash
   cp backend/.env.example backend/.env
   cp .env.example .env
   ```
   *(Paste your `TELEGRAM_BOT_TOKEN` in the `.env` files to test Telegram features. If left blank, notifications will gracefully print to the server console log).*
3. Launch the container stack:
   ```bash
   docker compose up --build -d
   ```
4. Run migrations and seed database data inside the API container:
   ```bash
   docker compose exec backend node seed.js
   ```
5. Access the applications:
   * **Customer Enquiry Portal**: [http://localhost:5175/enquiry](http://localhost:5175/enquiry)
   * **Staff Login Portal**: [http://localhost:5175/login](http://localhost:5175/login)
     * *Admin Account*: `admin@manivtha.com` / `admin123`
     * *Executive Account*: `staff@manivtha.com` / `staff123`
   * **API Health Check**: [http://localhost:5050/health](http://localhost:5050/health)

---

## 💻 Running Locally (Without Docker)

### Backend API Setup
1. Navigate to `/backend` and install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Configure `.env` (pointing host DB to `127.0.0.1` and port `3306`).
3. Create your MySQL database `manivtha_crm`, and run the seed script:
   ```bash
   node seed.js
   ```
4. Start the development API server:
   ```bash
   npm run dev
   ```

### Frontend Client Setup
1. Navigate to `/frontend` and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Client runs on [http://localhost:5175](http://localhost:5175).*

---

## 🧪 Testing

### Automated API Tests (Postman)
1. Run the API server.
2. Import `tests/api/manivtha-crm.postman_collection.json` inside Postman.
3. Configure your Postman environment (setting `base_url` to `http://localhost:5050/api` or your server URL) and trigger the Runner.

### Manual Verification
Review test criteria and checklist items in `tests/manual/test-cases.md`.
