# Change to the frontend directory
Set-Location -Path "$PSScriptRoot\rideshare-app\frontend"

# Output the current directory for verification
Write-Host "Current directory: $((Get-Location).Path)"

# Start the React application
Write-Host "Starting React application..."
npm start 