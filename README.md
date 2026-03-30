# 🏠 HousingIQ — AI-Powered Housing Research Agent

HousingIQ is an AI agent that helps anyone make smarter housing decisions globally. Built with Groq (LLaMA 3.3 70B), MongoDB, Tavily web search, and Node.js — it goes beyond simple chat by using specialized tools to calculate, compare, search, and save housing data in real time.

🌐 **Live Demo:** [housingiq-agent-production.up.railway.app](https://housingiq-agent-production.up.railway.app)

---

## ✨ Features

- 💰 **True Cost Calculator** — calculates real monthly cost (rent + utilities + commute + misc) and annual total
- 🏙️ **City Comparison** — side-by-side breakdown of two cities with monthly and annual savings
- 🔍 **Live Web Search** — searches the web for current rental prices in any city using Tavily
- 🔖 **Save Properties** — save properties you're interested in, tied to your user account
- 📊 **Compare Saved Properties** — compare two saved properties side by side
- 🗑️ **Delete Properties** — remove properties from your saved list
- 📋 **Moving Checklist** — generates a tailored checklist for any city and move-in date
- 👤 **User Auth** — name-based sessions so each user has their own saved properties

---

## 🛠️ Tech Stack

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| AI Model   | Groq — LLaMA 3.3 70B              |
| Web Search | Tavily API                        |
| Database   | MongoDB Atlas                     |
| Backend    | Node.js + Express + TypeScript    |
| Frontend   | Vanilla HTML/CSS/JS               |
| Deployment | Railway (auto-deploy from GitHub) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Groq API key](https://console.groq.com)
- A [MongoDB Atlas](https://cloud.mongodb.com) cluster
- A [Tavily API key](https://tavily.com)

### Installation

```bash
git clone https://github.com/krnkhadia321-web/housingiq-agent.git
cd housingiq-agent
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
GROQ_API_KEY=your_groq_api_key
MONGODB_URI=your_mongodb_connection_string
TAVILY_API_KEY=your_tavily_api_key
```

### Run Locally

```bash
npx tsx src/server.ts
```

Open [http://localhost:3000](http://localhost:3000)

---

## 💬 How to Use

1. Open the app and enter your name — your saved properties are tied to your account
2. Type naturally in the chat input
3. When a tool runs, a structured card appears alongside the reply

**Example queries to try:**

```
What would it cost to live in Lisbon with $1200 rent?
Compare Dubai and Singapore for cost of living
What is the average rent for a 1 bedroom in Tokyo right now?
Save an apartment in Shibuya, Tokyo with $1800 rent
Show me my saved properties
Compare my Tokyo and Mumbai saved properties
Delete my Tokyo property
Generate a moving checklist for Berlin, moving June 1st
```

---

## 🗂️ Project Structure

```
housingiq-agent/
├── src/
│   ├── server.ts      # Express server + Groq agent loop
│   ├── tools.ts       # All 8 tool definitions and functions
│   └── db.ts          # MongoDB connection
├── public/
│   └── index.html     # Frontend UI
├── .env               # API keys (not committed)
├── tsconfig.json
└── package.json
```

---

## 🧠 How the Agent Works

1. User sends a message
2. Groq's LLaMA model decides which tool to call (if any)
3. The tool runs — calculation, web search, or database operation
4. The result is fed back to the model
5. The model generates a natural language reply + the frontend renders a structured card

---

## 📸 Screenshots

| Cost Breakdown                  | City Comparison           | Saved Properties          |
| ------------------------------- | ------------------------- | ------------------------- |
| Itemized monthly + annual costs | Side-by-side with savings | Personal list with delete |

---

## 📄 License

MIT
