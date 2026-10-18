#!/usr/bin/env bash
# Build script for Render (or any Linux host).
# Render "Build Command": ./build.sh   (Root Directory: backend)
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
# Creates the admin account (ADMIN_EMAIL / ADMIN_PASSWORD), default
# categories and demo data. Safe to run on every deploy.
python manage.py seed_demo
