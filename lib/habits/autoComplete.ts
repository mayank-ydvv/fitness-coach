/** Predicates for auto-completing habits (spec §8). Pure — the caller
 * supplies the day's already-fetched facts. */
export function shouldAutoCompleteWorkout(sessionsEndedToday: number): boolean {
  return sessionsEndedToday >= 1;
}

export function shouldAutoCompleteMeals(mealsLoggedToday: number): boolean {
  return mealsLoggedToday >= 2;
}
