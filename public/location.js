let map;
let visitorCount = localStorage.getItem('visitorCount') || 0;
let backgroundMusic = document.getElementById('backgroundMusic');
let neighborhood = '';

// Reset the page state when loaded
window.onload = function() {
    resetPageState();
    // Set up audio event listeners
    if (backgroundMusic) {
        backgroundMusic.addEventListener('ended', function() {
            this.currentTime = 0;
            this.play();
        });
    }
};

// Handle browser back button
window.onpopstate = function(event) {
    resetPageState();
};

// Prevent browser back button
history.pushState(null, null, location.href);
window.onpopstate = function() {
    history.go(1);
};

function resetPageState() {
    // Stop and reset audio
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
    
    // Clear any existing map
    if (map) {
        map.remove();
        map = null;
    }
    // Reset displays
    document.getElementById('map').style.display = 'none';
    document.querySelector('.overlay').style.display = 'none';
    document.querySelector('.content').style.display = 'none';
    document.querySelector('.counter').style.display = 'none';
    document.getElementById('locationPrompt').style.display = 'block';
}

function getNeighborhoodName(lat, lng) {
    return fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`)
        .then(response => response.json())
        .then(data => {
            // Get both city and neighborhood/suburb
            const address = data.address;
            const city = address.city || address.town || address.village || 'Unknown City';
            const neighborhood = address.neighbourhood || address.suburb || 'Unknown Area';
            return `${city}, ${neighborhood}`;
        })
        .catch(error => {
            console.error('Error getting location:', error);
            return 'Unknown Location';
        });
}

function initMap(lat, lng) {
    // Initialize the map
    map = L.map('map', {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false
    });

    // Add the OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add a marker at the user's location
    L.marker([lat, lng]).addTo(map);

    // Force a resize event to ensure the map fills the container
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}

function showContent() {
    document.getElementById('map').style.display = 'block';
    document.querySelector('.overlay').style.display = 'block';
    document.querySelector('.content').style.display = 'block';
    document.querySelector('.counter').style.display = 'block';
    
    // Start playing the background music
    if (backgroundMusic) {
        backgroundMusic.volume = 1.0;
        let playPromise = backgroundMusic.play();
        
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                // Autoplay started successfully
                console.log('Audio playback started');
            })
            .catch(error => {
                console.log('Audio playback failed:', error);
                // Try to play again after user interaction
                document.addEventListener('click', function playAudio() {
                    backgroundMusic.play();
                    document.removeEventListener('click', playAudio);
                }, { once: true });
            });
        }
    }
    
    // Ensure map is properly sized after showing
    if (map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
}

function requestLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                console.log('Location obtained:', position.coords);
                document.getElementById('locationPrompt').style.display = 'none';
                
                // Get neighborhood name
                neighborhood = await getNeighborhoodName(position.coords.latitude, position.coords.longitude);
                
                initMap(position.coords.latitude, position.coords.longitude);
                showContent();
                incrementCounter();
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Error getting location: ' + error.message);
                neighborhood = 'Unknown Location';
                initMap(0, 0);  // Fallback location
                showContent();
            }
        );
    } else {
        alert('Geolocation is not supported by your browser');
        neighborhood = 'Unknown Location';
        initMap(0, 0); // Fallback location
        showContent();
    }
}

function incrementCounter() {
    visitorCount = parseInt(visitorCount) + 1;
    localStorage.setItem('visitorCount', visitorCount);
    const locationText = `Across ${neighborhood}: ${visitorCount}`;
    document.getElementById('visitorCount').innerHTML = locationText.replace(
        neighborhood,
        `<span class="rainbow-zoom">${neighborhood}</span>`
    );
} 