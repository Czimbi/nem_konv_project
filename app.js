const express = require('express');
const { connectDB } = require('./Database/connection');
const Book = require('./Model/Book');
const Customer = require('./Model/Customer');
const Order = require('./Model/Order');
const path = require('path');
const methodOverride = require('method-override');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Views'));

// Connect to MongoDB
connectDB()
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// ===== BOOK ROUTES =====

// Render books index page
app.get('/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.render('books/index', { 
      title: 'All Books',
      books: books
    });
  } catch (error) {
    res.status(500).render('error', { 
      title: 'Error',
      error: error.message 
    });
  }
});

// Render new book form
app.get('/books/new', (req, res) => {
  res.render('books/form', { 
    title: 'Add New Book',
    book: null
  });
});

// Create a new book
app.post('/books', async (req, res) => {
  try {
    // Handle authors array if it's a string
    if (typeof req.body.authors === 'string') {
      try {
        req.body.authors = JSON.parse(req.body.authors);
      } catch (e) {
        req.body.authors = req.body.authors.split(',').map(author => author.trim());
      }
    }
    
    const book = await Book.create(req.body);
    res.redirect(`/books/${book._id}`);
  } catch (error) {
    res.status(400).render('books/form', { 
      title: 'Add New Book',
      book: req.body,
      error: error.message
    });
  }
});

// Render book details page
app.get('/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).render('error', { 
        title: 'Book Not Found',
        error: 'The requested book could not be found.'
      });
    }
    
    // Find orders that include this book
    const orders = await Order.find({ books: book._id })
      .populate('customer')
      .sort({ order_date: -1 });
    
    res.render('books/show', { 
      title: book.title,
      book: book,
      orders: orders
    });
  } catch (error) {
    res.status(500).render('error', { 
      title: 'Error',
      error: error.message 
    });
  }
});

// Render edit book form
app.get('/books/:id/edit', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).render('error', { 
        title: 'Book Not Found',
        error: 'The requested book could not be found.'
      });
    }
    
    res.render('books/form', { 
      title: 'Edit Book',
      book: book
    });
  } catch (error) {
    res.status(500).render('error', { 
      title: 'Error',
      error: error.message 
    });
  }
});

// Update a book
app.put('/books/:id', async (req, res) => {
  try {
    // Handle authors array if it's a string
    if (typeof req.body.authors === 'string') {
      try {
        req.body.authors = JSON.parse(req.body.authors);
      } catch (e) {
        req.body.authors = req.body.authors.split(',').map(author => author.trim());
      }
    }
    
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!book) {
      return res.status(404).render('error', { 
        title: 'Book Not Found',
        error: 'The requested book could not be found.'
      });
    }
    
    res.redirect(`/books/${book._id}`);
  } catch (error) {
    res.status(400).render('books/form', { 
      title: 'Edit Book',
      book: { ...req.body, _id: req.params.id },
      error: error.message
    });
  }
});

// Delete a book
app.delete('/books/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).render('error', { 
        title: 'Book Not Found',
        error: 'The requested book could not be found.'
      });
    }
    res.redirect('/books');
  } catch (error) {
    res.status(500).render('error', { 
      title: 'Error',
      error: error.message 
    });
  }
});

// Search books
app.get('/books/search', async (req, res) => {
  try {
    const { query } = req.query;
    const books = await Book.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { authors: { $regex: query, $options: 'i' } }
      ]
    });
    
    res.render('books/index', { 
      title: `Search Results for "${query}"`,
      books: books,
      searchQuery: query
    });
  } catch (error) {
    res.status(500).render('error', { 
      title: 'Error',
      error: error.message 
    });
  }
});

// ===== CUSTOMER CRUD OPERATIONS =====

// Create a new customer
app.post('/api/customers', async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get all customers
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.status(200).json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a single customer by ID
app.get('/api/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a customer
app.put('/api/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete a customer
app.delete('/api/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== ORDER CRUD OPERATIONS =====

// Create a new order
app.post('/api/orders', async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('books')
      .populate('customer');
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a single order by ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('books')
      .populate('customer');
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update an order
app.put('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('books').populate('customer');
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete an order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== ADDITIONAL OPERATIONS =====

// Get orders by customer ID
app.get('/api/customers/:id/orders', async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.params.id })
      .populate('books')
      .populate('customer');
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update order status
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('books').populate('customer');
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Home page
app.get('/', (req, res) => {
  res.render('index', { 
    title: 'Welcome to Bookstore'
  });
});

// Error page
app.get('/error', (req, res) => {
  res.render('error', { 
    title: 'Error',
    error: req.query.message || 'An error occurred'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { 
    title: 'Page Not Found',
    error: 'The page you are looking for does not exist.'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
