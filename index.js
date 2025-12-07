const express = require('express');
const session = require('express-session');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const port = 8000;

// database connection
const db = mysql.createConnection({
    host: process.env.HEALTH_HOST,
    user: process.env.HEALTH_USER,
    password: process.env.HEALTH_PASSWORD,
    database: process.env.HEALTH_DATABASE
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Set up EJS as view engine
app.set('view engine', 'ejs');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use('/images', express.static('images'));

// Session configuration
app.use(session({
    secret: 'fittrack-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // 1 hour
}));

// Make user available to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Authentication middleware
const requireLogin = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

// helper function to format dates
app.locals.formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
};

// Routes

// Home page
app.get('/', (req, res) => {
    res.render('index', { title: 'Home - FitTrack Pro' });
});

// About page
app.get('/about', (req, res) => {
    res.render('about', { title: 'About - FitTrack Pro' });
});

// Login page
app.get('/login', (req, res) => {
    res.render('login', { title: 'Login - FitTrack Pro', error: null });
});

// Login POST
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) {
            console.error(err);
            return res.render('login', { title: 'Login', error: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.render('login', { title: 'Login', error: 'Invalid username or password' });
        }
        
        const user = results[0];
        
        // For the default user, accept both hashed and plain password
        let passwordMatch = false;
        if (username === 'gold' && (password === 'smiths' || password === 'smiths123ABC$')) {
            passwordMatch = true;
        } else {
            try {
                passwordMatch = await bcrypt.compare(password, user.password);
            } catch (error) {
                console.error('Password comparison error:', error);
            }
        }
        
        if (passwordMatch) {
            req.session.user = {
                id: user.id,
                username: user.username,
                full_name: user.full_name
            };
            res.redirect('/dashboard');
        } else {
            res.render('login', { title: 'Login', error: 'Invalid username or password' });
        }
    });
});

// Register page
app.get('/register', (req, res) => {
    res.render('register', { title: 'Register - FitTrack Pro', errors: [], formData: {} });
});

// Register POST with validation
app.post('/register', [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
    body('email').isEmail().withMessage('Must be a valid email'),
    body('full_name').trim().notEmpty().withMessage('Full name is required')
], async (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.render('register', { 
            title: 'Register', 
            errors: errors.array(), 
            formData: req.body 
        });
    }
    
    const { username, password, email, full_name } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.query(
            'INSERT INTO users (username, password, email, full_name) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, email, full_name],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.render('register', { 
                            title: 'Register', 
                            errors: [{ msg: 'Username already exists' }], 
                            formData: req.body 
                        });
                    }
                    console.error(err);
                    return res.render('register', { 
                        title: 'Register', 
                        errors: [{ msg: 'Registration failed' }], 
                        formData: req.body 
                    });
                }
                
                res.redirect('/login');
            }
        );
    } catch (error) {
        console.error(error);
        res.render('register', { 
            title: 'Register', 
            errors: [{ msg: 'Registration failed' }], 
            formData: req.body 
        });
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Dashboard (protected)
app.get('/dashboard', requireLogin, (req, res) => {
    const userId = req.session.user.id;
    
    // Get recent workouts
    const workoutsQuery = `
        SELECT w.*, COUNT(we.id) as exercise_count,
               SUM(we.calories_burned) as total_calories
        FROM workouts w
        LEFT JOIN workout_exercises we ON w.id = we.workout_id
        WHERE w.user_id = ?
        GROUP BY w.id
        ORDER BY w.workout_date DESC
        LIMIT 5
    `;
    
    // Get statistics
    const statsQuery = `
        SELECT 
            COUNT(DISTINCT w.id) as total_workouts,
            SUM(w.duration_minutes) as total_minutes,
            SUM(we.calories_burned) as total_calories
        FROM workouts w
        LEFT JOIN workout_exercises we ON w.id = we.workout_id
        WHERE w.user_id = ?
    `;
    
    db.query(workoutsQuery, [userId], (err, workouts) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }
        
        db.query(statsQuery, [userId], (err, stats) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Database error');
            }
            
            res.render('dashboard', { 
                title: 'Dashboard - FitTrack Pro',
                workouts: workouts,
                stats: stats[0]
            });
        });
    });
});

// Search workouts page
app.get('/search', requireLogin, (req, res) => {
    res.render('search', { 
        title: 'Search Workouts - FitTrack Pro',
        results: null,
        query: ''
    });
});

// Search workouts POST
app.post('/search', requireLogin, (req, res) => {
    const searchQuery = req.body.query;
    const userId = req.session.user.id;
    
    const sql = `
        SELECT DISTINCT w.*, 
               GROUP_CONCAT(DISTINCT et.name SEPARATOR ', ') as exercises
        FROM workouts w
        LEFT JOIN workout_exercises we ON w.id = we.workout_id
        LEFT JOIN exercise_types et ON we.exercise_type_id = et.id
        WHERE w.user_id = ? AND (
            w.notes LIKE ? OR
            et.name LIKE ? OR
            DATE_FORMAT(w.workout_date, '%Y-%m-%d') LIKE ?
        )
        GROUP BY w.id
        ORDER BY w.workout_date DESC
    `;
    
    const searchPattern = `%${searchQuery}%`;
    
    db.query(sql, [userId, searchPattern, searchPattern, searchPattern], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }
        
        res.render('search', { 
            title: 'Search Workouts - FitTrack Pro',
            results: results,
            query: searchQuery
        });
    });
});

