const mongoose = require('mongoose');
const { connectDB } = require('./Database/connection');
const Book = require('./Model/Book');
const Order = require('./Model/Order');
const User = require('./Model/User');

// Sample data
const sampleBooks = [
    {
        title: "The Great Gatsby",
        authors: ["F. Scott Fitzgerald"],
        price: 12.99,
        stock: 50,
        ISBN: "9780743273565",
        release_date: new Date("1925-04-10")
    },
    {
        title: "To Kill a Mockingbird",
        authors: ["Harper Lee"],
        price: 14.99,
        stock: 35,
        ISBN: "9780446310789",
        release_date: new Date("1960-07-11")
    },
    {
        title: "1984",
        authors: ["George Orwell"],
        price: 11.99,
        stock: 25,
        ISBN: "9780451524935",
        release_date: new Date("1949-06-08")
    },
    {
        title: "Pride and Prejudice",
        authors: ["Jane Austen"],
        price: 9.99,
        stock: 40,
        ISBN: "9780141439518",
        release_date: new Date("1813-01-28")
    },
    {
        title: "The Hobbit",
        authors: ["J.R.R. Tolkien"],
        price: 15.99,
        stock: 30,
        ISBN: "9780547928227",
        release_date: new Date("1937-09-21")
    }
];

const sampleUsers = [
    {
        email: "admin@bookstore.com",
        password: "admin123",
        role: "admin",
        given_name: "Admin",
        surname: "User",
        country: "United States",
        city: "New York",
        street: "Broadway",
        house_number: "123",
        phone: "+1 234 567 8900",
        birth_date: new Date("1980-01-01")
    },
    {
        email: "john.doe@example.com",
        password: "password123",
        role: "user",
        given_name: "John",
        surname: "Doe",
        country: "United Kingdom",
        city: "London",
        street: "Baker Street",
        house_number: "221B",
        phone: "+44 20 7123 4567",
        birth_date: new Date("1990-05-15")
    },
    {
        email: "jane.smith@example.com",
        password: "password123",
        role: "user",
        given_name: "Jane",
        surname: "Smith",
        country: "Canada",
        city: "Toronto",
        street: "Yonge Street",
        house_number: "100",
        phone: "+1 416 555 1234",
        birth_date: new Date("1992-08-20")
    },
    {
        email: "robert.wilson@example.com",
        password: "password123",
        role: "user",
        given_name: "Robert",
        surname: "Wilson",
        country: "Australia",
        city: "Sydney",
        street: "George Street",
        house_number: "50",
        phone: "+61 2 8765 4321",
        birth_date: new Date("1985-03-10")
    },
    {
        email: "emma.brown@example.com",
        password: "password123",
        role: "user",
        given_name: "Emma",
        surname: "Brown",
        country: "Germany",
        city: "Berlin",
        street: "Unter den Linden",
        house_number: "1",
        phone: "+49 30 12345678",
        birth_date: new Date("1995-11-25")
    }
];

// Function to generate random orders
async function generateOrders(books, users) {
    const orders = [];
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    // Generate 20 random orders
    for (let i = 0; i < 20; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomBook = books[Math.floor(Math.random() * books.length)];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        orders.push({
            customer: randomUser._id,
            books: [randomBook._id],
            order_date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
            status: randomStatus
        });
    }
    
    return orders;
}

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await connectDB();
        console.log('Connected to MongoDB');
        
        // Clear existing data
        await Book.deleteMany({});
        await Order.deleteMany({});
        await User.deleteMany({});
        console.log('Cleared existing data');
        
        // Insert sample books
        const books = await Book.insertMany(sampleBooks);
        console.log(`Inserted ${books.length} books`);
        
        // Insert sample users
        const users = await User.insertMany(sampleUsers);
        console.log(`Inserted ${users.length} users`);
        
        // Generate and insert orders
        const orders = await Order.insertMany(await generateOrders(books, users));
        console.log(`Inserted ${orders.length} orders`);
        
        console.log('Database seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase(); 