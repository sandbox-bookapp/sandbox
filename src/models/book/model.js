'use strict';

const mongoose = require('mongoose');

const bookSchema = mongoose.Schema({
  author: { type: String, required: false },
  title: { type: String, required: true },
  isbn: { type: String, required: false },
  image_url: { type: String, required: false },
  description: { type: String, required: false }
});

const bookModel = mongoose.model('book', bookSchema);


module.exports = bookModel;
