-- Migration for Venue Hints and Task Expiration

-- 1. Add new columns to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS venue_hint TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_keyword VARCHAR(255);

-- 2. Add new columns to team_tasks
ALTER TABLE team_tasks ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- 3. Modify status check constraint in team_tasks (Requires dropping and recreating)
-- In Postgres, it's easier to just drop the old constraint if it exists.
-- But we might not know its exact name. If it was generated automatically, it's usually table_column_check.
ALTER TABLE team_tasks DROP CONSTRAINT IF EXISTS team_tasks_status_check;
ALTER TABLE team_tasks ADD CONSTRAINT team_tasks_status_check CHECK (status IN ('Assigned', 'In Progress', 'Submitted', 'Completed', 'Failed'));

-- Update default status for new team_tasks
ALTER TABLE team_tasks ALTER COLUMN status SET DEFAULT 'Assigned';

-- 4. Update the existing tasks with dummy hints and start keywords
UPDATE tasks SET venue_hint = 'Look under the old oak tree in the courtyard.', start_keyword = 'VENUE_01' WHERE task_number = 1;
UPDATE tasks SET venue_hint = 'Head to the library reception desk.', start_keyword = 'VENUE_02' WHERE task_number = 2;
UPDATE tasks SET venue_hint = 'Find the glowing sign in the cafeteria.', start_keyword = 'VENUE_03' WHERE task_number = 3;
UPDATE tasks SET venue_hint = 'Behind the sports equipment rack.', start_keyword = 'VENUE_04' WHERE task_number = 4;
UPDATE tasks SET venue_hint = 'In the main hallway, near the vending machines.', start_keyword = 'VENUE_05' WHERE task_number = 5;
UPDATE tasks SET venue_hint = 'At the administrative office door.', start_keyword = 'VENUE_06' WHERE task_number = 6;
UPDATE tasks SET venue_hint = 'By the front gate security cabin.', start_keyword = 'VENUE_07' WHERE task_number = 7;
UPDATE tasks SET venue_hint = 'Inside the IT laboratory.', start_keyword = 'VENUE_08' WHERE task_number = 8;
UPDATE tasks SET venue_hint = 'On the roof terrace.', start_keyword = 'VENUE_09' WHERE task_number = 9;
UPDATE tasks SET venue_hint = 'The final location will be revealed... basement.', start_keyword = 'VENUE_10' WHERE task_number = 10;
