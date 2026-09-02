# Smart Canteen Queue & Pre-Ordering System
## Somaiya Vidyavihar University — Siddhi Services Canteen

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account (free tier works)

### Installation

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   ```

2. **Setup Server**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Add MONGO_URI and JWT_SECRET to .env
   npm run dev
   ```

3. **Setup Client**
   ```bash
   cd client
   npm install
   cp .env.example .env
   npm run dev
   ```

### Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@somaiya.edu | Admin@123 |
| Staff | staff@somaiya.edu | Staff@123 |
| Student | rahul@somaiya.edu | Student@123 |

### Architecture Overview
- **Frontend**: React 18, Vite, Tailwind CSS v3, Socket.IO Client, React Router
- **Backend**: Node.js, Express, MongoDB/Mongoose, Socket.IO
- Real-time updates handled entirely over Socket.IO event listeners on context providers.

### Deployment
- **Frontend**: Deploy `client` folder to Vercel. Ensure build command is `npm run build` and publish dir is `dist`.
- **Backend**: Deploy `server` folder to Render or Heroku. Add Environment variables.
