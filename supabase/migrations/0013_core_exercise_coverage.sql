-- Barbell- and dumbbell-only equipment selections had zero exercises tagged
-- movement_pattern = 'core', making program-generation validation (which
-- requires core coverage per split day) unsatisfiable for that combo
-- regardless of AI provider or the deterministic template fallback. Adds one
-- core exercise for each of those two equipment kinds.
insert into exercises (slug, name, primary_muscle, secondary_muscles, equipment, movement_pattern, is_unilateral, load_increment_kg, cues) values
('barbell-rollout', 'Barbell Rollout', 'core', '{shoulders,back}', 'barbell', 'core', false, 0, '{"Brace hard before rolling out","Stop before your hips sag","Pull back with the lats, not the lower back"}'),
('dumbbell-russian-twist', 'Dumbbell Russian Twist', 'core', '{}', 'dumbbell', 'core', false, 1.25, '{"Rotate from the torso, not the arms","Feet up for more challenge, down for less","Control the tempo, don''t rush"}');
