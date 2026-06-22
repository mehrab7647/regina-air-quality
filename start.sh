#!/bin/bash
(cd backend && source venv/bin/activate && uvicorn main:app --reload) &
(cd frontend && npm run dev) &
wait