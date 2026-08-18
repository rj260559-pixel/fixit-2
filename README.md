# ServiceConnect — MVP

Local home-services marketplace (jaisa UrbanClap/Housejoy). Core flow:

```
Home → Category → Search (location) → Provider Profile → Login/Signup →
Request Service (Booking) → Provider accepts/completes → Customer Review
```

Payments/subscriptions abhi include NAHI hain — jaisa MVP plan mein decide hua tha.

---

## Kya-kya included hai

- **Backend:** Node.js + Express + MongoDB (Mongoose)
- **Auth:** JWT-based signup/login, roles: `customer`, `provider`, `admin`
- **20 categories + subcategories** (seed script se auto-populate hoti hain)
- **Location-based provider search** (`$near` geospatial query — "AC Repair near me")
- **Provider profile, availability, services & pricing**
- **Booking system** (request → accepted → in_progress → completed → cancelled)
- **Reviews & ratings** (real database se calculate hote hain, dummy numbers nahi)
- **Admin panel** — providers ko approve/reject karne ke liye (isके bina naya provider search mein kabhi nahi dikhega)
- **Frontend:** Plain HTML/CSS/JS (koi build step nahi chahiye), backend hi static files serve karta hai — ek hi server, ek hi command se sab chalta hai

---

## Prerequisites

1. **Node.js** (v18 ya usse upar) — [nodejs.org](https://nodejs.org) se install karo
2. **MongoDB** — do options:
   - **Local MongoDB** install karo ([mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)), ya
   - **MongoDB Atlas** (free cloud DB) — [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) par free account banao aur connection string lo

---

## Exact Run Steps

### 1. Dependencies install karo
Project folder ke andar terminal khol kar:
```bash
npm install
```

### 2. Environment file banao
`.env.example` ko copy karke `.env` banao:
```bash
cp .env.example .env
```
Phir `.env` file open karke `MONGO_URI` set karo:
- **Local MongoDB** chal raha hai to default value already sahi hai:
  ```
  MONGO_URI=mongodb://127.0.0.1:27017/serviceconnect
  ```
- **MongoDB Atlas** use kar rahe ho to apna connection string paste karo:
  ```
  MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/serviceconnect
  ```

`JWT_SECRET` ko bhi kisi bhi random long string se replace kar do.

### 3. MongoDB start karo (agar local use kar rahe ho)
```bash
mongod
```
(Agar Atlas use kar rahe ho to yeh step skip karo.)

### 4. 20 categories + subcategories seed karo
```bash
npm run seed
```
Isse database mein saari categories (Plumber, Electrician, AC Repair, ... Home Security) aur unki subcategories create ho jaayengi.

### 5. Admin account banao
```bash
npm run seed:admin
```
Ye print karega:
```
Email:    admin@serviceconnect.com
Password: admin123
```
(Isse baad mein login karke providers approve kar sakte ho.)

### 6. Server start karo
```bash
npm start
```
Terminal mein ye dikhna chahiye:
```
MongoDB connected: ...
ServiceConnect server running on http://localhost:5000
```

### 7. Browser mein kholo
```
http://localhost:5000
```

---

## Poora flow test kaise karein

1. **Provider signup karo** — `Become a Provider` → role select karo `Provider` → account bana lo
2. Provider dashboard mein jaake **"My Profile & Services"** tab se: business name, about, city, services (category + subcategory + price), aur location set karo (📍 button se)
3. **Admin se login karo** (`admin@serviceconnect.com` / `admin123`) → `admin.html` par jaake us provider ko **Approve** karo
   (Bina approval ke koi bhi naya provider search results mein nahi dikhega — yahi verification system hai)
4. Ab **customer signup karo** (naye browser tab/incognito mein, ya pehle logout karo)
5. Homepage se category select karo, ya "Use my current location" button se search karo
6. Provider card par click karke profile dekho → **Request Service** → date/time/address bharke submit karo
7. Provider dashboard (provider account se login karke) mein jaake request ko **Accept → Start Job → Mark Completed** karo
8. Customer dashboard mein wapas jaake completed booking par **Leave Review** karo — rating provider profile par automatically update ho jaayega

---

## Project Structure

```
service-connect/
├── server.js                  # Express entry point (API + serves frontend)
├── config/db.js                # MongoDB connection
├── models/                     # Mongoose schemas
├── controllers/                # Route logic
├── routes/                     # API route definitions
├── middleware/                 # Auth + error handling
├── seed/
│   ├── categoriesData.js       # 20 categories + subcategories data
│   ├── seed.js                 # Run: npm run seed
│   └── createAdmin.js          # Run: npm run seed:admin
└── public/                     # Frontend (HTML/CSS/JS, no build step)
    ├── index.html               # Home
    ├── search.html               # Search results
    ├── provider.html             # Provider profile
    ├── login.html / signup.html
    ├── booking.html               # Request service form
    ├── dashboard-customer.html
    ├── dashboard-provider.html
    ├── admin.html                 # Provider verification
    ├── css/style.css
    └── js/                        # api.js + one file per page
```

---

## Abhi kya included NAHI hai (agla phase)

Yeh MVP scope se jaan-bujh kar bahar rakha gaya hai — pehle core flow ko stable karna better hai:

- **Payments / commission** — booking abhi free hai, payment gateway (Razorpay/Stripe) baad mein add karna
- **Hindi/English language toggle** — abhi UI sirf English mein hai; `nameHi` fields database mein already hain, translation layer baad mein add ho sakta hai
- **Notifications** (email/SMS/push) — abhi sirf dashboard mein status dikhta hai
- **Complaints system**
- **Image uploads** (provider photos, documents) — abhi text URL field hai, actual file upload (Cloudinary/S3) add karna hoga
- **Full admin dashboard** (customers list, all bookings, reports) — sirf provider verification abhi hai

Ye sab upar wale database schema (Notification, Complaint models already schema doc mein hain) ke upar hi banenge, to expand karna easy hoga.

---

## Common issues

- **"MongoDB connection error"** → MongoDB chal nahi raha, ya `.env` mein `MONGO_URI` galat hai
- **Categories homepage par nahi dikh rahi** → `npm run seed` chalana bhool gaye
- **Naya provider search mein nahi dikh raha** → admin se approve karna baaki hai (`admin.html`)
- **Port already in use** → `.env` mein `PORT=5000` ko kisi aur number (jaise `5001`) se badal do
