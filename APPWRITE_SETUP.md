# Appwrite Schema Setup

## Collections

### 1. profiles
- **Collection ID**: `profiles`
- **Permissions**: Document Level (Owner: CRUD)
- **Attributes**:
    - `userId`: String (size 36, unique)
    - `fullName`: String (size 128)
    - `email`: String (size 128)
    - `whatsappNumber`: String (size 15)
    - `yearOfStudy`: Enum (Year 1, Year 2, Year 3)
    - `program`: Enum (Registered Nursing, Midwifery, Public Health Nursing, Mental Health Nursing, Oncology Nursing, Paediatric Nursing)
    - `verified`: Boolean (default false)
    - `adminApproved`: Boolean (default true)
    - `deviceId`: String (size 128, nullable)

### 2. subscriptions
- **Collection ID**: `subscriptions`
- **Permissions**: Document Level (Owner: Read)
- **Attributes**:
    - `userId`: String (size 36)
    - `status`: Enum (ACTIVE, EXPIRED)
    - `startDate`: Datetime
    - `endDate`: Datetime

### 3. content
- **Collection ID**: `content`
- **Permissions**: Collection Level (Authenticated: Read)
- **Attributes**:
    - `title`: String (size 255)
    - `description`: String (size 1000)
    - `type`: Enum (PDF, AUDIO, PAST_PAPER)
    - `yearOfStudy`: Enum (Year 1, Year 2, Year 3)
    - `program`: Enum (Registered Nursing, Midwifery, Public Health Nursing, Mental Health Nursing, Oncology Nursing, Paediatric Nursing)
    - `storageFileId`: String (size 36)
    - `durationSeconds`: Integer (optional)

### 4. accessCodes
- **Collection ID**: `accessCodes`
- **Permissions**: Private (Only Functions)
- **Attributes**:
    - `code`: String (size 12, unique)
    - `durationDays`: Integer
    - `isUsed`: Boolean (default false)
    - `usedByUserId`: String (size 36, optional)
    - `usedAt`: Datetime (optional)

### 5. otpCodes
- **Collection ID**: `otpCodes`
- **Permissions**: Private (Only Functions)
- **Attributes**:
    - `userId`: String (size 36)
    - `whatsappNumber`: String (size 15)
    - `codeHash`: String (size 255)
    - `expiresAt`: Datetime
    - `attempts`: Integer (default 0)

## Storage Buckets

### content_files
- **Bucket ID**: `content_files`
- **Permissions**: Authenticated: Read

## Functions

### 1. sendWhatsappOtp
- **Trigger**: None (Manual call from client)
- **Environment**: Node.js/Python
- **Logic**: Generate OTP -> Hash -> Store in `otpCodes` -> Send via WhatsApp API (e.g. Twilio/Infobip).

### 2. verifyWhatsappOtp
- **Trigger**: None (Manual call from client)
- **Logic**: Find `otpCodes` for userId -> Compare hash -> If match: update `profiles.verified = true`, delete OTP code.

### 3. redeemAccessCode
- **Trigger**: None (Manual call from client)
- **Logic**: Check `accessCodes` -> If valid & !isUsed -> Update/Create `subscriptions` -> Mark code used.