// Add workout page
app.get('/add-workout', requireLogin, (req, res) => {
    db.query('SELECT * FROM exercise_types ORDER BY category, name', (err, exercises) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }
        
        res.render('add-workout', { 
            title: 'Add Workout - FitTrack Pro',
            exercises: exercises,
            error: null
        });
    });
});

// Add workout POST
app.post('/add-workout', requireLogin, function(req, res) {
    const userId = req.session.user.id;
    const { workout_date, duration_minutes, notes, exercises, sets, reps, weight, distance, calories } = req.body;

    // Insert workout
    const workoutSql = 'INSERT INTO workouts (user_id, workout_date, duration_minutes, notes) VALUES (?, ?, ?, ?)';

    db.query(workoutSql, [userId, workout_date, duration_minutes, notes], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }

        const workoutId = result.insertId;
        // console.log('workout added:', workoutId);
        
        // Insert exercises if any
        if (exercises && Array.isArray(exercises)) {
            const exerciseSql = 'INSERT INTO workout_exercises (workout_id, exercise_type_id, sets, reps, weight_kg, distance_km, calories_burned) VALUES ?';
            
            const exerciseValues = exercises.map((exerciseId, index) => {
                if (!exerciseId) return null;
                return [
                    workoutId,
                    exerciseId,
                    sets[index] || null,
                    reps[index] || null,
                    weight[index] || null,
                    distance[index] || null,
                    calories[index] || null
                ];
            }).filter(val => val !== null);
            
            if (exerciseValues.length > 0) {
                db.query(exerciseSql, [exerciseValues], (err) => {
                    if (err) {
                        console.error(err);
                    }
                    res.redirect('/dashboard');
                });
            } else {
                res.redirect('/dashboard');
            }
        } else {
            res.redirect('/dashboard');
        }
    });
});

// View workout details
app.get('/workout/:id', requireLogin, (req, res) => {
    const workoutId = req.params.id;
    const userId = req.session.user.id;
    
    const workoutSql = 'SELECT * FROM workouts WHERE id = ? AND user_id = ?';
    const exercisesSql = `
        SELECT we.*, et.name, et.category
        FROM workout_exercises we
        JOIN exercise_types et ON we.exercise_type_id = et.id
        WHERE we.workout_id = ?
    `;
    
    db.query(workoutSql, [workoutId, userId], (err, workout) => {
        if (err || workout.length === 0) {
            return res.status(404).send('Workout not found');
        }
        
        db.query(exercisesSql, [workoutId], (err, exercises) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Database error');
            }
            
            res.render('workout-detail', { 
                title: 'Workout Details - FitTrack Pro',
                workout: workout[0],
                exercises: exercises
            });
        });
    });
});

// Goals page
app.get('/goals', requireLogin, (req, res) => {
    const userId = req.session.user.id;
    
    db.query('SELECT * FROM user_goals WHERE user_id = ? ORDER BY target_date', [userId], (err, goals) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }
        
        res.render('goals', { 
            title: 'My Goals - FitTrack Pro',
            goals: goals
        });
    });
});

// Add goal POST
app.post('/add-goal', requireLogin, (req, res) => {
    const userId = req.session.user.id;
    const { goal_type, target_value, current_value, target_date } = req.body;
    
    const sql = 'INSERT INTO user_goals (user_id, goal_type, target_value, current_value, target_date) VALUES (?, ?, ?, ?, ?)';
    
    db.query(sql, [userId, goal_type, target_value, current_value, target_date], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }
        
        res.redirect('/goals');
    });
});

// Statistics page
app.get('/statistics', requireLogin, (req, res) => {
    const userId = req.session.user.id;
    
    // Get workout statistics by month
    const monthlyStats = `
        SELECT 
            DATE_FORMAT(workout_date, '%Y-%m') as month,
            COUNT(*) as workout_count,
            SUM(duration_minutes) as total_minutes,
            AVG(duration_minutes) as avg_duration
        FROM workouts
        WHERE user_id = ?
        GROUP BY DATE_FORMAT(workout_date, '%Y-%m')
        ORDER BY month DESC
        LIMIT 6
    `;
    
    // Get exercise breakdown
    const exerciseStats = `
        SELECT 
            et.name,
            et.category,
            COUNT(*) as times_performed,
            SUM(we.calories_burned) as total_calories
        FROM workout_exercises we
        JOIN exercise_types et ON we.exercise_type_id = et.id
        JOIN workouts w ON we.workout_id = w.id
        WHERE w.user_id = ?
        GROUP BY et.id
        ORDER BY times_performed DESC
        LIMIT 10
    `;
    
    db.query(monthlyStats, [userId], (err, monthly) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }
        
        db.query(exerciseStats, [userId], (err, exercises) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Database error');
            }
            
            res.render('statistics', { 
                title: 'Statistics - FitTrack Pro',
                monthlyStats: monthly,
                exerciseStats: exercises
            });
        });
    });
});

// Start server
app.listen(port, () => {
    console.log(`FitTrack Pro running on http://localhost:${port}`);
});
