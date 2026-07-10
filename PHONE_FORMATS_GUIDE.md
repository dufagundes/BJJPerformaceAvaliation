# Phone Number Support - Format Guide

## ✅ What's Supported

The system now automatically accepts and normalizes phone numbers in multiple formats:

### Accepted Formats

All of these will be converted to `+14155552671`:

- **US 10-digit**: `415-555-2671`
- **US 10-digit no formatting**: `4155552671`
- **US with parentheses**: `(415) 555-2671`
- **US with country code**: `1-415-555-2671`
- **US with country code and spaces**: `+1 415 555 2671`
- **Already E.164**: `+14155552671` (used as-is)

### Not Supported

❌ Formats that are too short or malformed:
- `555-2671` (4 digits - too short)
- `abc-def-ghij` (letters instead of numbers)
- Empty/blank values (skipped)

---

## 📋 CSV Upload with Phone Numbers

### Format

| type    | name           | email                    | phone              | student_name     |
|---------|----------------|--------------------------|-------------------|------------------|
| Student | Jane Student   | jane@example.com         | 415-555-2671      | (empty)          |
| Student | John Doe       | john@example.com         | (415) 555-2672    | (empty)          |
| Parent  | Mary Parent    | mary@example.com         | +1 415 555 2673   | Tommy Parent     |
| Parent  | Bob Smith      | bob@example.com          | 14155552674       | Sarah Smith      |

### Phone Column
- **Optional** - Can be left empty
- **Auto-normalized** - System converts to E.164 format automatically
- **Flexible formats** - Accepts dashes, parentheses, spaces, country codes
- **Case-insensitive** - Works with any formatting variation

### Template Download

From the admin panel, download the template CSV which shows examples:

```csv
type,name,email,phone,student_name
Student,Jane Student,jane.student@example.com,415-555-2671,
Student,John Doe,john.doe@example.com,(415) 555-2672,
Parent,Mary Parent,mary.parent@example.com,+1 415 555 2673,Tommy Parent
Parent,Bob Smith,bob.smith@example.com,14155552674,Sarah Smith
```

---

## 👤 User Registration Forms

When staff/administrators register or update their profile:

1. **Phone Number Field** - Accepts any format
2. **Auto-Formatting** - Shows formatted version as you type
3. **Validation** - Real-time format checking
4. **Storage** - Saved in E.164 format internally

### Example Input → Output

```
Input:  415 555 2671    →  Output: +14155552671
Input:  (415) 555-2671  →  Output: +14155552671
Input:  +1-415-555-2671 →  Output: +14155552671
Input:  14155552671     →  Output: +14155552671
```

---

## 💬 SMS Sending

Once a phone number is stored, SMS reminders are automatically sent:

- ✅ Evaluation invites
- ✅ Deadline reminders (3, 1 day before)
- ✅ Completion confirmations

**No action needed** - System uses normalized phone numbers automatically.

---

## 🔧 API & Utility Functions

Available in `lib/phoneUtils.ts`:

```typescript
// Normalize to E.164
normalizePhoneNumber("415-555-2671") 
// Returns: "+14155552671"

// Format for display
formatPhoneForDisplay("+14155552671")
// Returns: "(415) 555-2671"

// Validate phone
isValidPhoneNumber("415-555-2671")
// Returns: true

// Parse components
parsePhoneNumber("+14155552671")
// Returns: { valid: true, formatted: "(415) 555-2671", countryCode: "1", ... }
```

---

## ⚙️ Default Country Code

The system defaults to **US (+1)** for phone normalization.

To change for international deployments:
- Update `phoneUtils.ts` - change `defaultCountryCode` parameter
- Or pass country code when normalizing: `normalizePhoneNumber(phone, "44")` for UK

---

## 🧪 Testing

### Test via CSV Upload

1. Download template
2. Add phone numbers in any format
3. Upload CSV
4. System shows parsed results with normalized numbers

### Test via API

```bash
POST /api/admin/test-sms
{
  "to": "4155552671",          # Any format works
  "message": "Test message"
}
```

---

## 📱 E.164 Format

**E.164** is the international standard for phone numbers:
- Starts with `+`
- Followed by 1-3 digit country code
- Followed by national number
- Total: 10-15 digits

Example: `+1` (US) + `4155552671` = `+14155552671`

---

## ❓ FAQ

**Q: Do I need to add the + sign?**  
A: No! The system adds it automatically if missing.

**Q: Can I use dashes and parentheses?**  
A: Yes! The system removes them automatically.

**Q: What if I'm outside the US?**  
A: Use the international country code. Examples:
- UK: `+44...`
- Canada: `+1...` (same as US)
- Mexico: `+52...`

**Q: What if the phone is invalid?**  
A: The system will show a warning but won't fail the upload. SMS just won't be sent for that contact.

**Q: Can I leave it blank?**  
A: Yes! The phone field is optional. Only SMS will be affected (email still works).
