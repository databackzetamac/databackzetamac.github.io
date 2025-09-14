# DataBack Zetamac (Pure JS)

Modern glassmorphic arithmetic speed drill (no build step, plain HTML/CSS/JS).

## Features
* Operation toggles: + − × ÷
* Per–operation ranges (defaults):
	* Addition: (2–100) + (2–100)
	* Subtraction: same pairs reversed (no negatives)
	* Multiplication: (2–12) × (2–100)
	* Division: reversed multiplication (always integer)
* Durations: 30s • 1m • 2m • 5m
* Auto-advance on correct answer; Enter to force submit
* Live metrics: score, streak, accuracy, time remaining
* Post-session summary: score, answered, accuracy, max streak, duration
* Session history (localStorage, last 30)
* Dark / light theme toggle (persisted)

## Usage
Just open `index.html` in a modern browser. No bundlers, no dependencies.

## Keyboard
* Digits: type answer
* Enter: submit current answer
* Space: refocus answer field during a session
* 🌗: toggle theme

## Roadmap (next)
1. Optional sound / final countdown pulse
2. Reduced-motion adjustments
3. Inline accuracy sparkline
4. Export / import session history (JSON)
5. PWA manifest & offline caching

## Contributing
Open issues / PRs. Keep it dependency‑free for now.

## License
TBD (add LICENSE file) — treat as all rights reserved until license added.
