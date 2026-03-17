> Last updated: 2026-03-17

# WhatsApp Integration (Channel360 v1.1) — Invoice Notification

This demo sends an invoice notification via Channel360’s WhatsApp API using an **approved template**.

Reference docs: [Channel360 Notifications API](https://docs.channel360.co.za/api-usage/using-the-channel360-v1.1-api/notifications)

---

## Configuration

- **Endpoint**: `POST https://www.channel360.co.za/v1.1/org/{{orgId}}/notification`
- **orgId (demo)**: `639700347749ed00181de224`
- **Auth**: `Authorization: Bearer <token>` where `<token>` is `WA_API_KEY` from `.env`
- **Template**:
  - **name**: `ozow_demo_utility`
  - **language**: `en` (policy: `deterministic`)

> Never hardcode `WA_API_KEY` in code, docs, or commits. Read it from environment variables.

---

## Template payload requirements (this demo)

### Header component

Send a header component of type **`document`**:

- **link**: `https://filebin.net/vtljjhrgi3nuak4v/demo_contract.pdf`

### Body components (4 parameters)

Provide four body parameters in order:

1. **First name** of the customer
2. **Invoice number**
3. **Amount**
4. **Pay-by date**

---

## Example request (curl)

Export `WA_API_KEY` (or load it from `.env` using your preferred tooling) and call:

```bash
ORG_ID="639700347749ed00181de224"
DESTINATION="2700000000" # E.164-ish, demo number

curl -sS -X POST "https://www.channel360.co.za/v1.1/org/${ORG_ID}/notification" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${WA_API_KEY}" \
  -d '{
    "destination": "'"${DESTINATION}"'",
    "message": {
      "type": "template",
      "template": {
        "name": "ozow_demo_utility",
        "language": { "policy": "deterministic", "code": "en" },
        "components": [
          {
            "type": "header",
            "parameters": [
              {
                "type": "document",
                "document": {
                  "link": "https://filebin.net/vtljjhrgi3nuak4v/demo_contract.pdf"
                }
              }
            ]
          },
          {
            "type": "body",
            "parameters": [
              { "type": "text", "text": "Ava" },
              { "type": "text", "text": "INV-000123" },
              { "type": "text", "text": "R 15000.00" },
              { "type": "text", "text": "2026-03-31" }
            ]
          }
        ]
      }
    }
  }'
```

### Response expectations

On success, Channel360 returns a `notificationId` (request accepted). Delivery confirmation is separate and requires webhooks per the Channel360 documentation.

---

## Implementation notes (recommended)

- Treat a returned `notificationId` as “accepted”, not “delivered”.
- Always log/carry a correlation ID from invoice → notification request for traceability.
- For the demo, prefer a **toggle** for “simulate send” vs “real send” to avoid accidental messaging.

