# Kids Learning Platform Game 🎮📚

A web-based educational game platform designed for kids. Players join a room and play a board-game style experience powered by questions/answers. Includes an Admin panel to manage rooms and question sets.

> ✅ Built as a full-stack project: **React + Vite** frontend, **Spring Boot** backend, **MySQL** database.

---

## ✨ Features

- Multiplayer **Rooms / Lobby** flow
- Board-game style gameplay (turn-based / progression)
- **Question & Answer** mechanics (educational content)
- Admin panel for:
  - Room creation & management
  - Question management (and linking questions to rooms)
- Backend REST API (and real-time updates if enabled in your project)
- Ready for deployment with environment variables (and Docker optional)

---

## 🧰 Tech Stack

**Frontend**
- React (Vite)
- JavaScript / JSX
- Fetch / REST integration

**Backend**
- Spring Boot
- Spring Web, Validation
- JPA / Hibernate
- Security 

**Database**
- MySQL

---

## 📸 Screenshots


```md

📁 Project Structure
kids-learning-platform/
├─ frontend/                 # React + Vite
├─ backend/                  # Spring Boot
└─ database/                 # MySQL 
✅ Prerequisites
Node.js (LTS recommended)

Java (your project version, e.g., 17+ or 21)

MySQL 8+

Git

🔐 Environment Variables (IMPORTANT)
Frontend (frontend/.env)
Create a file: frontend/.env

VITE_API_BASE_URL=http://localhost:8080
Do not commit real secrets. Use .env.example if you want to share a template.

Backend (backend/src/main/resources/application.properties or application.yml)
Example (edit to match your project):

spring.datasource.url=jdbc:mysql://localhost:3306/kids_game?useSSL=false&serverTimezone=UTC
spring.datasource.username=YOUR_DB_USER
spring.datasource.password=YOUR_DB_PASSWORD

# JPA (optional)
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false

# Server
server.port=8080

▶️ Run Locally (Development)
1) Start MySQL
Create a database (example):

CREATE DATABASE kids_game;
2) Run Backend
From /backend:

# if using Gradle
./gradlew bootRun

# or Maven
mvn spring-boot:run
Backend should run at:

http://localhost:8080

3) Run Frontend
From /frontend:

npm install
npm run dev


📄 License
MIT License

Copyright (c) 2026 Huseyin Tozluyurt

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


### Next (quick win)
If you paste your **repo structure** (just a screenshot or the folder tree) + your **main features list** (ro
