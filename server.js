'use strict';

require('dotenv').config();
const express = require('express');
const app = express();
const superagent = require('superagent');
const PORT = process.env.PORT || 3000;
const pg = require('pg');
const methodOverride = require('method-override');
const client = new pg.Client(process.env.DATABASE_URL);
const cors = require('cors');
app.use(cors());

client.connect();
client.on('error', err => console.error(err));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.get('/', renderHomePage);
app.post('/addBook', addBook);
app.get('/searches/new', showForm);
app.post('/searches', createSearch);
app.get('/pages/error', renderError);
app.get('/books/:book_id', getOneBook);
app.put('/update/:book_id', updateBook);
app.delete('/delete/:book_id', deleteBook);

function deleteBook(req, res) {

  let SQL = `DELETE FROM books WHERE id=${req.params.book_id};`;

  client.query(SQL)
    .then(res.redirect(`/`))
    .catch(err => console.error(err));
}

function updateBook(req, res) {
  let { title, author, isbn, image_url, description } = req.body;


  let SQL = `UPDATE books SET title=$1, author=$2, isbn=$3, image_url=$4, description=$5 WHERE id=$6`;
  let values = [title, author, isbn, image_url, description, req.params.book_id];

  client.query(SQL, values)
    .then(res.redirect(`/books/${req.params.book_id}`))
    .catch(err => console.error(err));
}

function getOneBook(req, res) {
  let SQL = 'SELECT * FROM books WHERE id=$1;';
  let values = [req.params.book_id];


  return client.query(SQL, values)
    .then(result => res.render('pages/books/show', { result: result.rows[0] }))
    .catch(err => console.error(err));

}

function renderHomePage(req, res) {
  let SQL = 'SELECT * FROM  books;';


  return client.query(SQL)

    .then(results => res.render('pages/index', { results: results.rows }))

    .catch(err => console.error(err));
}
function addBook(req, res) {
  let { title, author, isbn, image_url, description } = req.body;
  let SQL = 'INSERT INTO books(title, author, isbn, image_url, description) VALUES ($1, $2, $3, $4, $5);';
  let values = [title, author, isbn, image_url, description];

  return client.query(SQL, values)
    .then(res.redirect('/'))
    .catch(err => console.error(err));
}

function showForm(req, res) {
  res.render('pages/searches/new.ejs');
}

function renderError(req, res) {
  res.render('pages/error');
}

function createSearch(req, res) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';
  if (req.body.search[1] === 'title') { url += `+intitle:${req.body.search[0]}`; }
  if (req.body.search[1] === 'author') { url += `+inauthor:${req.body.search[0]}`; }

  superagent.get(url)
    .then(data => {
      return data.body.items.map(book => {
        return new Book(book.volumeInfo);
      });
    })
    .then(results => {
      res.render('pages/searches/show.ejs', { searchResults: JSON.stringify(results) });
    })
    .catch(err => {
      res.render('pages/error', err);
    });
}

function Book(info) {
  this.title = info.title || 'No title available.';
  this.author = info.authors || 'No Author Listed';
  this.isbn = info.industryIdentifiers[0].identifier || 'No ISBN Listed';
  this.image = info.imageLinks.thumbnail;
  this.description = info.description || 'No Description Provided';

  if (this.image.substring(0, 6) !== 'https') {
    let imageLinkS = this.image.substring(6);
    let newImageUrl = 'https:/' + imageLinkS;
    this.image = newImageUrl;

  }
}

app.listen(PORT, () => {
  console.log(`server up on ${PORT}`);
});