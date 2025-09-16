document.addEventListener('DOMContentLoaded', function() {
    console.log('Signup page loaded');
    
    const signupForm = document.getElementById('signup-form');
    const alertContainer = document.getElementById('alert-container');
    
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Signup form submitted');
        
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        submitBtn.disabled = true;
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;
        
        try {
            console.log('Sending signup data:', { name, email, role });
            
            const response = await fetch(`${apiBaseUrl}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password, role })
            });
            
            const data = await response.json();
            console.log('Signup response:', response.status);
            
            if (response.ok) {
                // Show success message
                showAlert('success', 'Account created successfully! Redirecting...');
                
                // Store token and user info if provided
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userRole', data.role);
                    localStorage.setItem('userName', data.name);
                    
                    console.log('Signup successful with direct login');
                    
                    // Redirect to dashboard after delay
                    setTimeout(() => {
                        redirectToDashboard(data.role);
                    }, 1500);
                } else {
                    // If no token, redirect to login page
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);
                }
            } else {
                // Show error message
                showAlert('danger', data.message || 'Error creating account.');
                // Reset button
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Signup error:', error);
            showAlert('danger', 'An error occurred. Please try again later.');
            // Reset button
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
    
    function redirectToDashboard(role) {
        console.log(`Redirecting to dashboard for role: ${role}`);
        if (role === 'authority') {
            window.location.href = 'authority-dashboard.html';
        } else {
            window.location.href = 'user-dashboard.html';
        }
    }
});

document.getElementById('authorityRadio').addEventListener('change', function() {
    document.querySelector('.authority-field').style.display = 
        this.checked ? 'block' : 'none';
});

document.getElementById('userRadio').addEventListener('change', function() {
    document.querySelector('.authority-field').style.display = 'none';
});

document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const isAuthority = document.getElementById('authorityRadio').checked;
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const department = isAuthority ? document.getElementById('department').value : null;

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                password,
                role: isAuthority ? 'authority' : 'user', // Changed userType to role
                department
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Registration successful! Please login.');
            window.location.href = 'login.html';
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Registration failed. Please try again.');
    }
});