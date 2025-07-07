
---

# 💸 Welth – Your AI-Powered Personal Finance Manager

🌐 **Live Demo**: [https://welth-finance-ayushmishra-zeta.vercel.app](https://welth-finance-ayushmishra-zeta.vercel.app)

---

## 📊 Overview

**Welth** is a modern, AI-enhanced personal finance platform. Track your income and expenses, set monthly budgets, and receive smart insights powered by Google Gemini AI — all from one sleek dashboard.

---

## 🚀 Features

* ✅ Add, edit, and delete transactions
* 🔁 Recurring income and expense entries
* 📈 Monthly financial reports with AI-generated insights
* 🧠 Integration with Google Gemini AI
* 📧 Email reports and alerts via Resend
* 🚨 Budget monitoring with smart alert triggers
* 📊 Category-wise breakdowns and charts
* 🎨 Sleek and responsive UI (Next.js + shadcn/ui)

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
  /dashboard         → Main dashboard page
  /transaction       → Add/view transactions
  /emails            → Email templates (alerts, reports)
  /api               → API routes for DB and AI actions
/lib
  mongoose.js        → MongoDB connection logic
/actions
  send-email.js      → Sends emails via Resend
/models
  allModels.js       → Schemas: User, Account, Budget, Transaction
/inngest
  functions.js       → Monthly reports, recurring txns, budget alerts
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
