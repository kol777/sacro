const express = require('express');

// import routes
// const authRoutes = require('./routes/auth-routes');
// const profileRoutes = require('./routes/profile-routes');

const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const app = express();

// set up ejs view
app.set('view engine', 'ejs');


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

app.get('/scrape', function(req, res){
  // Let's scrape Anchorman 2
  url = 'http://www.imdb.com/title/tt1229340/';
  url1 = 'http://flashscore.com/';

  request(url1, function(error, response, html){
    //console.log(html)
    var $ = cheerio.load(html, {
      withDomLvl1: true,
      normalizeWhitespace: false,
      xmlMode: false,
      decodeEntities: true
    });
    //console.log($)
    var score;
    // var title, release, rating;
    // var json = { title : "", release : "", rating : ""};
    var json = {score: ""};
    var content = $.text();
    //
    console.log(content);

    //   $('.ratingValue').filter(function(){
    //     var data = $(this);
    //     rating = data.text().trim();
    //
    //     json.rating = rating;
    //   })

    // fs.writeFile('output.json', JSON.stringify(json, null, 4), function(err){
    //   console.log('File successfully written! - Check your project directory for the output.json file');
    // })

    res.send('Check your console!')
  })
})

app.listen(3000, () => {
  console.log('app is listening on port 3000');
});
