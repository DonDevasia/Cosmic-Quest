-- Drop existing tables if re-initializing
DROP TABLE IF EXISTS buzzer_events CASCADE;
DROP TABLE IF EXISTS score_history CASCADE;
DROP TABLE IF EXISTS team_tasks CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS event_state CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- 1. Teams Table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_number INTEGER UNIQUE NOT NULL,
    team_name TEXT NOT NULL,
    member_a TEXT, -- Role A
    member_b TEXT, -- Role B
    member_c TEXT, -- Role C
    member_d TEXT, -- Role D
    team_code TEXT UNIQUE NOT NULL, -- Used by players to log in
    total_score INTEGER DEFAULT 0,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    base_points INTEGER DEFAULT 100,
    time_limit_seconds INTEGER DEFAULT 480, -- 8 minutes
    status VARCHAR(50) DEFAULT 'Locked',
    completion_keyword VARCHAR(255),
    venue_hint TEXT,
    start_keyword VARCHAR(255)
);

-- 4. Team-Task Assignments (Many-to-Many with Status)
CREATE TABLE team_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'Assigned' CHECK (status IN ('Assigned', 'In Progress', 'Submitted', 'Completed', 'Failed')),
    is_active BOOLEAN DEFAULT FALSE,
    points_awarded INTEGER DEFAULT 0,
    submission_payload TEXT,
    admin_feedback TEXT,
    UNIQUE(team_id, task_id)
);

-- Ensure a team can only have one active task at a time
CREATE UNIQUE INDEX unique_active_team ON team_tasks (team_id) WHERE is_active = TRUE;

-- 4. Score History (Audit Trail)
CREATE TABLE score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL, -- Optional, if linked to a task
    points_change INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Announcements
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Event State (Timer & Global config)
CREATE TABLE event_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_active BOOLEAN DEFAULT FALSE,
    timer_running BOOLEAN DEFAULT FALSE,
    start_time TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,
    total_duration_seconds INTEGER DEFAULT 7200, -- Default 2 hours
    elapsed_seconds INTEGER DEFAULT 0
);

-- Insert initial single Event State row
INSERT INTO event_state (is_active) VALUES (false);

-- Insert 10 tasks
INSERT INTO tasks (task_number, title, description, base_points, status, completion_keyword, start_keyword, venue_hint) VALUES 
(1, 'Tongue Twister', 'Say the tongue twister perfectly without making a mistake', 1000, 'Locked', 'HAHAHA', 'VENUE_01', 'I go forward, I go back, yet never leave my place'),
(2, 'QR Scanner', 'Scan and decode the hidden QR codes', 1000, 'Locked', 'THE_ARCHITECT', 'VENUE_02', 'To meet the master , Two steps, zero excuses, nine chances…
Sounds like a strange combination, right? 👀'),
(3, 'Thugwar', 'Compete in the Thugwar challenge', 1000, 'Locked', '12223', 'VENUE_03', '         (0, 1)


(-1, 0)     ?     (1, 0)

            
           (0, -1)'),
(4, 'Object Scanner', 'Identify the correct objects', 1000, 'Locked', NULL, 'VENUE_04', 'carbon,helium,'),
(5, 'Word Game', 'Solve the linguistic puzzles', 1000, 'Locked', 'SPACE', 'VENUE_05', 'Oru tulli , pallatulli ,peru vellam'),
(6, 'Convince Me', 'Convince your virtual ex-gf to patch up with you', 1000, 'Locked', 'ONE', 'VENUE_06', 'Machines have their secrets, but don''t look for them on the floor. Search where every step takes you closer'),
(7, 'Dictionary Game', 'Identify the correct term from the dictionary definition', 1000, 'Locked', '7272', 'VENUE_07', ''),
(8, 'Morse Code', 'Decode the intercepted transmissions', 1000, 'Locked', 'GROUND', 'VENUE_08', 'Kisi Ka Bhai Kisi Ki Jaan'),
(9, 'Bottle Counting', 'Analyze the image and count the bottles', 1000, 'Locked', '42', 'VENUE_09', 'There existed Three little pigs, each one called E,
When it was a hot day, they wanted to rest under a TREE.'),
(10, 'TANGRAM', 'Solve the Tangram puzzle', 1000, 'Locked', 'SMART', 'VENUE_10', 'Follow the path to where many stay; before you arrive, find where the wheels choose to stay'),
(11, 'Phase 2 - QR 1', 'Find the QR code at Location 1', 1000, 'Locked', 'LOC1_CODE', 'VENUE_11', 'Owl of the college is here '),
(12, 'Phase 2 - QR 2', 'Find the QR code at Location 2', 1000, 'Locked', 'LOC2_CODE', 'VENUE_12', 'IF:
    You speak in CODE
    AND
    You stand before the BLOCK
THEN:
    LOOK AHEAD'),
(13, 'Phase 2 - QR 3', 'Find the QR code at Location 3', 1000, 'Locked', 'LOC3_CODE', 'VENUE_13', 'Kombidamaanin kannidayumpol

kombinu melambu kondaal Take it easy

penmaniyaamee venmanimeddil

chilliloru kallerinjaal Take it easy oru nokkil vaakkil minnithennum

idiminnal thottaal Take it easy

ee poomarathile pullukalude paattilakumbam Take it easy

Take it easy man'),
(14, 'Phase 2 - Final Destination', 'Reach the final location to claim victory', 1000, 'Locked', 'VICTORY', 'VENUE_14', 'Try:

Turning off aeroplane mode
Turning on mobile data or Wi-Fi
Checking the signal in your area
ERR_INTERNET_DISCONNECTED');

-- Enable Supabase Realtime for these tables
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table team_tasks;
alter publication supabase_realtime add table score_history;
alter publication supabase_realtime add table announcements;
alter publication supabase_realtime add table event_state;
