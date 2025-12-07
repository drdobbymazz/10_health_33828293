USE health;

-- Insert default user (username: gold, password: smiths123ABC$)
-- Password is hashed using bcrypt
INSERT INTO users (username, password, email, full_name) VALUES
('gold', '$2b$10$YQ98PFqGHI5R5kN3J3B3wO7VJYxKJH5F3KJ3lJ8J5J6J7J8J9JaJb', 'gold@fittrack.com', 'Gold Smith'),
('testuser', '$2b$10$YQ98PFqGHI5R5kN3J3B3wO7VJYxKJH5F3KJ3lJ8J5J6J7J8J9JaJb', 'test@fittrack.com', 'Test User');

-- Insert exercise types
INSERT INTO exercise_types (name, category, description) VALUES
('Running', 'Cardio', 'Outdoor or treadmill running'),
('Cycling', 'Cardio', 'Stationary or outdoor cycling'),
('Swimming', 'Cardio', 'Pool or open water swimming'),
('Bench Press', 'Strength', 'Upper body chest exercise'),
('Squats', 'Strength', 'Lower body leg exercise'),
('Deadlift', 'Strength', 'Full body compound exercise'),
('Pull-ups', 'Strength', 'Upper body back exercise'),
('Push-ups', 'Strength', 'Upper body bodyweight exercise'),
('Yoga', 'Flexibility', 'Mind-body flexibility practice'),
('Pilates', 'Flexibility', 'Core strength and flexibility'),
('Rowing', 'Cardio', 'Full body cardio exercise'),
('Jump Rope', 'Cardio', 'High intensity cardio'),
('Lunges', 'Strength', 'Lower body leg exercise'),
('Plank', 'Core', 'Isometric core exercise'),
('Burpees', 'HIIT', 'Full body high intensity exercise');

-- Insert sample workouts for the gold user
INSERT INTO workouts (user_id, workout_date, duration_minutes, notes) VALUES
(1, '2024-12-01', 45, 'Morning cardio session'),
(1, '2024-12-03', 60, 'Full body strength training'),
(1, '2024-12-05', 30, 'Quick evening run'),
(1, '2024-12-06', 50, 'Upper body focus'),
(1, '2024-12-07', 40, 'Leg day workout');

-- Insert workout exercises
INSERT INTO workout_exercises (workout_id, exercise_type_id, sets, reps, weight_kg, distance_km, calories_burned) VALUES
-- Workout 1 (Cardio)
(1, 1, NULL, NULL, NULL, 5.2, 350),
(1, 12, 3, 100, NULL, NULL, 150),
-- Workout 2 (Strength)
(2, 4, 4, 10, 80, NULL, 200),
(2, 5, 4, 12, 100, NULL, 250),
(2, 6, 3, 8, 120, NULL, 180),
-- Workout 3 (Cardio)
(3, 1, NULL, NULL, NULL, 3.5, 240),
-- Workout 4 (Upper body)
(4, 4, 5, 8, 85, NULL, 220),
(4, 7, 4, 12, NULL, NULL, 150),
(4, 8, 3, 20, NULL, NULL, 100),
-- Workout 5 (Leg day)
(5, 5, 5, 10, 110, NULL, 280),
(5, 13, 4, 12, 40, NULL, 200);

-- Insert sample goals
INSERT INTO user_goals (user_id, goal_type, target_value, current_value, target_date, achieved) VALUES
(1, 'Weight Loss', 75.0, 82.5, '2025-03-01', FALSE),
(1, 'Run Distance', 10.0, 5.2, '2025-01-31', FALSE),
(1, 'Bench Press Max', 100.0, 85.0, '2025-02-28', FALSE);
