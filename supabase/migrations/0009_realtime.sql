-- meals only, not meal_items: one ready meal is 1-8 item INSERTs arriving
-- out of order relative to the status flip. One meals UPDATE -> one targeted
-- refetch of that meal's items (see hooks/useMealsRealtime.ts, M2).
alter publication supabase_realtime add table meals;
