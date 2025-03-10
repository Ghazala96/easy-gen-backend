## 📌 Prerequisites

Ensure you have the following installed:

- **[Node.js](https://nodejs.org/)**
- **[MongoDB](https://www.mongodb.com/try/download/community)** (Running locally or via Docker)
- **[npm](https://www.npmjs.com/get-npm)**

---

## ⚙️ Installation

1. **Install dependencies**
   ```sh
   npm install
   ```

2. **Set up environment variables**
   - Copy `.env.sample` to `.env`
   - Update values as needed.

3. **Ensure MongoDB is running**
   ```sh
   mongod
   ```
   or using Docker:
   ```sh
   docker run -d --name mongodb -p 27017:27017 mongo
   ```

---

## 🚀 Running the Project

Start the development server:
```sh
npm run start:dev
```

### 📡 API URLs:
- **Server:** `http://localhost:3000`
- **API Base URL:** `http://localhost:3000/api/v1`
- **Swagger Docs:** `http://localhost:3000/api/docs`