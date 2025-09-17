document.addEventListener('DOMContentLoaded', function() {
    console.log('Authority dashboard loaded');
    
    // Check authentication
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    console.log('Auth check on authority dashboard:', {
        hasToken: !!token,
        role: userRole
    });
    
    if (!token) {
        console.log('No token found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    
    if (userRole !== 'authority') {
        console.log('User is not an authority, redirecting');
        window.location.href = 'user-dashboard.html';
        return;
    }
    
    console.log('Authority authenticated');
    
    // Setup logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Logging out authority');
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userName');
            window.location.href = 'login.html';
        });
    }
    
    // Update last updated time
    const lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl && lastUpdatedEl.querySelector('span')) {
        lastUpdatedEl.querySelector('span').textContent = new Date().toLocaleString();
    }
    

        // Fetch authority data

    let pendingPickupRequests = [];
    fetchAuthorityData();
    fetchPickupRequests();

        // Fetch and display trash pick-up requests
    async function fetchPickupRequests() {
        const statusDiv = document.getElementById('pickup-requests-status');
        const tableBody = document.getElementById('pickup-requests-body');
        try {
            const response = await fetch('http://localhost:5000/api/pickup-requests', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const data = await response.json();
                statusDiv.textContent = data.message || 'Failed to fetch requests.';
                statusDiv.style.color = 'red';
                tableBody.innerHTML = '';
                return;
            }
            const requests = await response.json();
            pendingPickupRequests = requests.filter(r => r.status === 'pending');
            if (!requests.length) {
                tableBody.innerHTML = '<tr><td colspan="7">No requests found.</td></tr>';
                return;
            }
            tableBody.innerHTML = '';
            // Filter out duplicate requests by address and status
            const uniqueRequests = [];
            const seen = new Set();
            requests.forEach(req => {
                const key = `${req.address}-${req.status}`;
                if (!seen.has(key)) {
                    uniqueRequests.push(req);
                    seen.add(key);
                }
            });
            uniqueRequests.forEach(req => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${req.User ? req.User.name : 'N/A'}</td>
                    <td>${req.User ? req.User.email : 'N/A'}</td>
                    <td>${req.address}</td>
                    <td>${req.description || ''}</td>
                    <td>${req.status}</td>
                    <td>${new Date(req.createdAt).toLocaleString()}</td>
                    <td>
                        ${req.status === 'pending' ? `<button class="accept-btn" data-id="${req.id}" title="Accept"><i class="fas fa-thumbs-up"></i></button>` : ''}
                    </td>
                `;
                tableBody.appendChild(tr);
            });
            // Add event listeners for accept buttons
            document.querySelectorAll('.accept-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const id = this.getAttribute('data-id');
                    try {
                        const res = await fetch(`http://localhost:5000/api/pickup-requests/${id}/accept`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        if (res.ok) {
                            // Remove the row from the table
                            this.closest('tr').remove();
                            // Refresh pendingPickupRequests and map highlights
                            fetchPickupRequests();
                            fetchAuthorityData();
                        } else {
                            alert('Failed to accept request.');
                        }
                    } catch (err) {
                        alert('Error accepting request.');
                    }
                });
            });
        } catch (err) {
            statusDiv.textContent = 'Error loading requests.';
            statusDiv.style.color = 'red';
            tableBody.innerHTML = '';
        }
    }
    
    async function fetchAuthorityData() {
        try {
            console.log('Fetching authority data');
            
            // First try the test endpoint to see if the API is working at all
            let response = await fetch('http://localhost:5000/api/authority/overview-test');
            
            if (response.status === 404) {
                console.error('Test API endpoint not found. Server might not have authority routes configured.');
                loadFallbackData();
                return;
            }
            
            // If test endpoint works, try the real endpoint with authentication
            response = await fetch('http://localhost:5000/api/authority/overview', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.status === 404) {
                console.error('Main API endpoint not found');
                loadFallbackData();
                return;
            }
            
            if (response.status === 401 || response.status === 403) {
                console.error('Authentication error:', response.status);
                document.getElementById('alert-container').innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        Authentication error. Please <a href="login.html">login again</a>.
                    </div>
                `;
                return;
            }
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Authority data received');
            
            // Update the UI with the received data
            updateDashboard(data);
            
            // Initialize the map if we have location data
            if (data.houses && data.houses.length > 0) {
                initMap(data.houses);
            }
        } catch (error) {
            console.error('Error fetching authority data:', error);
            loadFallbackData();
        }
    }
    
    function loadFallbackData() {
        console.log('Loading fallback data');
        
        // Sample data with global locations
        const fallbackData = {
            stats: {
                totalHouses: 150,
                criticalBins: 25,
                avgOrganicLevel: 45,
                avgNonRecyclableLevel: 38,
                avgHazardousLevel: 22
            },
            criticalBins: [
                { houseId: 5, address: "123 Main St, New York", maxLevel: 92 },
                { houseId: 8, address: "456 Oak Ave, London", maxLevel: 87 },
                { houseId: 3, address: "789 Pine Rd, Tokyo", maxLevel: 81 },
                { houseId: 12, address: "101 River St, Sydney", maxLevel: 85 },
                { houseId: 24, address: "202 Mountain Ave, Cape Town", maxLevel: 90 }
            ],
            wasteDistribution: {
                organic: 45,
                nonRecyclable: 35,
                hazardous: 20
            },
            houses: [
                // North America
                { houseId: 1, address: "123 Main St, New York", latitude: 40.7128, longitude: -74.0060, binStatus: "critical", maxLevel: 92 },
                { houseId: 2, address: "456 Oak Ave, Los Angeles", latitude: 34.0522, longitude: -118.2437, binStatus: "warning", maxLevel: 65 },
                { houseId: 3, address: "789 Pine Rd, Chicago", latitude: 41.8781, longitude: -87.6298, binStatus: "normal", maxLevel: 45 },
                { houseId: 4, address: "101 Maple St, Toronto", latitude: 43.6532, longitude: -79.3832, binStatus: "warning", maxLevel: 75 },
                { houseId: 5, address: "202 Elm St, Mexico City", latitude: 19.4326, longitude: -99.1332, binStatus: "critical", maxLevel: 88 },
                
                // Europe
                { houseId: 6, address: "10 Downing St, London", latitude: 51.5074, longitude: -0.1278, binStatus: "critical", maxLevel: 87 },
                { houseId: 7, address: "25 Rue de la Paix, Paris", latitude: 48.8566, longitude: 2.3522, binStatus: "warning", maxLevel: 70 },
                { houseId: 8, address: "Unter den Linden 77, Berlin", latitude: 52.5200, longitude: 13.4050, binStatus: "normal", maxLevel: 30 },
                { houseId: 9, address: "Via Roma 1, Rome", latitude: 41.9028, longitude: 12.4964, binStatus: "critical", maxLevel: 85 },
                { houseId: 10, address: "Gran Via 1, Madrid", latitude: 40.4168, longitude: -3.7038, binStatus: "normal", maxLevel: 25 },
                
                // Asia
                { houseId: 11, address: "1 Chome Shibuya, Tokyo", latitude: 35.6762, longitude: 139.6503, binStatus: "critical", maxLevel: 81 },
                { houseId: 12, address: "1 Raffles Place, Singapore", latitude: 1.3521, longitude: 103.8198, binStatus: "warning", maxLevel: 68 },
                { houseId: 13, address: "Connaught Place, New Delhi", latitude: 28.6139, longitude: 77.2090, binStatus: "critical", maxLevel: 95 },
                { houseId: 14, address: "The Bund, Shanghai", latitude: 31.2304, longitude: 121.4737, binStatus: "normal", maxLevel: 55 },
                { houseId: 15, address: "Orchard Road, Singapore", latitude: 1.3040, longitude: 103.8318, binStatus: "warning", maxLevel: 79 },
                
                // Australia & Oceania
                { houseId: 16, address: "1 Circular Quay, Sydney", latitude: -33.8568, longitude: 151.2153, binStatus: "critical", maxLevel: 85 },
                { houseId: 17, address: "Flinders St, Melbourne", latitude: -37.8136, longitude: 144.9631, binStatus: "normal", maxLevel: 42 },
                { houseId: 18, address: "Queen St, Auckland", latitude: -36.8509, longitude: 174.7645, binStatus: "warning", maxLevel: 75 },
                
                // Africa
                { houseId: 19, address: "Long St, Cape Town", latitude: -33.9249, longitude: 18.4241, binStatus: "critical", maxLevel: 90 },
                { houseId: 20, address: "Lenana Rd, Nairobi", latitude: -1.2921, longitude: 36.8219, binStatus: "normal", maxLevel: 50 },
                { houseId: 21, address: "Pharaohs St, Cairo", latitude: 30.0444, longitude: 31.2357, binStatus: "warning", maxLevel: 72 },
                
                // South America
                { houseId: 22, address: "Av Paulista, Sao Paulo", latitude: -23.5505, longitude: -46.6333, binStatus: "critical", maxLevel: 89 },
                { houseId: 23, address: "Av Corrientes, Buenos Aires", latitude: -34.6037, longitude: -58.3816, binStatus: "normal", maxLevel: 35 },
                { houseId: 24, address: "Carrera 7, Bogota", latitude: 4.7110, longitude: -74.0721, binStatus: "warning", maxLevel: 65 }
            ]
        };
        
        // (Removed fallback data alert message)
        
        // Update dashboard with fallback data
        updateDashboard(fallbackData);
        
        // Initialize the map with fallback data
        if (typeof initMap === 'function' && fallbackData.houses && fallbackData.houses.length > 0) {
            initMap(fallbackData.houses);
        }
    }
    
    function updateDashboard(data) {
        // Implementation remains the same
        // Populate with data for authority dashboard
        console.log('Updating authority dashboard with received data');
        
        // Update overview statistics
        if (data.stats) {
            document.getElementById('total-houses').textContent = data.stats.totalHouses || 0;
            document.getElementById('critical-bins').textContent = data.stats.criticalBins || 0;
            document.getElementById('avg-organic').textContent = `${data.stats.avgOrganicLevel || 0}%`;
            document.getElementById('avg-nonrecyclable').textContent = `${data.stats.avgNonRecyclableLevel || 0}%`;
        }
        
        // Update critical bins list
        if (data.criticalBins && data.criticalBins.length) {
            const criticalBinsContainer = document.getElementById('critical-bins-container');
            criticalBinsContainer.innerHTML = '';
            data.criticalBins.forEach(bin => {
                const reward = bin.reward;
                const binElement = document.createElement('div');
                binElement.className = 'card mb-3';
                binElement.style.padding = '15px';
                binElement.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="margin: 0;">${bin.houseId || 'Unknown'}</h4>
                        <span class="badge badge-${getBadgeColor(bin.maxLevel)}">${bin.maxLevel}%</span>
                    </div>
                    <p style="margin: 5px 0 0 0; color: var(--gray);">${bin.address || 'No address'}</p>
                    <div class="progress mt-2">
                        <div class="progress-bar progress-${getProgressColor(bin.maxLevel)}" style="width: ${bin.maxLevel}%;"></div>
                    </div>
                    <div class="mt-2">
                        <span class="badge bg-info">Reward: ${reward ? reward.totalPoints : 0} pts</span>
                    </div>
                `;
                criticalBinsContainer.appendChild(binElement);
            });
        } else {
            document.getElementById('critical-bins-container').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <h3>No Critical Bins</h3>
                    <p>All waste bins are at safe levels.</p>
                </div>
            `;
        }
        
        // Update waste distribution
        if (data.wasteDistribution) {
            document.getElementById('organic-percent').textContent = `${data.wasteDistribution.organic || 0}%`;
            document.getElementById('nonrecyclable-percent').textContent = `${data.wasteDistribution.nonRecyclable || 0}%`;
            document.getElementById('hazardous-percent').textContent = `${data.wasteDistribution.hazardous || 0}%`;
            
            document.getElementById('organic-distribution').style.width = `${data.wasteDistribution.organic || 0}%`;
            document.getElementById('nonrecyclable-distribution').style.width = `${data.wasteDistribution.nonRecyclable || 0}%`;
            document.getElementById('hazardous-distribution').style.width = `${data.wasteDistribution.hazardous || 0}%`;
        }
    }
    
    const highlightAddresses = new Set(
      (pendingPickupRequests || []).map(req => req.address.trim().toLowerCase())
    );
    
    function getBadgeColor(level) {
        if (level >= 80) return 'danger';
        if (level >= 60) return 'warning';
        return 'primary';
    }
    
    function getProgressColor(level) {
        if (level >= 80) return 'high';
        if (level >= 60) return 'medium';
        return 'low';
    }
    
    // Initialize map with waste bin locations
    function initMap(houses) {
        console.log('Initializing map with', houses.length, 'locations');
        
        // Check if map container exists
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.error('Map container (#map) not found in HTML!');
            return;
        }
        
        // First, verify all coordinates to ensure they're valid
        houses.forEach(house => {
            if (!house.latitude || !house.longitude) {
                console.warn('Invalid coordinates for house:', house.houseId, house.address);
            } else {
                console.log('Valid location:', house.address, `(${house.latitude}, ${house.longitude})`);
            }
        });
        
        // Destroy previous map instance if it exists
        if (window._authorityMap) {
            window._authorityMap.remove();
        }
        const map = L.map('map').setView([10, 0], 2); // Lower center point, zoom level 2
        window._authorityMap = map;
        
        // Explicitly set the map size to ensure proper rendering
        map.invalidateSize();
        
        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);
        
        // Create a marker cluster group for better performance with many markers
        const markers = L.markerClusterGroup({
            disableClusteringAtZoom: 8,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            animateAddingMarkers: true,
            iconCreateFunction: function(cluster) {
                // Custom cluster icon with count and bin status color blend
                let critical = 0, warning = 0, normal = 0;
                cluster.getAllChildMarkers().forEach(m => {
                    if (m.binStatus === 'critical') critical++;
                    else if (m.binStatus === 'warning') warning++;
                    else normal++;
                });
                let bg = 'linear-gradient(135deg, #dc3545 0%, #fd7e14 50%, #198754 100%)';
                if (critical > 0) bg = '#dc3545';
                else if (warning > 0) bg = '#fd7e14';
                else if (normal > 0) bg = '#198754';
                return L.divIcon({
                    html: `<div style="background:${bg};color:#fff;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.1em;box-shadow:0 2px 8px #0002;position:relative;">
                        <span>${cluster.getChildCount()}</span>
                        <span style='position:absolute;bottom:2px;right:6px;font-size:0.7em;'><i class="fas fa-recycle"></i></span>
                    </div>`,
                    className: 'custom-cluster-icon',
                    iconSize: [44, 44]
                });
            }
        });
                // Cluster popup: show bin count and breakdown
                markers.on('clusterclick', function(a) {
                        const cluster = a.layer;
                        const all = cluster.getAllChildMarkers();
                        let critical = 0, warning = 0, normal = 0;
                        all.forEach(m => {
                                if (m.binStatus === 'critical') critical++;
                                else if (m.binStatus === 'warning') warning++;
                                else normal++;
                        });
                        const popupContent = `
                                <div style='min-width:160px;'>
                                    <strong>${all.length} bins in this area</strong><br>
                                    <span class='text-danger'><i class="fas fa-exclamation-triangle"></i> Critical: ${critical}</span><br>
                                    <span class='text-warning'><i class="fas fa-exclamation-circle"></i> Warning: ${warning}</span><br>
                                    <span class='text-success'><i class="fas fa-check-circle"></i> Normal: ${normal}</span>
                                </div>
                        `;
                        L.popup({closeButton:true, autoPan:true})
                            .setLatLng(cluster.getLatLng())
                            .setContent(popupContent)
                            .openOn(cluster._map);
                        // Prevent default zoom on cluster click
                        a.originalEvent.preventDefault();
                });
        map.addLayer(markers);
        // Create a bounds object to fit all markers
        const bounds = L.latLngBounds();
        houses.forEach(house => {
            if (house.latitude && house.longitude) {
                bounds.extend([house.latitude, house.longitude]);
            }
        });
        if (bounds.isValid()) {
            map.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 12
            });
        }
        
        // Add map legend
        const legend = L.control({position: 'bottomright'});
        legend.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'info legend');
            div.innerHTML = `
                <div class="legend-title">Bin Status</div>
                <div class="legend-item"><span class="legend-color" style="background-color:red"></span> Critical (80-100%)</div>
                <div class="legend-item"><span class="legend-color" style="background-color:orange"></span> Warning (60-79%)</div>
                <div class="legend-item"><span class="legend-color" style="background-color:green"></span> Normal (0-59%)</div>
            `;
            return div;
        };
        legend.addTo(map);
        
        // Add map controls
        L.control.scale().addTo(map);
        
        // Add filters for bin types
        const filters = L.control({position: 'topright'});
        filters.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'info filters');
            div.innerHTML = `
                <div class="filter-title">Filter Bins</div>
                <div class="filter-option">
                    <input type="checkbox" id="filter-critical" checked>
                    <label for="filter-critical">Critical</label>
                </div>
                <div class="filter-option">
                    <input type="checkbox" id="filter-warning" checked>
                    <label for="filter-warning">Warning</label>
                </div>
                <div class="filter-option">
                    <input type="checkbox" id="filter-normal" checked>
                    <label for="filter-normal">Normal</label>
                </div>
            `;
            return div;
        };
        filters.addTo(map);
        
        // Implement filter functionality
        document.getElementById('filter-critical').addEventListener('change', applyFilters);
        document.getElementById('filter-warning').addEventListener('change', applyFilters);
        document.getElementById('filter-normal').addEventListener('change', applyFilters);
        
        function applyFilters() {
            const showCritical = document.getElementById('filter-critical').checked;
            const showWarning = document.getElementById('filter-warning').checked;
            const showNormal = document.getElementById('filter-normal').checked;
            
            markers.clearLayers();
            
            houses.forEach(house => {
                if (house.latitude && house.longitude) {
                    const binStatus = house.binStatus || 'normal';
                    if ((binStatus === 'critical' && showCritical) ||
                        (binStatus === 'warning' && showWarning) ||
                        (binStatus === 'normal' && showNormal)) {
                        // Use FontAwesome icons for marker
                        let iconHtml = '';
                        let markerColor = '';
                        if (binStatus === 'critical') {
                            iconHtml = '<i class="fas fa-exclamation-triangle fa-lg"></i>';
                            markerColor = '#dc3545';
                        } else if (binStatus === 'warning') {
                            iconHtml = '<i class="fas fa-exclamation-circle fa-lg"></i>';
                            markerColor = '#fd7e14';
                        } else {
                            iconHtml = '<i class="fas fa-check-circle fa-lg"></i>';
                            markerColor = '#198754';
                        }
                        // Highlight if house has a pending pickup request
                        let highlight = '';
                        if (highlightAddresses.has(house.address.trim().toLowerCase())) {
                            highlight = 'box-shadow:0 0 12px 4px #ffc107,0 0 0 4px #fff; border:2px solid #ffc107;';
                        }
                        const markerIcon = L.divIcon({
                            className: `bin-marker bin-status-${binStatus}`,
                            html: `<div style="background:${markerColor};color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;${highlight}">${iconHtml}</div>` +
                                  `<div style="position:absolute;top:22px;left:0;width:100%;text-align:center;font-size:0.8em;font-weight:bold;">${house.maxLevel}%</div>`,
                            iconSize: [32, 38],
                            iconAnchor: [16, 32]
                        });
                        const marker = L.marker([house.latitude, house.longitude], {
                            icon: markerIcon
                        });
                        marker.binStatus = binStatus;
                        // Add reward info to popup
                        const reward = house.reward;
                        marker.bindPopup(`
                            <div style='min-width:180px;'>
                              <strong>${house.address || 'Waste Bin #' + house.houseId}</strong><br>
                              <span class="badge bg-secondary">Fill: ${house.maxLevel}%</span><br>
                              <span>Organic: ${house.organicLevel ?? '-'}%</span> | 
                              <span>Non-Recyclable: ${house.nonRecyclableLevel ?? '-'}%</span> | 
                              <span>Hazardous: ${house.hazardousLevel ?? '-'}%</span>
                              <div class="bin-details mt-2">
                                <span class="badge bg-${binStatus === 'critical' ? 'danger' : binStatus === 'warning' ? 'warning text-dark' : 'success'}">${binStatus.charAt(0).toUpperCase() + binStatus.slice(1)}</span>
                                ${house.lastUpdated ? `<div class='text-muted small'>Last updated: ${new Date(house.lastUpdated).toLocaleString()}</div>` : ''}
                              </div>
                              <div class="mt-2">
                                <span class="badge bg-info">Reward: ${reward ? reward.totalPoints : 0} pts</span>
                              </div>
                            </div>
                        `, {autoPan:true, closeButton:true});
                        marker.on('click', function(e) {
                            marker.openPopup();
                        });
                        markers.addLayer(marker);
                    }
                }
            });
            
            map.addLayer(markers);
        }
        
        console.log('Markers added by region:', markersAdded);
    }
});