
# Vitto: AI-First Digital Credit Infrastructure 

This project involves building a technical product website for Vitto, an AI-native infrastructure designed specifically for Banks, NBFCs, and Microfinance Institutions (MFIs). Unlike traditional software that simply adds AI features to legacy systems, Vitto is built from the ground up using machine learning, agentic AI, and full-stack lending automation.





## Live link
Live Demo: https://vitto-app.vercel.app/


## tech stack



**Client:** React, TailwindCSS,

**Server:** Node, Express,render,

**DB:**   Postgress,mongodb,renderpostgress





## file structure

vitto-app/
├── client/          # React Frontend (Vite)

│   ├── src/         # Components and Pages

│   └── tailwind.config.js

├── server/          # Node.js Backend

│   ├── index.js     # Express Server & Routes

│   └── .env         # Environment Variables (Secrets)

└── README.md        # Project Documentation
## Getting Started

1. Prerequisites
Node.js (v18 or higher)

PostgreSQL instance (e.g., Supabase or Render)

MongoDB Atlas cluster

2. Backend Setup
Navigate to the server directory: cd server

Install dependencies: npm install

Create a .env file and add the following:


Code snippet
PORT=5000
MONGO_URI=your_mongodb_connection_string
POSTGRES_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
Start the server: node index.js


3. Frontend Setup
Navigate to the client directory: cd client

Install dependencies: npm install

Start the development server: npm run dev

Important: For mobile testing on a local network, use npm run dev -- --host and replace localhost in your API calls with your computer's local IP address.
## API Reference



```http
  POST /api/auth/send-otp
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `api_key` | `string` | Generates 6-digit code; stores in MongoDB |



```http
  POST /api/auth/verify-otp
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `id`      | `string` | Validates OTP; returns JWT session 

```http
  POST /api/leads
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `id`      | `string` | Saves validated organization details to PostgreSQL


```http
 GET /api/leads/:id
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `id`      | `string` | Retrieves a specific lead record by ID.





## description

Development Mode Notice
The platform is currently operating in Development Mode. The OTP dispatch system is designed for local environment testing. Due to local network and CORS restrictions, the verification system may not be reachable via a standard mobile browser unless configured through a dedicated network tunnel (like Ngrok) or physical USB debugging.