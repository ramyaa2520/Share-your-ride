@echo off
echo Changing to the frontend directory...
cd %~dp0\rideshare-app\frontend

echo Current directory: %CD%

echo Starting React application...
npm start 