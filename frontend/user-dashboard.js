document.addEventListener('DOMContentLoaded', function() {
    console.log('User dashboard loaded');
    
    // Check authentication with detailed logging
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    
    console.log('Auth check on user dashboard:');
    console.log('- Token exists:', !!token);
    console.log('- User role:', userRole);
    console.log('- User name:', userName);
    
    if (!token) {
        console.log('No token found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    
    // Set user name in dashboard
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = userName || 'User';
    }
    
    // Fetch user data using direct URL to avoid config issues
    fetchUserData();
    
    async function fetchUserData() {
        try {
            console.log('Fetching user data with token');
            
            const response = await fetch('http://localhost:5000/api/user/waste-levels', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('API response status:', response.status);
            
            if (response.status === 401) {
                console.error('Authentication failed on API call');
                // Add a flag to prevent redirect loops
                if (!sessionStorage.getItem('redirected')) {
                    sessionStorage.setItem('redirected', 'true');
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userName');
                    window.location.href = 'login.html?session=expired';
                } else {
                    console.error('Detected redirect loop, staying on page');
                    document.getElementById('alert-container').innerHTML = `
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle"></i>
                            Authentication error. Please <a href="login.html">login again</a>.
                        </div>
                    `;
                }
                return;
            }
            
            // Clear redirect flag if API call succeeded
            sessionStorage.removeItem('redirected');
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('User data received successfully');
            
            // Update dashboard with data
            updateDashboard(data);
        } catch (error) {
            console.error('Error fetching user data:', error);
            document.getElementById('alert-container').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i>
                    Error loading dashboard data. Please try again later.
                </div>
            `;
        }
    }
    
    function updateDashboard(data) {
        // Implementation remains the same
        // This function should populate your dashboard with the received data
        console.log('Updating dashboard with received data');
        
        // Show empty state if no data is available
        if (!data || !data.binData) {
            console.log('No bin data available');
            return;
        }
        
        // Update bin levels
        if (data.binData) {
            // Organic waste bin
            const organicLevel = data.binData.organicLevel || 0;
            document.getElementById('organic-fill').style.height = `${organicLevel}%`;
            document.getElementById('organic-label').textContent = `${organicLevel}%`;
            
            // Non-recyclable waste bin
            const nonRecyclableLevel = data.binData.nonRecyclableLevel || 0;
            document.getElementById('nonrecyclable-fill').style.height = `${nonRecyclableLevel}%`;
            document.getElementById('nonrecyclable-label').textContent = `${nonRecyclableLevel}%`;
            
            // Hazardous waste bin
            const hazardousLevel = data.binData.hazardousLevel || 0;
            document.getElementById('hazardous-fill').style.height = `${hazardousLevel}%`;
            document.getElementById('hazardous-label').textContent = `${hazardousLevel}%`;
            
            // Show bin address if available
            if (data.binData.houseAddress) {
                document.getElementById('bin-address').textContent = data.binData.houseAddress;
            }
            
            // Show plastic alert if detected
            if (data.binData.plasticDetected) {
                document.getElementById('plastic-alert').style.display = 'flex';
            }
        }
        
        // Update rewards if available
        if (data.rewards) {
            document.getElementById('total-points').textContent = data.rewards.totalPoints || 0;
            document.getElementById('organic-points').textContent = data.rewards.organicPoints || 0;
            document.getElementById('nonrecyclable-points').textContent = data.rewards.nonRecyclablePoints || 0;
            document.getElementById('plastic-penalties').textContent = data.rewards.plasticPenalty || 0;
            
            // Update progress bars
            const maxPoints = 500; // Assuming max points is 500
            document.getElementById('organic-progress').style.width = `${Math.min(100, (data.rewards.organicPoints / maxPoints) * 100)}%`;
            document.getElementById('nonrecyclable-progress').style.width = `${Math.min(100, (data.rewards.nonRecyclablePoints / maxPoints) * 100)}%`;
            document.getElementById('plastic-progress').style.width = `${Math.min(100, (data.rewards.plasticPenalty / maxPoints) * 100)}%`;
        }
        
        // Update waste history table
        if (data.wasteHistory && data.wasteHistory.length) {
            const tableBody = document.getElementById('waste-history-body');
            tableBody.innerHTML = ''; // Clear any existing rows or skeleton loaders
            
            data.wasteHistory.forEach(item => {
                const date = new Date(item.collectionDate).toLocaleDateString();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${date}</td>
                    <td>${formatWasteType(item.type)}</td>
                    <td>${parseFloat(item.amount).toFixed(2)} kg</td>
                `;
                tableBody.appendChild(row);
            });
        }
    }
    
    function formatWasteType(type) {
        switch(type) {
            case 'organic': return 'Organic';
            case 'nonRecyclable': return 'Non-Recyclable';
            case 'hazardous': return 'Hazardous';
            default: return type;
        }
    }
});