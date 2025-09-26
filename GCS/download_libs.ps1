# Create necessary directories
New-Item -ItemType Directory -Force -Path "lib\css" | Out-Null
New-Item -ItemType Directory -Force -Path "lib\js" | Out-Null
New-Item -ItemType Directory -Force -Path "lib\css\images" | Out-Null
New-Item -ItemType Directory -Force -Path "lib\webfonts" | Out-Null

# Download Chart.js
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js" -OutFile "lib\js\chart.js"

# Download Leaflet files
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js" -OutFile "lib\js\leaflet.js"
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" -OutFile "lib\css\leaflet.css"

# Download Leaflet images
$leafletImages = @("marker-shadow.png", "marker-icon.png", "marker-icon-2x.png", "layers.png", "layers-2x.png")
foreach ($image in $leafletImages) {
    Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/$image" -OutFile "lib\css\images\$image"
}

# Download Font Awesome CSS
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" -OutFile "lib\css\all.min.css"
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/fontawesome.min.css" -OutFile "lib\css\fontawesome.min.css"
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/solid.min.css" -OutFile "lib\css\solid.min.css"

# Download Font Awesome webfonts
$webfonts = @(
    "fa-brands-400.woff2",
    "fa-regular-400.woff2",
    "fa-solid-900.woff2",
    "fa-v4compatibility.woff2"
)
foreach ($font in $webfonts) {
    Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/webfonts/$font" -OutFile "lib\webfonts\$font"
}

# Download IonIcons core files
$ioniconsFiles = @{
    "ionicons.esm.js" = "https://cdn.jsdelivr.net/npm/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"
    "ionicons.js" = "https://cdn.jsdelivr.net/npm/ionicons@7.1.0/dist/ionicons/ionicons.js"
    "ionicons.json" = "https://cdn.jsdelivr.net/npm/ionicons@7.1.0/dist/ionicons/ionicons.json"
    "p-a275dd6c.js" = "https://cdn.jsdelivr.net/npm/ionicons@7.1.0/dist/ionicons/p-a275dd6c.js"
    "p-a2f12f33.js" = "https://cdn.jsdelivr.net/npm/ionicons@7.1.0/dist/ionicons/p-a2f12f33.js"
    "p-d24a645c.js" = "https://cdn.jsdelivr.net/npm/ionicons@7.1.0/dist/ionicons/p-d24a645c.js"
}

foreach ($file in $ioniconsFiles.GetEnumerator()) {
    try {
        Invoke-WebRequest -Uri $file.Value -OutFile "lib\js\ionicons\$($file.Name)"
    } catch {
        Write-Warning "Failed to download $($file.Name): $_"
    }
}

Write-Host "All libraries have been downloaded successfully!" 