const request = require('supertest');
const app = require('../server');
const { sequelize, User, WasteBin, HouseLocation, Reward } = require('../models');

let userToken;
let authorityToken;

beforeAll(async () => {
    // Reset database
    await sequelize.sync({ force: true });

    // Create test users
    const userResponse = await request(app)
        .post('/api/auth/register')
        .send({
            name: 'Test User',
            email: 'test@user.com',
            password: 'password123',
            role: 'user'
        });

    const authorityResponse = await request(app)
        .post('/api/auth/register')
        .send({
            name: 'Test Authority',
            email: 'test@authority.com',
            password: 'password123',
            role: 'authority'
        });

    userToken = userResponse.body.token;
    authorityToken = authorityResponse.body.token;
});

describe('Authentication Endpoints', () => {
    test('Login with valid credentials', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@user.com',
                password: 'password123'
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
    });

    test('Login with invalid credentials', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@user.com',
                password: 'wrongpassword'
            });

        expect(response.status).toBe(401);
    });
});

describe('Waste Management Endpoints', () => {
    test('Add waste bin data', async () => {
        const response = await request(app)
            .post('/api/waste/add')
            .set('x-auth-token', userToken)
            .send({
                houseId: 'House-1',
                organicLevel: 75,
                nonRecyclableLevel: 45,
                hazardousLevel: 30
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
    });

    test('Get waste levels', async () => {
        const response = await request(app)
            .get('/api/waste/levels')
            .set('x-auth-token', userToken);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('organicLevel');
        expect(response.body).toHaveProperty('nonRecyclableLevel');
        expect(response.body).toHaveProperty('hazardousLevel');
    });
});

describe('Authority Management Endpoints', () => {
    beforeEach(async () => {
        // Add test houses and waste bins
        for (let i = 1; i <= 10; i++) {
            await HouseLocation.create({
                houseId: `House-${i}`,
                latitude: 40 + Math.random(),
                longitude: -74 + Math.random(),
                authorityId: 2
            });

            await WasteBin.create({
                houseId: `House-${i}`,
                organicLevel: Math.random() * 100,
                nonRecyclableLevel: Math.random() * 100,
                hazardousLevel: Math.random() * 100,
                userId: 2
            });
        }
    });

    test('Get authority stats', async () => {
        const response = await request(app)
            .get('/api/authority/stats')
            .set('x-auth-token', authorityToken);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('authorityFill');
        expect(response.body).toHaveProperty('isAlertNeeded');
        expect(response.body).toHaveProperty('housesReporting');
        expect(response.body).toHaveProperty('collectionPoint');
    });
});

describe('Rewards System', () => {
    test('Calculate and get rewards', async () => {
        const response = await request(app)
            .get('/api/rewards/points')
            .set('x-auth-token', userToken);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('points');
        expect(response.body.points).toHaveProperty('organic');
        expect(response.body.points).toHaveProperty('nonRecyclable');
        expect(response.body.points).toHaveProperty('total');
    });
});

afterAll(async () => {
    await sequelize.close();
});