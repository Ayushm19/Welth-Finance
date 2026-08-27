
---

# 💸 Welth – Your AI-Powered Personal Finance Manager

🌐 **Live Demo**: [https://welth-finance-iota.vercel.app/](https://welth-finance-iota.vercel.app/)

---

## 📊 Overview

**Welth** is a modern, AI-enhanced personal finance platform. Track your income and expenses, set monthly budgets, and receive smart insights powered by Google Gemini AI — all from one sleek dashboard.

---

## 🚀 Features

* 🔐 **Google OAuth sign-in** — Auth.js session-based auth with encrypted cookie sessions
* 🔄 **Access & refresh tokens** — Google access token stored server-side with automatic refresh on expiry
* 🪟 **Sign-in dialog** — modal Google-only login from header, hero, and invite flows
* 👤 **User sync** — Google accounts synced to MongoDB (`googleId`, email, name, avatar)
* ✅ Add, edit, and delete transactions
* 📸 Receipt scanning with AI (Gemini) for auto-filled transaction details
* 🔁 Recurring income and expense entries (Inngest cron jobs)
* 📈 Monthly financial reports with AI-generated insights
* 🧠 Google Gemini integration for spending insights and receipt parsing
* 📧 Email reports and alerts via Resend
* 🚨 Budget monitoring with smart alert triggers
* 📊 Category-wise breakdowns, charts, and account-level analytics
* 👥 **Team collaboration** — create teams, invite teammates, accept/decline invites
* 🏦 **Shared accounts** — team members spend from admin balance with monthly limits
* 🛡️ **Member permissions** — admin controls what each teammate can access
* 📋 **Transaction attribution** — “By” column shows who created each spend on shared accounts
* 🎨 Responsive UI built with Next.js 15 + shadcn/ui

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 14, React, Tailwind CSS, shadcn/ui
* **Backend**: MongoDB, Mongoose, Inngest (background jobs)
* **AI**: Google Gemini (Generative AI, 1.5 Flash)
* **Email**: Resend + React Email templates
* **Infrastructure**: Vercel (hosting), Inngest (cron jobs & workflows)

---

## 📂 Folder Structure

```
/app
  /(main)                    → Protected app routes (auth required)
    /dashboard               → Dashboard, budgets, accounts overview
    /account/[id]            → Account detail, charts, transactions
    /transaction/create      → Add transaction + receipt scanner
    /team                    → Team admin workspace
  /sign-in                   → Google sign-in page
  /sign-up                   → Google sign-up page
  /invite/[token]            → Accept or decline team invites
  /api
    /auth/[...nextauth]      → Auth.js OAuth handlers
    /inngest                 → Inngest webhook endpoint
    /seed                    → Demo data seeding
/actions
  account.js                 → Account CRUD
  budget.js                  → Budget management
  dashboard.js               → Dashboard data loaders
  team.js                    → Teams, invites, permissions, shared spend
  transaction.js             → Transaction CRUD
  send-email.js              → Resend email actions
  seed.js                    → Seed demo transactions
/auth.js                     → Auth.js config (Google OAuth, token refresh)
/middleware.js               → Route protection + session checks
/components
  sign-in-dialog.jsx         → Google sign-in modal
  auth-session-watcher.jsx   → Handles expired refresh tokens
  providers.jsx              → SessionProvider wrapper
  user-avatar.jsx            → Shared avatar component
  /team                      → Team sidebar, admin panel, invite drawers
  /ui                        → shadcn/ui primitives (dialog, drawer, etc.)
/emails
  template.jsx               → Monthly report & budget alert templates
  invite.jsx                 → Team invite email template
/lib
  checkUser.js               → Sync session user → MongoDB
  getAccessToken.js          → Server helper for Google access token
  mongoose.js                → MongoDB connection
  /inngest                   → Background jobs (reports, recurring txns, alerts)
/models
  allModels.js               → User, Account, Transaction, Budget, Team, TeamMember
/hooks
  use-fetch.js               → Client-side server action hook
```

---

## 🧰 Local Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/Ayushm19/Welth-Finance.git
   cd Welth-Finance
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env.local` file:

   ```
   MONGODB_URI=your_mongodb_url
   RESEND_API_KEY=your_resend_key
   GEMINI_API_KEY=your_google_gemini_key
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open in browser**
   Visit [http://localhost:3000](http://localhost:3000)

---

## 📧 Email Reports

Built with `@react-email/components`, you’ll receive:

* 📅 **Monthly Summary** with income/expense breakdown and AI insights
* 🚨 **Budget Alert** when spending crosses 80% of your set limit

---

## 🧠 AI-Powered Insights

With Google Gemini, Welth offers:

* Personalized budget suggestions
* Smart spending breakdowns
* Actionable financial tips based on your behavior

---

## 📸 Screenshots

| Dashboard                                    | Email Report                             | Budget Alert                             |
| -------------------------------------------- | ---------------------------------------- | ---------------------------------------- |
| ![Dashboard](https://res.cloudinary.com/dhysjuvz2/image/upload/v1751873173/iwuq6ddprmmuokmlu3ev.png) | ![Email](https://res.cloudinary.com/dhysjuvz2/image/upload/v1751873291/fmezk2j5ipp7halqo3zw.png) | ![Alert](https://res.cloudinary.com/dhysjuvz2/image/upload/v1751873400/uggajpyvcg7pjkmpbnky.png) |


---

---

## 🤝 Contributing

Contributions are welcome!
Please open an issue for discussion before submitting major changes.

---

## 📄 License

MIT © 2025 [Ayush Mishra](https://github.com/ayushm19)

---
```
