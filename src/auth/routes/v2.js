'use strict';

const express = require('express');
const collection = require('../../models/data-collection.js');
const router = express.Router();
const models = new Map();
const User = require('../models/users.js');

const acl = require('../middleware/acl');
const basicAuth = require('../middleware/basic');
const bearerAuth = require('../middleware/bearer');
const superagent = require('superagent');


router.get('/', userLog);
router.get('/home', renderHomePage);
router.post('/addBook', addBook);
router.get('/searches/new', showForm);
router.post('/searches', createSearch);
router.get('/pages/error', renderError);
router.get('/books/:book_id', getOneBook);
router.put('/update/:book_id', updateBook);
router.delete('/delete/:book_id', deleteBook);


function userLog(req, res){
  res.render('pages/user');
}
async function renderHomePage(req, res) {
  console.log('this is the homepage', collection);
  let results = await collection.get();
  console.log(results);
  res.render('pages/index', { results });
}
async function addBook(req, res) {
  let obj = req.body;
  await collection.create(obj);
  res.redirect('home');
}
function showForm(req, res) {
  res.render('pages/searches/new.ejs');
}
function createSearch(req, res) {
  console.log('made it to searches!');
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
function renderError(req, res) {
  res.render('pages/error');
}
async function getOneBook(req, res) {
  const id = req.params.book_id;
  let result = await collection.get(id);
  res.render('pages/books/show', { result })
}
async function updateBook(req, res) {
  // let { title, author, isbn, image_url, description } = req.body;
  let id = req.params.book_id;
  let obj = req.body;
  await collection.update(id, obj);
  res.redirect(`../books/${id}`);
}
async function deleteBook(req, res) {
  let id = req.params.book_id;
  await collection.delete(id);
  res.redirect('../home');
  // let SQL = `DELETE FROM books WHERE id=${req.params.book_id};`;
  // client.query(SQL)
    // .then(res.redirect(`/home`))
    // .catch(err => console.error(err));
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
router.post('/signup', async function(req, res, next) {
  console.log('this is the router', req.body);
  try {
    let user = new User(req.body);
    await user.save();
    res.redirect('/');
  } catch (e) {
    next(e.message)
  }
});

router.post('/signin', basicAuth, (req, res, next) => {
  res.redirect('home');
  res.status(200).json(user);
});

router.get('/users', bearerAuth, acl('delete'), async (req, res, next) => {
  const users = await User.find({});
  const list = users.map(user => user.username);
  res.status(200).json(list);
});

router.get('/secret', bearerAuth, async (req, res, next) => {
  res.status(200).send('Welcome to the secret area')
});

module.exports = router;