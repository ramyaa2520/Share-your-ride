# Create placeholder SVG files
$rideBookingSvg = @"
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#f5f5f5"/>
  <text x="200" y="150" font-family="Arial" font-size="20" text-anchor="middle">Ride Booking Illustration</text>
</svg>
"@

$driverEarningsSvg = @"
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#f5f5f5"/>
  <text x="200" y="150" font-family="Arial" font-size="20" text-anchor="middle">Driver Earnings Illustration</text>
</svg>
"@

# Save SVG files
$rideBookingSvg | Out-File -FilePath "ride-booking.svg" -Encoding UTF8
$driverEarningsSvg | Out-File -FilePath "driver-earnings.svg" -Encoding UTF8

# URLs for car images (placeholder images from placeholder.com)
$economyCarUrl = "https://via.placeholder.com/400x250/4CAF50/FFFFFF?text=Economy+Car"
$comfortCarUrl = "https://via.placeholder.com/400x250/2196F3/FFFFFF?text=Comfort+Car"
$premiumCarUrl = "https://via.placeholder.com/400x250/FF9800/FFFFFF?text=Premium+Car" 
$suvCarUrl = "https://via.placeholder.com/400x250/9C27B0/FFFFFF?text=SUV+Car"

# Download car images
Invoke-WebRequest -Uri $economyCarUrl -OutFile "economy-car.jpg"
Invoke-WebRequest -Uri $comfortCarUrl -OutFile "comfort-car.jpg"
Invoke-WebRequest -Uri $premiumCarUrl -OutFile "premium-car.jpg" 
Invoke-WebRequest -Uri $suvCarUrl -OutFile "suv-car.jpg"

# URLs for logo images
$faviconUrl = "https://via.placeholder.com/64/3f51b5/FFFFFF?text=R"
$logo192Url = "https://via.placeholder.com/192/3f51b5/FFFFFF?text=R" 
$logo512Url = "https://via.placeholder.com/512/3f51b5/FFFFFF?text=R"

# Download logo images
Invoke-WebRequest -Uri $faviconUrl -OutFile "favicon.ico"
Invoke-WebRequest -Uri $logo192Url -OutFile "logo192.png"
Invoke-WebRequest -Uri $logo512Url -OutFile "logo512.png"

Write-Host "All placeholder images have been created/downloaded successfully." 