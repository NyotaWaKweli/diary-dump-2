#!/bin/bash
# Diary Dump - Deployment Helper Script
# Run this after setting up Supabase and Vercel

echo "=== Diary Dump Deployment Helper ==="
echo ""
echo "Step 1: Install dependencies..."
npm install

echo ""
echo "Step 2: Build the project..."
npm run build

echo ""
echo "Step 3: If build succeeds, deploy to Vercel:"
echo "   vercel --prod"
echo ""
echo "Or push to GitHub and connect Vercel to the repo."
