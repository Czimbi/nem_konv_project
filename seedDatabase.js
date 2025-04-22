const mongoose = require('mongoose');
const { connectDB } = require('./Database/connection');
const Book = require('./Model/Book');
const Customer = require('./Model/Customer');
const Order = require('./Model/Order');

// Sample data for books
const booksData = [
  {
    title: 'The Great Gatsby',
    authors: ['F. Scott Fitzgerald'],
    price: 12.99,
    release_date: new Date('1925-04-10'),
    ISBN: '9780743273565',
    stock: 15
  },
  {
    title: 'To Kill a Mockingbird',
    authors: ['Harper Lee'],
    price: 14.99,
    release_date: new Date('1960-07-11'),
    ISBN: '9780446310789',
    stock: 20
  },
  {
    title: '1984',
    authors: ['George Orwell'],
    price: 11.99,
    release_date: new Date('1949-06-08'),
    ISBN: '9780451524935',
    stock: 18
  },
  {
    title: 'Pride and Prejudice',
    authors: ['Jane Austen'],
    price: 9.99,
    release_date: new Date('1813-01-28'),
    ISBN: '9780141439518',
    stock: 12
  },
  {
    title: 'The Hobbit',
    authors: ['J.R.R. Tolkien'],
    price: 15.99,
    release_date: new Date('1937-09-21'),
    ISBN: '9780547928227',
    stock: 25
  },
  {
    title: 'The Catcher in the Rye',
    authors: ['J.D. Salinger'],
    price: 13.99,
    release_date: new Date('1951-07-16'),
    ISBN: '9780316769488',
    stock: 10
  },
  {
    title: 'Lord of the Flies',
    authors: ['William Golding'],
    price: 10.99,
    release_date: new Date('1954-09-17'),
    ISBN: '9780399501487',
    stock: 14
  },
  {
    title: 'The Alchemist',
    authors: ['Paulo Coelho'],
    price: 11.99,
    release_date: new Date('1988-06-01'),
    ISBN: '9780062315007',
    stock: 22
  },
  {
    title: 'Brave New World',
    authors: ['Aldous Huxley'],
    price: 12.99,
    release_date: new Date('1932-01-01'),
    ISBN: '9780060850524',
    stock: 16
  },
  {
    title: 'The Da Vinci Code',
    authors: ['Dan Brown'],
    price: 16.99,
    release_date: new Date('2003-03-18'),
    ISBN: '9780307474278',
    stock: 30
  }
];

// Sample data for customers
const customersData = [
  {
    surname: 'Smith',
    given_name: 'John',
    country: 'United States',
    city: 'New York',
    street: 'Broadway',
    house_number: 123,
    phone: 2125551234,
    email: 'john.smith@example.com',
    birth_date: new Date('1985-05-15')
  },
  {
    surname: 'Johnson',
    given_name: 'Emily',
    country: 'Canada',
    city: 'Toronto',
    street: 'Queen Street',
    house_number: 456,
    phone: 4165556789,
    email: 'emily.johnson@example.com',
    birth_date: new Date('1990-08-22')
  },
  {
    surname: 'Williams',
    given_name: 'Michael',
    country: 'United Kingdom',
    city: 'London',
    street: 'Oxford Street',
    house_number: 789,
    phone: 2075554321,
    email: 'michael.williams@example.com',
    birth_date: new Date('1978-03-10')
  },
  {
    surname: 'Brown',
    given_name: 'Sarah',
    country: 'Australia',
    city: 'Sydney',
    street: 'George Street',
    house_number: 321,
    phone: 2955558765,
    email: 'sarah.brown@example.com',
    birth_date: new Date('1992-11-30')
  },
  {
    surname: 'Jones',
    given_name: 'David',
    country: 'Germany',
    city: 'Berlin',
    street: 'Kurfürstendamm',
    house_number: 654,
    phone: 3055559876,
    email: 'david.jones@example.com',
    birth_date: new Date('1988-07-18')
  }
];

// Function to generate random orders
const generateOrders = (books, customers) => {
  const orders = [];
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  
  // Generate 20 random orders
  for (let i = 0; i < 20; i++) {
    // Random customer
    const customer = customers[Math.floor(Math.random() * customers.length)];
    
    // Random number of books (1-3)
    const numBooks = Math.floor(Math.random() * 3) + 1;
    const orderBooks = [];
    
    // Random books
    for (let j = 0; j < numBooks; j++) {
      const book = books[Math.floor(Math.random() * books.length)];
      orderBooks.push(book._id);
    }
    
    // Random date within the last 30 days
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));
    
    // Random status
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    orders.push({
      order_date: orderDate,
      order_value: 0, // Will be calculated by the pre-save middleware
      books: orderBooks,
      customer: customer._id,
      status: status
    });
  }
  
  return orders;
};

// Main function to seed the database
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await Book.deleteMany({});
    await Customer.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared existing data');
    
    // Insert books
    const books = await Book.insertMany(booksData);
    console.log(`Inserted ${books.length} books`);
    
    // Insert customers
    const customers = await Customer.insertMany(customersData);
    console.log(`Inserted ${customers.length} customers`);
    
    // Generate and insert orders
    const ordersData = generateOrders(books, customers);
    const orders = await Order.insertMany(ordersData);
    console.log(`Inserted ${orders.length} orders`);
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase(); 