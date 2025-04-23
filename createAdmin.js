const mongoose = require('mongoose');
const User = require('./Model/User');
const { connectDB } = require('./Database/connection');

async function createAdmin() {
    try {
        await connectDB();
        
        const admin = await User.create({
            email: 'admin@bookstore.com',
            password: 'admin123',
            given_name: 'Admin',
            surname: 'User',
            role: 'admin'
        });
        
        console.log('Admin user created successfully:', admin);
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createAdmin(); 