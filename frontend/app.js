// Check authentication
if (!localStorage.getItem('userToken')) {
    window.location.href = 'login.html';
}

const token = localStorage.getItem('userToken');
if (!token) {
    window.location.href = 'login.html';
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    fetchWasteData();
});

// Logout handler
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('userToken');
    window.location.href = 'login.html';
});

async function fetchWasteData() {
    try {
        const token = localStorage.getItem('userToken');
        const response = await fetch('http://localhost:5000/api/waste/stats', {
            headers: {
                'x-auth-token': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch waste data');
        }

        const data = await response.json();
        updateDashboard(data);
    } catch (error) {
        console.error('Error fetching waste data:', error);
    }
}

function updateDashboard(data) {
    const elements = {
        organic: document.getElementById('organicWaste'),
        nonRecyclable: document.getElementById('nonRecyclableWaste'),
        hazardous: document.getElementById('hazardousWaste')
    };

    // Update metrics if elements exist
    Object.entries(elements).forEach(([key, element]) => {
        if (element) {
            element.textContent = `${data[key] || 0} kg`;
        }
    });

    updateChart(data);
}

function updateChart(data) {
    const canvas = document.getElementById('wasteChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    if (window.wasteChart instanceof Chart) {
        window.wasteChart.destroy();
    }

    window.wasteChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Organic', 'Non-Recyclable', 'Hazardous'],
            datasets: [{
                label: 'Waste Quantity (kg)',
                data: [data.organic || 0, data.nonRecyclable || 0, data.hazardous || 0],
                backgroundColor: [
                    'rgba(75, 192, 92, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 99, 132, 0.5)'
                ],
                borderColor: [
                    'rgba(75, 192, 92, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Form submission handler
const form = document.getElementById('addWasteForm');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            type: document.getElementById('wasteType')?.value,
            quantity: parseFloat(document.getElementById('wasteQuantity')?.value || '0'),
            location: document.getElementById('wasteLocation')?.value?.trim()
        };

        if (!formData.type || !formData.location || isNaN(formData.quantity)) {
            alert('Please fill all fields correctly');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/waste/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('userToken')
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to add waste entry');
            }

            alert('Waste entry added successfully');
            form.reset();
            fetchWasteData();
        } catch (error) {
            console.error('Error adding waste:', error);
            alert(error.message);
        }
    });
}
