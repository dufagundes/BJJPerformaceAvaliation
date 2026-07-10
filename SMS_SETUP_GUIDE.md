# SMS Integration Setup Guide

## Overview
This guide walks through setting up Twilio SMS integration for the GB Staff Performance system. SMS will be sent to parents, students, and staff to increase evaluation form participation.

## Phase 1: Local Testing (Before Production)

### Step 1: Get Twilio Credentials

1. Go to [Twilio Console](https://www.twilio.com/console)
2. Copy your **Account SID**
3. Copy your **Auth Token**
4. Get your **Twilio Phone Number** (sender number)

### Step 2: Update Environment Variables

Edit `.env` and replace the placeholders:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Test SMS Locally

**Option A: Using the test script (recommended)**

1. Edit `scripts/test-sms.mjs` and update `TEST_PHONE_NUMBER` with your phone number:
   ```javascript
   const TEST_PHONE_NUMBER = "+14155552671"; // Your phone number in E.164 format
   ```

2. Run the test:
   ```bash
   node --env-file=.env scripts/test-sms.mjs
   ```

3. Check your phone for the test message. You should receive it within seconds.

**Option B: Using the HTTP endpoint**

1. Start the development server:
   ```bash
   npm run dev
   ```

2. In another terminal, send a test SMS:
   ```bash
   curl -X POST http://localhost:3000/api/admin/test-sms \
     -H "Content-Type: application/json" \
     -d '{
       "to": "+14155552671",
       "message": "Hello! This is a test SMS from GB Staff Performance."
     }'
   ```

3. Or test an evaluation invite:
   ```bash
   curl -X POST http://localhost:3000/api/admin/test-sms \
     -H "Content-Type: application/json" \
     -d '{
       "to": "+14155552671",
       "type": "evaluation_invite",
       "name": "John Doe",
       "link": "http://localhost:3000/evaluate/abc123"
     }'
   ```

## Phase 2: Database Migration

Once testing is successful, you'll need to run the database migration:

```bash
npx prisma migrate dev --name add_phone_numbers
```

This adds the `phone` field to:
- `Contact` table (for parents/students)
- `User` table (for staff/admins)

## Phase 3: Update Admin Upload/Registration

### CSV Upload for Parents & Students

The contact CSV upload now supports phone numbers. The CSV format is:

```csv
type,name,email,phone,student_name
Student,Jane Student,jane.student@example.com,+14155552671,
Parent,John Parent,john.parent@example.com,+14155552671,Tommy Parent
```

**Required columns:** type, name, email  
**Optional columns:** phone, student_name

### Staff Registration

When staff/professors register, they'll be asked for their phone number.

## Phase 4: Integrate SMS into Workflows

SMS will be sent at these points:

1. **Evaluation Invitation**: When a new evaluation cycle is created
   - Send SMS with evaluation link and deadline

2. **Reminders**: Based on the reminder schedule
   - Send reminder SMS 3 days before deadline
   - Send reminder SMS 1 day before deadline

3. **Completion Confirmation**: After evaluation is submitted
   - Send confirmation SMS

## Available SMS Functions

### In `lib/smsService.ts`:

```typescript
// Send custom SMS
await sendSms(phoneNumber, message);

// Send evaluation invite
await sendEvaluationInviteSms(phoneNumber, name, evaluationLink);

// Send reminder
await sendReminderSms(phoneNumber, name, daysDue);

// Send completion confirmation
await sendCompletionConfirmationSms(phoneNumber, name);
```

## Phone Number Format

All phone numbers must be in **E.164 format**:
- ✅ Correct: `+14155552671`
- ❌ Incorrect: `415-555-2671`, `(415) 555-2671`, `4155552671`

## Troubleshooting

### "is not a valid phone number"
- Ensure the phone number is in E.164 format: `+{country_code}{number}`
- Example: USA → `+1`, UK → `+44`

### SMS not received
- Check that the Twilio phone number is verified for the recipient
- In Twilio test/trial accounts, you can only send to verified numbers
- Add the recipient number in Twilio Console → Phone Numbers → Verify

### Twilio credentials not found
- Ensure `.env` file exists in the project root
- Verify all three variables are set: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- Restart the development server after updating `.env`

## Cost Estimation

Twilio pricing (as of 2024):
- Outbound SMS to USA: ~$0.0075 per message
- Outbound SMS international: varies by country

For 100 people in an evaluation cycle with 3 messages each (invite, reminder, confirmation) = 300 SMS ≈ $2.25

## Next Steps

1. ✅ Set up Twilio credentials locally
2. ✅ Test SMS sending
3. ⏳ Run database migration when ready for production
4. ⏳ Integrate SMS into evaluation workflow
5. ⏳ Update admin UI to manage SMS sending
6. ⏳ Deploy to production

**Do not commit Twilio credentials to the repository!** They are loaded from environment variables.
