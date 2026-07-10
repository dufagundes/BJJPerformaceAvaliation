# SMS & Email Message Tracking - API Capabilities & Implementation Plan

## 🔍 Service Provider Capabilities

### Twilio SMS
**Outbound Tracking:**
- ✅ Message SID (unique ID for tracking)
- ✅ Status: queued, sending, sent, failed, delivered, undelivered
- ✅ Timestamps: creation, sent, delivery
- ✅ Cost tracking
- ✅ Error codes & reasons

**Inbound Tracking:**
- ✅ Incoming SMS via webhooks
- ✅ Sender phone number
- ✅ Message content
- ✅ Timestamp
- ⚠️ Requires webhook configuration (we can implement)

**API Available:**
```
GET /2010-04-01/Accounts/{sid}/Messages/{messageSid}
GET /2010-04-01/Accounts/{sid}/Messages (list all with filters)
```

### Resend Email
**Outbound Tracking:**
- ✅ Email ID
- ✅ Status: sent, delivered, bounced, complained
- ✅ Open tracking (optional)
- ✅ Click tracking (optional)
- ✅ Timestamp

**Inbound Tracking:**
- ❌ NO built-in reply tracking
- ❌ NO webhook for replies
- ℹ️ Email replies go to configured mailbox, not API

**Limitation:** Can't track email replies programmatically

---

## 📊 Proposed Implementation

### 1. Database Schema for Message Tracking

```typescript
model SmsMessage {
  id            String    @id @default(uuid()) @db.Uuid
  schoolId      String    @db.Uuid
  cycleId       String?   @db.Uuid
  reviewerId    String?   @db.Uuid
  contactId     String?   @db.Uuid
  
  // Twilio tracking
  twilioSid     String    @unique  // Message SID for tracking
  toPhone       String
  fromPhone     String
  messageBody   String
  
  // Status tracking
  messageType   String    // "invite", "reminder", "confirmation", "other"
  status        String    // "queued", "sent", "delivered", "failed", "replied"
  
  // Timestamps
  sentAt        DateTime
  deliveredAt   DateTime?
  repliedAt     DateTime?
  failureReason String?
  
  // Cost tracking
  costAmount    Decimal   @db.Decimal(6, 4)
  costCurrency  String    @default("USD")
  
  // Related data
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  school School @relation(fields: [schoolId], references: [id], onDelete: Restrict)
  cycle  EvaluationCycle? @relation(fields: [cycleId], references: [id], onDelete: SetNull)
  reviewer Reviewer? @relation(fields: [reviewerId], references: [id], onDelete: SetNull)
  contact Contact? @relation(fields: [contactId], references: [id], onDelete: SetNull)

  @@index([schoolId])
  @@index([cycleId])
  @@index([reviewerId])
  @@index([contactId])
  @@index([status])
  @@index([sentAt])
}

model SmsReply {
  id            String    @id @default(uuid()) @db.Uuid
  schoolId      String    @db.Uuid
  
  // Original message reference
  originalSid   String    // Twilio SID of original message
  
  // Reply details
  replyFromPhone String
  replyToPhone   String
  messageBody    String
  twilioSid      String    @unique
  
  // Timestamps
  receivedAt     DateTime
  createdAt      DateTime  @default(now())

  school School @relation(fields: [schoolId], references: [id], onDelete: Restrict)

  @@index([schoolId])
  @@index([originalSid])
  @@index([receivedAt])
}

model EmailMessage {
  id            String    @id @default(uuid()) @db.Uuid
  schoolId      String    @db.Uuid
  cycleId       String?   @db.Uuid
  reviewerId    String?   @db.Uuid
  contactId     String?   @db.Uuid
  
  // Resend tracking
  resendId      String    @unique
  toEmail       String
  fromEmail     String
  subject       String
  
  // Status tracking
  messageType   String    // "invite", "reminder", "confirmation"
  status        String    // "sent", "delivered", "bounced", "complained"
  
  // Timestamps
  sentAt        DateTime
  deliveredAt   DateTime?
  failureReason String?
  
  // Note: Email replies not tracked (go to mailbox)
  hasReplied    Boolean   @default(false) // Manual flag if admin forwards reply
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  school School @relation(fields: [schoolId], references: [id], onDelete: Restrict)
  cycle  EvaluationCycle? @relation(fields: [cycleId], references: [id], onDelete: SetNull)
  reviewer Reviewer? @relation(fields: [reviewerId], references: [id], onDelete: SetNull)
  contact Contact? @relation(fields: [contactId], references: [id], onDelete: SetNull)

  @@index([schoolId])
  @@index([cycleId])
  @@index([status])
  @@index([sentAt])
}
```

