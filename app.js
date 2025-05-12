const express = require('express');
const { connectDB } = require('./Database/connection');
const Book = require('./Model/Book');
const Order = require('./Model/Order');
const User = require('./Model/User');
const path = require('path');
const methodOverride = require('method-override');
const session = require('express-session');
const { isAuthenticated, isAdmin } = require('./middleware/auth');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Middleware to add user information to all views
app.use(async (req, res, next) => {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            res.locals.isAuthenticated = true;
            res.locals.user = user;
            res.locals.isAdmin = user.role === 'admin';
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    } else {
        res.locals.isAuthenticated = false;
        res.locals.user = null;
        res.locals.isAdmin = false;
    }
    next();
});

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Views'));

// Connect to MongoDB
connectDB()
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// ===== AUTHENTICATION ROUTES =====

// Login page
app.get('/auth/login', (req, res) => {
    res.render('auth/login', { 
        title: 'Login',
        error: null 
    });
});

// Login handler
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid email or password'
            });
        }
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid email or password'
            });
        }
        
        req.session.userId = user._id;
        res.redirect('/');
    } catch (error) {
        res.render('auth/login', {
            title: 'Login',
            error: 'An error occurred during login'
        });
    }
});

// Register page
app.get('/auth/register', (req, res) => {
    res.render('auth/register', { 
        title: 'Register',
        error: null 
    });
});

// Register handler
app.post('/auth/register', async (req, res) => {
    try {
        const { email, password, confirmPassword, given_name, surname } = req.body;
        
        if (password !== confirmPassword) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'Passwords do not match'
            });
        }
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'Email already registered'
            });
        }
        
        const user = await User.create({
            email,
            password,
            given_name,
            surname
        });
        
        req.session.userId = user._id;
        res.redirect('/');
    } catch (error) {
        res.render('auth/register', {
            title: 'Register',
            error: error.message
        });
    }
});

// Logout handler
app.get('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// ===== BOOK ROUTES =====

// Render books index page
app.get('/books', async (req, res) => {
    try {
        const books = await Book.find();
        res.render('books/index', {
            title: 'All Books',
            books: books,
            isAdmin: req.session.userId ? await User.findById(req.session.userId).then(user => user.role === 'admin') : false
        });
    } catch (error) {
        res.status(500).render('error', {
            title: 'Error',
            error: error.message
        });
    }
});

// Render new book form (admin only)
app.get('/books/new', isAuthenticated, isAdmin, (req, res) => {
    res.render('books/form', {
        title: 'Add New Book',
        book: null
    });
});

// Create a new book (admin only)
app.post('/books', isAuthenticated, isAdmin, async (req, res) => {
    try {
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
        
        const orders = await Order.find({ books: book._id })
            .populate('customer')
            .sort({ order_date: -1 });
        
        const isAdmin = req.session.userId ? await User.findById(req.session.userId).then(user => user.role === 'admin') : false;
        
        res.render('books/show', {
            title: book.title,
            book: book,
            orders: orders,
            isAdmin: isAdmin
        });
    } catch (error) {
        res.status(500).render('error', {
            title: 'Error',
            error: error.message
        });
    }
});

// Render edit book form (admin only)
app.get('/books/:id/edit', isAuthenticated, isAdmin, async (req, res) => {
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

// Update a book (admin only)
app.put('/books/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
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

// Delete a book (admin only)
app.delete('/books/:id', isAuthenticated, isAdmin, async (req, res) => {
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
        
        const isAdmin = req.session.userId ? await User.findById(req.session.userId).then(user => user.role === 'admin') : false;
        
        res.render('books/index', {
            title: `Search Results for "${query}"`,
            books: books,
            searchQuery: query,
            isAdmin: isAdmin
        });
    } catch (error) {
        res.status(500).render('error', {
            title: 'Error',
            error: error.message
        });
    }
});

// ===== CUSTOMER ROUTES =====

// Create a new customer (admin only)
app.post('/api/customers', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const user = await User.create({ ...req.body, role: 'user' });
        res.status(201).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Get all customers (admin only)
app.get('/api/customers', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const users = await User.find({ role: 'user' });
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get a single customer by ID (admin only)
app.get('/api/customers/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, role: 'user' });
        if (!user) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update a customer (admin only)
app.put('/api/customers/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const user = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'user' },
            req.body,
            { new: true, runValidators: true }
        );
        if (!user) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Delete a customer (admin only)
app.delete('/api/customers/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const user = await User.findOneAndDelete({ _id: req.params.id, role: 'user' });
        if (!user) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== ORDER ROUTES =====

// Create a new order (authenticated users only)
app.post('/api/orders', isAuthenticated, async (req, res) => {
    try {
        const order = await Order.create({
            ...req.body,
            customer: req.session.userId
        });
        res.status(201).json({ success: true, data: order });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Get all orders (admin only)
app.get('/api/orders', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('books')
            .populate('customer');
        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get a single order by ID (admin or order owner)
app.get('/api/orders/:id', isAuthenticated, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('books')
            .populate('customer');
        
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        
        const user = await User.findById(req.session.userId);
        if (user.role !== 'admin' && order.customer.toString() !== req.session.userId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update an order (admin only)
app.put('/api/orders/:id', isAuthenticated, isAdmin, async (req, res) => {
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

// Delete an order (admin only)
app.delete('/api/orders/:id', isAuthenticated, isAdmin, async (req, res) => {
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

// Get orders by customer ID (admin or order owner)
app.get('/api/customers/:id/orders', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (user.role !== 'admin' && req.params.id !== req.session.userId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        
        const orders = await Order.find({ customer: req.params.id })
            .populate('books')
            .populate('customer');
        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update order status (admin only)
app.patch('/api/orders/:id/status', isAuthenticated, isAdmin, async (req, res) => {
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
        title: 'Welcome to Bookstore',
        isAuthenticated: !!req.session.userId,
        isAdmin: req.session.userId ? User.findById(req.session.userId).then(user => user.role === 'admin') : false
    });
});

// Error page
app.get('/error', (req, res) => {
    res.render('error', {
        title: 'Error',
        error: req.query.message || 'An error occurred'
    });
});

// Render customers index page (admin only)
app.get('/customers', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const customers = await User.find({ role: 'user' });
        res.render('customers/index', {
            title: 'Customers',
            customers
        });
    } catch (error) {
        res.status(500).render('error', {
            title: 'Error',
            error: error.message
        });
    }
});

// Render orders index page (admin only)
app.get('/orders', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('books')
            .populate('customer');
        res.render('orders/index', {
            title: 'Orders',
            orders
        });
    } catch (error) {
        res.status(500).render('error', {
            title: 'Error',
            error: error.message
        });
    }
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
