const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    authors: {
        type: [String],
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    release_date: {
        type: Date,
        required: true
    },
    ISBN: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    }
}, {
    timestamps: true
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book; 