---

## 🔄 Implementation Workflow

### Phase 1: Outbound Message Logging
1. When SMS is sent → Log to `SmsMessage` with Twilio SID
2. When email is sent → Log to `EmailMessage` with Resend ID
3. Store: message body, recipient, type, timestamp

### Phase 2: Status Polling
1. Periodic job (every 5-10 min) polls Twilio API for message status
2. Updates `SmsMessage.status` and `deliveredAt`
3. Tracks failures and reasons

### Phase 3: Inbound SMS Webhook
1. Configure Twilio webhook → POST to `/api/webhooks/twilio/inbound`
2. Receive incoming SMS from evaluators
3. Log to `SmsReply` table
4. Update original message status to "replied"
5. Admin dashboard shows reply

### Phase 4: Admin Dashboard
1. Message history view (SMS + Email)
2. Filter by: school, contact, cycle, date, status, type
3. See replies in conversation view
4. Export message logs for audit

---

## 📋 API Endpoints Needed

```
# Message History
GET /api/admin/messages
  ?cycleId=...&contactId=...&status=...&dateFrom=...&dateTo=...
  
# Message Details
GET /api/admin/messages/{messageId}

# SMS Polling Job
POST /api/jobs/sync-sms-status (admin only)

# Twilio Webhook (receives inbound SMS)
POST /api/webhooks/twilio/inbound
  headers: X-Twilio-Signature (for verification)
  body: { FromNumber, ToNumber, Body, MessageSid, ... }

# Message Logs Export
GET /api/admin/messages/export?format=csv
```

---

## 🎯 Alternatives for Email Replies

Since Resend doesn't provide reply tracking:

**Option A: Manual Flag** (Simple)
- Admin manually marks "Replied" if they forward email to system
- Low tech, works with existing email setup

**Option B: Reply-To Email** (Better)
- Send emails with Reply-To pointing to a monitored mailbox
- Parse replies with email parsing service (limited options)
- Store in database manually

**Option C: Email Webhook Service** (Best but complex)
- Use Postmark, SendGrid, or Mailgun instead of Resend
- These have inbound email webhooks
- Requires switching email provider

**Option D: Dual System** (Recommended)
- Keep Resend for sending (it's good)
- For replies: Use separate email forwarding rule
- Manual processing by admin (copies to database)

**My Recommendation:**
For now → **Option A (Manual flag)** or **Option D (Email forwarding)**
Later → Consider switching to **SendGrid** for full email tracking

---

## 💾 Cost Impact

**Twilio SMS Status Polling:**
- Using Twilio API to check status: No extra cost (included)
- Webhook for inbound: No extra cost (included)

**Additional Costs:**
- If switching email: SendGrid ~$25-100/month (vs Resend)
- Database storage: Negligible (small message logs)

---

## 🚀 Quick Implementation Path

**MVP (Week 1):**
- ✅ Add `SmsMessage` table for logging
- ✅ Log SMS when sent (capture Twilio SID)
- ✅ Admin API to view message history

**Phase 2 (Week 2):**
- ✅ Status polling job
- ✅ Inbound SMS webhook for replies
- ✅ Dashboard view

**Phase 3 (Week 3):**
- ✅ Email message logging (Resend)
- ✅ Combined SMS+Email view
- ✅ Export functionality

---

## ❓ Questions for You

1. **Email Replies:** Which option do you prefer?
   - A: Manual flag (simplest)
   - B: Reply-To forwarding (medium)
   - D: Dual system (best of both)
   - Switch to SendGrid (most complete)

2. **Inbound SMS:** Do you want:
   - Just delivery confirmation?
   - Full reply tracking?
   - Automatic response handling?

3. **Timeline:** Start now or after SMS invites are working?

4. **Admin Access:** Should all admins see all schools' messages, or only their own school?
