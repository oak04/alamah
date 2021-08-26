/* eslint-disable no-undef */
import 'dotenv/config';
import express from 'express';
import models from './models';
import routes from './routes';
var cors = require('cors')

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// passing the models to the routes
app.use((req, res, next) => {
  req.db = {
    models
  };
  next();
});
app.options('*', cors());

app.use('/', routes.router);

app.listen(process.env.PORT, () =>
  console.log(`Listening on port ${process.env.PORT}!`));
