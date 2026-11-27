# DukaanLedger — Offline Clothing Retail POS & Udhaar App

## Key Customizations Included
1. **Clothing Business Specific:** Pre-configured quick garment tags (`Suit Set`, `Saree`, `Kurti`, `Lehenga`, `Dupatta / Stole`, `Alteration / Fall-Pico`) and garment-specific notes. Zero grocery/milk references.
2. **100% Clean Initial State:** Starts with zero pre-filled/dummy sales or fake customers.
3. **Strict On-Device Security & Zero Virus/Leakage Risk:**
   - Zero third-party analytics, zero ad SDKs, and zero cloud servers.
   - All sales and customer phone numbers stay strictly inside the phone's local storage partition (`navigator.storage.persist()` enabled).
   - Built-in 4-digit PIN Lock and local `.JSON` / `.CSV` backup export to phone Downloads.

## How to Generate the `.apk` File (2 Options)

### Option A: Zero-Setup Cloud Build via GitHub Actions (Recommended, ~3 mins)
1. Create a new private repository on GitHub and upload all files from this ZIP.
2. Open the **Actions** tab in your GitHub repository → select **Build Clean Android APK** → click **Run workflow**.
3. Once the green checkmark appears, download **DukaanLedger-Clothing-APK** (`app-debug.apk`) and install it on the Android phone.

### Option B: Local Build on Windows/Mac
```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```
In Android Studio, click **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
