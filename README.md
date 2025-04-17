# Exam Platform

A comprehensive web-based examination platform built with Node.js, MySQL, and modern web technologies. This platform allows instructors to create, manage, and share exams while students can securely take exams and track their progress.

## Features

### User System
- User Registration and Authentication
- Secure JWT-based Authentication
- Password Strength Validation
- Simplified Verification Process
- User Profile Management

### Exam Management
- Create Custom Exams with Multiple Question Types
- Multiple-Choice Questions (MCQ) Support
- Direct Answer Questions Support
- Question Bank Management
- Exam Sharing via Unique Access Links
- Real-time Question Navigation
- Answer Tracking and Progress Indicators

### Student Experience
- Intuitive Exam Taking Interface
- Interactive Question Navigation
- Real-time Answer Saving
- Automatic Exam Submission
- Detailed Score Reports
- Exam History and Performance Tracking

### Dashboard and Analytics
- User Dashboard with Exam Statistics
- Performance Tracking and Analysis
- Detailed Exam Scores with Categorization
- Historical Performance Trends

## Prerequisites
Before you begin, ensure you have the following installed:
- Node.js (v14.0 or higher)
- MySQL (v8.0 or higher)
- npm (v6.0 or higher)

## Installation and Setup

### Database Setup
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
- Set up all necessary tables (users, exams, questions, etc.)
- Create required indexes
- Add a test user (email: test@example.com, password: Test@123)

### Application Setup
1. Clone the repository:
```bash
git clone https://github.com/yourusername/exam_platform.git
cd exam_platform
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=exam_platform
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

4. Start the server:
```bash
npm start
```

5. Access the application at `http://localhost:3000`

## Project Structure
```
exam_platform/
├── backend/
│   ├── config/
│   │   ├── db.js          # Database connection configuration
│   │   └── config.js      # General configuration settings
│   ├── controllers/
│   │   ├── auth.js        # Authentication controller
│   │   └── exams.js       # Exam management controller
│   ├── middleware/
│   │   └── auth.js        # Authentication middleware
│   ├── routes/
│   │   ├── auth.js        # Authentication routes
│   │   └── exams.js       # Exam management routes
│   └── server.js          # Main server file
├── frontend/
│   ├── public/
│   │   ├── css/
│   │   │   └── style.css  # Main stylesheet
│   │   ├── js/
│   │   │   ├── main.js              # Core functionality & authentication
│   │   │   ├── create_exam.js       # Exam creation functionality
│   │   │   ├── take_exam.js         # Exam taking functionality
│   │   │   └── exams.js             # Exam listing and management
│   │   └── images/                  # Image assets
│   └── views/
│       ├── index.html              # Landing page
│       ├── login.html              # Login page
│       ├── signup.html             # Registration page
│       ├── dashboard.html          # User dashboard
│       ├── create_exam.html        # Exam creation page
│       ├── take_exam.html          # Exam taking page
│       └── exams.html              # Exam listing page
├── database.sql                    # Database schema and setup
├── package.json                    # Project dependencies
└── README.md                       # Project documentation
```

## Key Components

### Backend
- **Authentication System**: JWT-based authentication with password hashing
- **Exam Management**: Create, read, update, and delete exam functionality
- **Question Processing**: Handles various question types and scoring
- **API Endpoints**: RESTful API for all platform features

### Frontend
- **Modern UI**: Clean, responsive interface built with CSS3 and HTML5
- **Interactive Components**: Dynamic question navigation, real-time answer saving
- **Client-side Validation**: Form validation and data integrity checks
- **Local Storage**: Temporary exam data storage for offline capability

## Dependencies
The project uses the following main dependencies:
- express: Web application framework
- mysql2: MySQL client for Node.js
- bcrypt: Password hashing library
- jsonwebtoken: JWT implementation
- dotenv: Environment variable management

## Development and Contribution
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements
- Thanks to all contributors who have helped shape this platform
- Special thanks to the open-source community for their invaluable tools and libraries

---

For any questions or issues, please open an issue in the GitHub repository.
