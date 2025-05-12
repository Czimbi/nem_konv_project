const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    order_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    order_value: {
        type: Number,
        required: true,
        min: 0
    },
    books: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    }],
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Calculate order value before saving
orderSchema.pre('save', async function(next) {
    if (this.isModified('books')) {
        try {
            const Book = mongoose.model('Book');
            let total = 0;
            
            for (const bookId of this.books) {
                const book = await Book.findById(bookId);
                if (book) {
                    total += book.price;
                }
            }
            
            this.order_value = total;
        } catch (error) {
            next(error);
        }
    }
    next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 