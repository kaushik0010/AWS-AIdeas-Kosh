# 💰 KOSH - Fintech Savings Platform

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-8-green?style=for-the-badge&logo=mongodb)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)

## 🎯 The Problem

Managing personal savings is hard, but managing *group savings* is even harder. Whether it's for a vacation, a shared goal, or a traditional savings circle (like a *susu* or *chit fund*), groups rely on messy spreadsheets, constant reminders, and social pressure. This process is prone to errors, missed payments, and a lack of transparency, often leading to failed goals and frustration.

## 💡 The Solution: KOSH

**KOSH** is a FinTech web application that digitizes and automates this entire process. It provides a secure, transparent, and motivating platform for both **individual** and **collaborative savings**.

By enforcing rules, automating contributions, and applying penalties for missed payments, KOSH transforms a chaotic social process into a simple, disciplined financial tool, helping users build healthy financial habits and achieve their goals together.


## 🧠 Key Design Decisions

### 1. Contribution Windows + Penalties
Instead of allowing payments anytime, I introduced fixed contribution windows.
- Late payments incur penalties (capped at 40%)
- Missed payments reduce final payout eligibility

**Tradeoff:** More complex backend logic  
**Reason:** Ensures fairness and prevents manipulation

### 2. Admin-Controlled Group Lifecycle
Admins control member approval, campaign start, and payout.
**Tradeoff:** Centralized control  
**Reason:** Mirrors real-world savings groups and avoids chaos

### 3. No Real Money Handling
This version intentionally avoids real payments.
**Reason:** Focus on system design and correctness before compliance & security complexity


## ✨ Key Features

### 👥 Group Savings (The Core)
* **Create & Join Groups:** Form public (auto-join) or private (admin approval) savings groups.
* **Group Campaigns:** Set shared savings goals with start/end dates and contribution amounts.
* **Contribution Tracking & Penalties** Tracks manual monthly contributions and automatically applies a penalty (up to 40%) for late/missed payments to enforce discipline.
* **Admin-Triggered Payouts:** After the campaign ends, the admin distributes the funds with a single click, triggering an equal and automated payout to all members.

### 👤 Individual & Wallet System
* **Individual Savings:** Create personal, private savings goals (with manual contributions) to track your own progress.
* **Personal Wallet:** Securely manage your funds, top-up your balance, and track all transaction history.
* **Secure Authentication:** Full login/register system with email verification (using NextAuth & JWT).
* **User Profiles:** Update personal details and manage your account.

### 🛡️ Smart Rules & Platform
* **Admin Controls:** Group admins manage members, approve requests, and oversee campaigns.
* **Spam Prevention:** Limits group joining requests to prevent system abuse.
* **Safe Deletion Logic:** Admins must distribute funds and delete their group *before* they can delete their own account, ensuring no one loses their money.
* **Dashboard:** A central hub to view your wallet, active campaigns, and group progress. 



## 🛠️ Tech Stack
- **Frontend:** Next.js 15, React 19, TailwindCSS, ShadCN UI, Axios
- **Backend:** Next.js API Routes (Node.js, Express-like)
- **Database:** MongoDB + Mongoose  
- **Auth:** NextAuth (JWT-based authentication)  
- **Deployment:** Vercel  



## 📂 Project Structure
    /app
        /api → Next.js API Routes
        /auth → Authentication pages
        /dashboard → User dashboard pages
        /groups → Group savings pages
    /src
        /features → Feature-based modules (auth, savings, profile)
        /components → Reusable UI components
    /components 
        /ui -> Shadcn ui components


## ⚡ Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/kaushik0010/KOSH.git
cd kosh
```
### 2️⃣ Install Dependencies
```
pnpm install
```
### 3️⃣ Configure Environment Variables

Create a .env.local file and add:
```
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
RESEND_API_KEY=your_resend_api_key
```

### 4️⃣ Run Locally
```
pnpm dev
```
Visit http://localhost:3000

### 5️⃣ Build for Production
```
pnpm build
pnpm start
```


## 📸 Screenshots

<details>
<summary>Click to expand/collapse screenshots</summary>

### Home Page
<img width="1920" alt="KOSH Home Page" src="https://github.com/user-attachments/assets/d5fbc74c-aecc-4aba-8b28-97a60bc2169e" />

### Register
<img width="1920" alt="register" src="https://github.com/user-attachments/assets/e2bc70e8-b411-4801-aeb6-fd1ad4f86e21" />

### Login
<img width="1920" alt="login" src="https://github.com/user-attachments/assets/76d8bc41-8ccd-4aa4-b209-21d8a0ed89cf" />

### Dashboard
<img width="1920" alt="dashboard" src="https://github.com/user-attachments/assets/bc6486d3-dbf9-425e-b800-b8d3dbaa61ab" />

### Update Profile
<img width="1920" alt="update-profile" src="https://github.com/user-attachments/assets/069b95e5-feec-43c0-b8c5-38f980feeaf7" />

### Individual Savings Plan Creation
<img width="1920" alt="individual savings plan" src="https://github.com/user-attachments/assets/d1268165-f655-4a57-8412-93271bf297ef" />

### All Groups
<img width="1920" alt="all groups" src="https://github.com/user-attachments/assets/708117f9-98ea-49e6-a98d-ebd7e00eb4df" />

### Create Group
<img width="1920" alt="create group" src="https://github.com/user-attachments/assets/aaaabdf7-b6c6-4eef-b76c-950af0c8038d" />

### Group Details
<img width="1920" alt="group-details" src="https://github.com/user-attachments/assets/bbfc409f-22dd-499c-ab19-b3fd7ca864f0" />

### Group Savings Campaign Creation
<img width="1920" alt="create campaign" src="https://github.com/user-attachments/assets/7019218f-ce04-42fe-8ed1-815bd9a39243" />

</details>



## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to fork this repo and submit a pull request.



## ⭐ Support

If you like this project, don’t forget to star ⭐ the repo!

