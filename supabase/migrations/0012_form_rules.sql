-- Populate form_rules (thresholds ONLY — evaluators live in
-- lib/form/rules/*.ts, M5 plan decision) + camera view for the six
-- exercises the spec's camera form-analysis feature covers.

update exercises set
  form_camera_view = 'side',
  form_primary_angle = 'knee',
  form_rules = '{
    "depth": {"full": 95, "partial": 120},
    "torso_lean": {"max": 55},
    "tempo": {"minEccentricMs": 600},
    "depth_consistency": {"maxSpread": 15}
  }'::jsonb
where slug in ('barbell-back-squat', 'dumbbell-goblet-squat', 'bodyweight-squat');

update exercises set
  form_camera_view = 'side',
  form_primary_angle = 'elbow',
  form_rules = '{
    "depth": {"full": 95, "shallow": 110},
    "hip_sag": {"sagMax": 160, "pikeMin": 190}
  }'::jsonb
where slug = 'push-up';

update exercises set
  form_camera_view = 'side',
  form_primary_angle = 'hip',
  form_rules = '{
    "hips_shoot_up": {"ratio": 1.4, "windowFraction": 0.3},
    "bar_path": {"maxDrift": 0.06},
    "lockout": {"minTopAngle": 170}
  }'::jsonb
where slug = 'barbell-deadlift';

update exercises set
  form_camera_view = 'side',
  form_primary_angle = 'elbow',
  form_rules = '{
    "lockout_alignment": {"maxSpread": 0.05},
    "lumbar_extension": {"maxLean": 15}
  }'::jsonb
where slug in ('barbell-overhead-press', 'dumbbell-shoulder-press');

update exercises set
  form_camera_view = 'side',
  form_primary_angle = 'hip',
  form_rules = '{
    "alignment": {"min": 165, "max": 185, "sustainedMs": 2000}
  }'::jsonb
where slug = 'plank';

-- Front-view squat variant: a distinct row is not created — front vs side
-- for the same exercise is a capture-flow choice (spec §7's squatFront
-- "adds" onto squatSide), not a different exercises row. The front-view
-- ruleset (lib/form/rules/squatFront.ts) is selected by the capture UI
-- passing cameraView:'front' for the same slug, not by a DB lookup.
