const axios = require('axios');

async function checkSystemStatus() {
    const baseUrl = 'http://localhost:5000/api';
    let status = {
        auth: { working: false, error: null },
        waste: { working: false, error: null },
        authority: { working: false, error: null },
        rewards: { working: false, error: null }
    };

    try {
        // Test authentication
        console.log('Testing authentication...');
        const loginResponse = await axios.post(`${baseUrl}/auth/login`, {
            email: 'test@user.com',
            password: 'password123'
        });

        const token = loginResponse.data.token;
        status.auth.working = true;

        // Configure headers
        const config = {
            headers: { 'x-auth-token': token }
        };

        try {
            console.log('Testing waste management...');
            const wasteResponse = await axios.get(`${baseUrl}/waste/levels`, config);
            status.waste.working = wasteResponse.status === 200;
            console.log('Waste bin data:', wasteResponse.data);
        } catch (error) {
            status.waste.error = error.response?.data?.message || error.message;
            console.error('Waste management error:', error.response?.data || error.message);
        }

        try {
            console.log('Testing rewards system...');
            const rewardsResponse = await axios.get(`${baseUrl}/rewards/points`, config);
            status.rewards.working = rewardsResponse.status === 200;
            console.log('Rewards data:', rewardsResponse.data);
        } catch (error) {
            status.rewards.error = error.response?.data?.message || error.message;
            console.error('Rewards error:', error.response?.data || error.message);
        }

        try {
            console.log('Testing authority endpoints...');
            // First login as authority
            const authorityLogin = await axios.post(`${baseUrl}/auth/login`, {
                email: 'test@authority.com',
                password: 'password123'
            });

            const authorityConfig = {
                headers: { 'x-auth-token': authorityLogin.data.token }
            };

            const authorityResponse = await axios.get(`${baseUrl}/authority/stats`, authorityConfig);
            status.authority.working = authorityResponse.status === 200;
            console.log('Authority stats:', authorityResponse.data);
        } catch (error) {
            status.authority.error = error.response?.data?.message || error.message;
            console.error('Authority endpoint error:', error.response?.data || error.message);
        }

    } catch (error) {
        status.auth.error = error.response?.data?.message || error.message;
        console.error('Authentication error:', error.response?.data || error.message);
    }

    console.log('\nSystem Status Check Results:');
    console.table(status);
    return status;
}

// Run the check if called directly
if (require.main === module) {
    checkSystemStatus();
}

module.exports = { checkSystemStatus };