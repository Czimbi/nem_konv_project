const User = require('../Model/User');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/auth/login');
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    if (req.session && req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            if (user && user.role === 'admin') {
                return next();
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
        }
    }
    res.status(403).render('error', {
        title: 'Access Denied',
        error: 'You do not have permission to access this resource.'
    });
};

module.exports = {
    isAuthenticated,
    isAdmin
}; 