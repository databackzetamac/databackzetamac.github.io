# DataBack Zetamac (Alpha)

Minimal first pass clone of core Zetamac arithmetic sprint functionality:

- Random arithmetic problems across selectable operations (+, −, ×, ÷)
- Adjustable number range (inclusive)
- Durations: 30 / 60 / 120 / 300 seconds (easily extend)
- Instant advance when correct answer typed (no Enter needed)
- Tracks score, streak, max streak, accuracy
- Integer-only division (problems constructed to guarantee integer answers)
- Local session history persisted in `localStorage`

## Running
Just open `index.html` in a modern browser. No build step or dependencies.

## Keyboard Tips
- Type answer; next problem loads automatically if correct
- Press Enter to submit early if you've typed an incorrect value and want to move on (will be counted wrong)
- Press Space (during session) to re-focus the answer box

## Roadmap (Planned)
1. Enhanced styling & responsive layout overhaul
2. Difficulty presets / curated ranges
3. Weighted problem generation & adaptive difficulty
4. Detailed per-problem timeline & speed graph (client charts)
5. User accounts & cloud sync (likely with Supabase or lightweight backend)
6. Leaderboards & competitive modes
7. Advanced operations (exponents, mixed operations, fractions, modulo) - optional toggles
8. Accessibility pass (ARIA live regions, better focus management) & i18n
9. Offline-first PWA packaging
10. Export/import session history JSON / CSV

## Contributing
Open a PR or issue with suggestions. Keep first iterations dependency-free.

## License
MIT (to be added if desired) — currently unspecified, treat as all-rights reserved if absent.
