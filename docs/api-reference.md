# API Reference — Manivtha CRM

All requests are served under the `/api` route. Unless specified as Public, all endpoints require the `Authorization` header with a valid JWT token.

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Authentication

### POST `/api/auth/login` (Public)
Authenticates staff members.
*   **Request Body**:
    ```json
    {
      "email": "staff@manivtha.com",
      "password": "staff123"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
      "user": {
        "id": 2,
        "name": "Booking Executive Sahil",
        "email": "staff@manivtha.com",
        "role": "executive"
      }
    }
    ```
*   **Error Response (401 Unauthorized)**:
    ```json
    {
      "success": false,
      "error": "Invalid credentials. Please try again."
    }
    ```

---

## 2. Enquiries

### POST `/api/enquiries` (Public)
Creates a new travel enquiry. Triggers a Telegram notification.
*   **Request Body**:
    ```json
    {
      "customer_name": "Jane Smith",
      "phone": "9876543210",
      "email": "jane@example.com",
      "source": "Website",
      "trip_type": "Round Trip",
      "pickup_location": "Bangalore Office",
      "drop_location": "Ooty Hotel",
      "travel_date": "2026-07-10",
      "return_date": "2026-07-15",
      "passengers": 4,
      "special_requirements": "Need SUV"
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "success": true,
      "enquiry_id": 6,
      "message": "Enquiry received"
    }
    ```

### GET `/api/enquiries` (Protected)
Retrieves a paginated list of enquiries. Supports search and filters.
*   **Query Parameters**:
    *   `page`: Page index (default: 1)
    *   `limit`: Page size (default: 20)
    *   `search`: Matches customer name or phone number
    *   `status`: New \| Contacted \| Confirmed \| Cancelled \| Completed
    *   `trip_type`: One-Way Drop \| Round Trip \| etc.
    *   `source`: WhatsApp \| Website \| etc.
    *   `date_from`: Filter travel_date >= YYYY-MM-DD
    *   `date_to`: Filter travel_date <= YYYY-MM-DD
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": 1,
          "customer_name": "John Doe",
          "phone": "9876543210",
          "email": "john@example.com",
          "source": "Website",
          "trip_type": "Airport Transfer",
          "pickup_location": "Bangalore",
          "drop_location": "Airport",
          "travel_date": "2026-06-27",
          "passengers": 2,
          "status": "New",
          "lead_temperature": "Hot",
          "notes_count": 0
        }
      ],
      "total": 1,
      "page": 1,
      "totalPages": 1
    }
    ```

### GET `/api/enquiries/:id` (Protected)
Retrieves single enquiry details with full history and notes.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "id": 2,
        "customer_name": "Priya Sharma",
        "phone": "9123456789",
        "status": "Contacted",
        "lead_temperature": "Hot",
        "notes": [
          {
            "id": 1,
            "note": "Spoke over phone. Follow up today.",
            "user_name": "Booking Executive Sahil",
            "created_at": "2026-06-24T06:00:00.000Z"
          }
        ],
        "status_history": [
          {
            "id": 1,
            "old_status": "New",
            "new_status": "Contacted",
            "user_name": "Booking Executive Sahil",
            "changed_at": "2026-06-24T06:00:00.000Z"
          }
        ]
      }
    }
    ```

### PATCH `/api/enquiries/:id/status` (Protected)
Updates status and writes to log.
*   **Request Body**: `{ "status": "Confirmed" }`
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Status updated successfully",
      "old_status": "Contacted",
      "new_status": "Confirmed"
    }
    ```

### POST `/api/enquiries/:id/notes` (Protected)
Appends a callback follow-up note.
*   **Request Body**: `{ "note": "Price confirmed by admin" }`

---

## 3. Bookings

### POST `/api/bookings` (Protected)
Converts enquiry to confirmed booking. Automatically updates status to `Confirmed`.
*   **Request Body**:
    ```json
    {
      "enquiry_id": 2,
      "vehicle_type": "Innova Crysta",
      "driver_name": "Ramesh Kumar",
      "driver_phone": "9845012345",
      "pickup_datetime": "2026-06-27 06:00:00",
      "total_amount": 8500.00,
      "advance_paid": 2000.00,
      "notes": "Include dual AC"
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "success": true,
      "booking_id": 2,
      "invoice_number": "INV-2026-06-0002",
      "message": "Booking confirmed and invoice generated successfully"
    }
    ```

### GET `/api/bookings/:id/invoice` (Protected)
Retrieves data for invoice printing.
