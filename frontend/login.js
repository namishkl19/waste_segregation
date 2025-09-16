document.addEventListener('DOMContentLoaded', function() {
    console.log('Login page loaded');
    
    const loginForm = document.getElementById('login-form');
    const alertContainer = document.getElementById('alert-container');
    
    // Check URL parameters for session expired message
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('session') === 'expired') {
        showAlert('warning', 'Your session has expired. Please log in again.');
    }
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Login form submitted');
        
        // Show loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitBtn.disabled = true;
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            // IMPORTANT: Force clear any existing tokens before login
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userName');
            
            // Use hard-coded URL to avoid any config issues
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            console.log('Login response status:', response.status);
            
            if (response.ok && data.token) {
                console.log('Login successful, storing token and user data');
                
                // Store authentication data
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', data.role || 'user');
                localStorage.setItem('userName', data.name || 'User');
                
                // Verify storage succeeded
                const storedToken = localStorage.getItem('token');
                console.log('Token stored successfully:', !!storedToken);
                
                // Show success message
                showAlert('success', 'Login successful! Redirecting to dashboard...');
                
                // Redirect after a short delay
                setTimeout(() => {
                    const role = localStorage.getItem('userRole');
                    console.log('Redirecting to dashboard for role:', role);
                    
                    // Use direct if-else to avoid any issues
                    if (role === 'authority') {
                        window.location.href = 'authority-dashboard.html';
                    } else {
                        window.location.href = 'user-dashboard.html';
                    }
                }, 1000);
            } else {
                console.error('Login failed:', data.message);
                showAlert('danger', data.message || 'Login failed. Please check your credentials.');
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('danger', 'An error occurred. Please try again later.');
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });
    
    function showAlert(type, message) {
        alertContainer.innerHTML = `
            <div class="alert alert-${type}">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                ${message}
            </div>
        `;
    }
});