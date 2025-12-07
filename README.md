# FitTrack Pro - Fitness Tracking Application

A comprehensive fitness tracking web application built with Node.js, Express, EJS, and MySQL.

## Features

- User authentication with secure password hashing
- Dashboard with workout statistics
- Add and track workouts with multiple exercises
- Search functionality for finding past workouts
- Goal setting and progress tracking
- Detailed statistics and analytics
- Exercise library with multiple categories

## Technology Stack

- **Backend**: Node.js with Express framework
- **Database**: MySQL
- **Template Engine**: EJS
- **Authentication**: bcrypt for password hashing
- **Session Management**: express-session
- **Validation**: express-validator

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm (Node Package Manager)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fittrack-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   
   First, create the database user:
   ```sql
   CREATE USER 'health_app'@'localhost' IDENTIFIED BY 'qwertyuiop';
   GRANT ALL PRIVILEGES ON health.* TO 'health_app'@'localhost';
   FLUSH PRIVILEGES;
   ```

   Then, create the database structure:
   ```bash
   mysql -u health_app -p < create_db.sql
   ```

   Finally, insert test data:
   ```bash
   mysql -u health_app -p < insert_test_data.sql
   ```

4. **Configure environment variables**
   
   The `.env` file should already contain:
   ```
   HEALTH_HOST=localhost
   HEALTH_USER=health_app
   HEALTH_PASSWORD=qwertyuiop
   HEALTH_DATABASE=health
   HEALTH_BASE_PATH=http://localhost:8000
   ```

5. **Run the application**
   ```bash
   node index.js
   ```

   The application will be available at `http://localhost:8000`

## Default Login Credentials

After running the test data script, you can login with the test user credentials found in `insert_test_data.sql`

## Application Structure

```
fittrack-app/
├── index.js                 # Main application file
├── package.json             # Dependencies and scripts
├── create_db.sql            # Database schema
├── insert_test_data.sql     # Test data
├── views/                   # EJS templates
│   ├── header.ejs
│   ├── footer.ejs
│   ├── index.ejs
│   ├── about.ejs
│   ├── login.ejs
│   ├── register.ejs
│   ├── dashboard.ejs
│   ├── search.ejs
│   ├── add-workout.ejs
│   ├── workout-detail.ejs
│   ├── goals.ejs
│   └── statistics.ejs
└── public/                  # static files
    └── css/
        └── style.css
```

## Database Schema

### Tables

1. **users** - User accounts
2. **exercise_types** - Library of available exercises
3. **workouts** - User workout sessions
4. **workout_exercises** - Exercises performed in each workout
5. **user_goals** - User fitness goals

## Usage

### Registering a New User

1. Navigate to the Register page
2. Fill in the required information
3. Password must meet requirements:
   - Minimum 8 characters
   - At least one lowercase letter
   - At least one uppercase letter
   - At least one number
   - At least one special character

### Adding a Workout

1. Log in to your account
2. Click "Add Workout" in the navigation
3. Enter workout date and duration
4. Add exercises with sets, reps, weight, distance, or calories
5. Submit the form

### Searching Workouts

1. Navigate to the Search page
2. Enter keywords (date, exercise name, or notes)
3. View matching workouts

### Setting Goals

1. Go to the Goals page
2. Add a new goal with target value and date
3. Track progress towards your goals

## Support

For issues or questions, contact support@fittrackpro.com

## License

This project is for educational purposes
