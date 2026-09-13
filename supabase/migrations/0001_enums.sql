-- All enums up front. `alter type ... add value` can't run in the same
-- transaction as its use, and six later migrations reference these.

create type sex as enum ('male', 'female', 'unspecified');

create type unit_system as enum ('metric', 'imperial');

create type activity_level as enum ('sedentary', 'light', 'moderate', 'high', 'athlete');

create type goal_type as enum ('fat_loss', 'muscle_gain', 'strength', 'endurance', 'general_health');

create type experience_level as enum ('beginner', 'intermediate', 'advanced');

create type equipment_kind as enum ('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'bands');

create type meal_status as enum ('processing', 'ready', 'failed', 'manual');

create type habit_cadence as enum ('daily', 'weekly');

create type job_kind as enum ('meal_vision', 'program_gen', 'form_summary', 'weekly_checkin');

create type job_status as enum ('pending', 'succeeded', 'failed', 'fallback');
