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
<img width="1778" height="955" alt="user_management" src="https://github.com/user-attachments/assets/de7e9103-1ae5-4451-99c6-85715efb0c08" />
<img width="1780" height="956" alt="room_management" src="https://github.com/user-attachments/assets/f2e87ff7-97d8-4302-93c6-6675398b71b9" />
<img width="1792" height="933" alt="question_management2" src="https://github.com/user-attachments/assets/c6cc8f48-a5ab-4534-add6-9f8a45cd5c6e" />
<img width="1788" height="931" alt="question_management" src="https://github.com/user-attachments/assets/6a68af04-fd4b-47ff-aa30-9a468c9d3717" />
<img width="1775" height="952" alt="odalar" src="https://github.com/user-attachments/assets/82e6a95c-0333-4a8a-b57f-9c6aa9608fea" />
<img width="1648" height="699" alt="giris" src="https://github.com/user-attachments/assets/f6d7044d-599d-4bfb-8c6c-6900ae3d8cdc" />
<img width="1796" height="950" alt="game3" src="https://github.com/user-attachments/assets/90d06ae9-d69c-4b6b-906d-85fa845e5565" />
<img width="1799" height="954" alt="game2" src="https://github.com/user-attachments/assets/38d7c55b-79d7-470f-a9d7-af2e8cdb4508" />
<img width="1794" height="959" alt="game_lobby" src="https://github.com/user-attachments/assets/20c329cc-2622-4afd-9c16-80bc5d6802e3" />
<img width="1803" height="951" alt="game_end" src="https://github.com/user-attachments/assets/1409fa8a-d624-4f4d-9096-027924cbcd08" />
<img width="1786" height="960" alt="game" src="https://github.com/user-attachments/assets/d2828868-0b7e-43b2-9971-68ab3a35e1f1" />


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


