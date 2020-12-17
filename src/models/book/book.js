'use strict';

const mongoose = require('mongoose');

const bookSchema = mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: false },
  isbn: { type: String, required: false },
  image_url: { type: String, required: false },
  description: { type: String, required: false }
});

const bookModel = mongoose.model('book', bookSchema);


module.exports = bookModel;
