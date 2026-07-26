# Regina Air Quality Tracker

A live dashboard showing air quality and wind conditions for Regina, Saskatchewan. Built with a FastAPI backend pulling from Environment Canada's public AQHI feed and an Open-Meteo wind API, and a React frontend with an animated wind particle map.

![screenshot](frontend/public/screenshot.png)

**Live site:** https://agent-6a6668d63416d238da5ae347--yqrair.netlify.app/
**API:** https://your-railway-url-here

---

## Background

Environment Canada publishes Air Quality Health Index (AQHI) data publicly, but it's raw JSON buried in a government API — not something a regular person would find or know how to read. This project pulls that data for Regina specifically, pairs it with live wind conditions, and presents it in a way that's actually useful: a plain-English health advisory, a 7-day history chart, and an animated map showing which way the wind is blowing right now.

I built this to practice working with real open data sources and to get comfortable building a full Python + React stack from scratch.

---

## What it does

- Fetches the current AQHI reading for Regina from Environment Canada and translates the number into a plain-English health advisory (good / moderate / high / very high)
- Displays a 7-day hourly history chart of AQHI readings
- Shows an animated wind map of Regina — gold particle streaks flowing in the live wind direction, speed-scaled to the actual wind data
- Light and dark theme toggle, including a matching basemap swap (dark CartoDB tiles in dark mode, light tiles in light mode)
- Logs each AQHI reading to a local SQLite database so the history chart fills in over time, beyond the short window Environment Canada's feed retains

---

## Tech stack

| Layer | Tech |
|---|---|
| Backend | Python, FastAPI, httpx |
| Database | SQLite (local history logging) |
| Frontend | React, Vite |
| Charts | Recharts |
| Map | Leaflet, react-leaflet |
| Map tiles | CartoDB (dark + light) |
| AQHI data | Environment Canada open API |
| Wind data | Open-Meteo (free, no key required) |

---

## Project structure
