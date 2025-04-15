# Exam Platform

A web-based examination platform built with Node.js, MySQL, and modern web technologies.

## Current Features
- User Registration and Authentication
- Secure Login System with JWT
- User Profile Management
- Support for Multiple Academic Programs (Filières)
- Semester-based Organization

## Prerequisites
Before you begin, ensure you have MySQL (v8.0 or higher) installed on your system.

## Database Setup
1. Log in to MySQL as root:
```bash
mysql -u root -p
```

2. Copy and paste the contents of `database.sql` into your MySQL prompt, or run:
```bash
mysql -u root -p < database.sql
```

This will:
- Create the exam_platform database
- Set up all necessary tables (users, sessions)
- Create required indexes
- Add a test user (email: test@example.com, password: Test@123)

## How to start the server
```bash
cd exam_platform
```
```bash
npm start
```
## Project Structure
```
exam_platform/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── routes/
│   ├── controllers/
│   └── server.js
├── frontend/
│   ├── public/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       ├── main.js
│   │       ├── create_exam.js
│   │       └── exams.js
│   └── views/
│       ├── index.html
│       ├── login.html
│       ├── signup.html
│       ├── dashboard.html
│       ├── create_exam.html
│       ├── take_exam.html
│       └── exams.html
├── database.sql
├── package.json
└── README.md
```

## Dependencies
The project uses the following main dependencies:
- express
- mysql2
- bcrypt
- jsonwebtoken
- dotenv

---
