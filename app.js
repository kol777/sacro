const express = require('express');

// import routes
// const authRoutes = require('./routes/auth-routes');
// const profileRoutes = require('./routes/profile-routes');

const app = express();

// set up ejs view
app.set('view engine', 'ejs');

//init passportSetup

// // connect to mongodb
// mongoose.connect(keys.mongodb.dbURI, () =>{
//   console.log('connected to mongodb')
// });

// set up routes
// app.use('/auth', authRoutes);
// app.use('/profile', profileRoutes);

// homepage route
app.get('/', (req, res) => {
  res.render('home');
});

app.listen(3000, () => {
  console.log('app is listening on port 3000');
});
