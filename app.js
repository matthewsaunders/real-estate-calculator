const express = require('express');
const logger = require('morgan');
const path = require('path');

const {
  fetchListing,
} = require('./app/helpers');

const app = express();
const port = process.env.PORT || 3000;

// configure app
app.use(logger('dev'));
app.set('view engine', 'ejs');

// set asset routes
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// set app routes
app.get('/', (req, res) => {
  res.render('index');
});
app.get('/listing', async (req, res) => {
  const url = req.query.url;
  const listing = await fetchListing(url);

  // const listing = {
  //   address: '186 SE 12th Ter #2203',
  //   numBeds: 4,
  //   numBaths: 2,
  //   area: 1064,
  //   hoa: 866,
  //   taxes: 476,
  //   insurance: 535,
  //   listPrice: 549000,
  //   offerPrice: 549000,
  // };
  res.send(listing);
});

// start app
app.listen(port, () => {
  console.log('Server started at http://localhost:' + port);
});
