import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001/api',
    withCredentials: true
});

async function testLogin() {
    try {
        console.log('Attempting login...');
        const response = await api.post('/auth/login', {
            email: 'vitor@affilia.group',
            password: 'A2cf8b734@'
        });
        console.log('Login Success:', response.data);
    } catch (error: any) {
        console.error('Login Failed:', error.response?.data || error.message);
    }
}

testLogin();
