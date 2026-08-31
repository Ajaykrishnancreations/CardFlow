# CardFlow — Step-by-Step Setup Guide

This guide explains how to start, navigate, and test the CardFlow application on your machine.

---

## Step 1: Running the Application in Chrome

### Command 1: Navigate to the frontend directory
* **What it does:** Changes your active terminal directory to `frontend`.
* **Where to run:** Terminal at the project root (`/CardFlow`).
* **Command:**
  ```bash
  cd frontend
  ```
* **Expected Result:** Your terminal prompt changes to `.../CardFlow/frontend`.

---

### Command 2: Install dependencies
* **What it does:** Downloads and installs React, React Native Web, Webpack, and UI components.
* **Where to run:** Inside the `frontend` folder.
* **Command:**
  ```bash
  npm install
  ```
* **Expected Result:** Terminal displays `added ... packages` without errors.

---

### Command 3: Start the development web server
* **What it does:** Starts the Webpack development server and compiles the React Native Web application.
* **Where to run:** Inside the `frontend` folder.
* **Command:**
  ```bash
  npm run web
  ```
* **Expected Result:** Terminal outputs:
  ```
  <i> [webpack-dev-server] Project is running at:
  <i> [webpack-dev-server] Loopback: http://localhost:3000/
  <i> [webpack-dev-server] Content not from webpack is served from 'public'
  ```

---

## Step 2: Testing the 3 User Flows in Chrome

Open your Chrome browser and navigate to:
👉 **`http://localhost:3000`**

### Flow A: Normal User Flow
1. On the Splash Screen, click **"Get Started with Phone"**.
2. Under "DEVELOPMENT TEST ACCOUNTS", click the **"Normal User (1234567890)"** card.
3. On the OTP screen, click **"Quick Fill & Verify (123456)"**.
4. You will be logged in to the **Normal User Home Screen**:
   - Browse Coimbatore categories (Manufacturing, IT, Textiles, Hardware, etc.).
   - Tap any business (e.g., *Kovai Precision Tools*) to view details, call, WhatsApp, or send an enquiry.
   - Tap **"Search"** in the bottom bar to filter by distance radius (2km, 5km, 10km) and GST verification.
   - Tap **"Scan Card"** (center camera button) to test physical card capture and save modes.
   - Tap **"Saved Cards"** to view your Card Vault with private star ratings, tags, and export options.
   - Tap **"Profile"** to see your ID Verified badge and 30 monthly free scans counter.

---

### Flow B: Business Owner Flow (Managing Multiple Businesses)
1. Click the Logout icon in the top right header.
2. Under "DEVELOPMENT TEST ACCOUNTS", click **"Business Owner (9876543210)"**.
3. Verify with OTP `123456`.
4. You will see the **Business Owner Dashboard**:
   - Notice the **Multi-Business Switcher** at the top: switch between *Kovai Precision Tools* and *Apex Infotech Solutions*.
   - Tap **"QR Code"** to view the full-screen counter display with public URL `https://cardflow.app/b/{slug}`.
   - Tap **"Share Card"** to test 1-tap WhatsApp, SMS, and Email sharing.
   - Tap **"Enquiries"** in the bottom tab bar to inspect incoming customer leads with 1-tap WhatsApp reply.
   - Tap **"Analytics"** to view profile impressions and contact button click counts.

---

### Flow C: In-App Admin Flow
1. Click the Logout icon in the top right header.
2. Under "DEVELOPMENT TEST ACCOUNTS", click **"Admin (9999988888)"**.
3. Verify with OTP `123456`.
4. You will enter the **In-App Admin Console**:
   - View live Platform KPIs (Total Users, Verified Listings, Pending KYC).
   - Tap **"KYC Queue"** to view side-by-side legal name matches against government GSTIN registries with 1-tap **Approve & List** or **Reject**.
   - Tap **"Users"** to manage user accounts and view verification status.
   - Tap **"Listings"** to audit business directory search visibility.
   - Tap **"Settings"** to toggle pre-moderation and adjust sponsored slot limits.

---

## Troubleshooting & Tips

* **Port Conflict:** If port `3000` is already in use by another service on your machine, Webpack dev server will offer port `3001` automatically.
* **Clearing Session:** If you want to reset your local test session, click the Logout icon in the top right header or clear local storage.
