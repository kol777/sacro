const express = require('express');

const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const app = express();
var rp = require('request-promise');
var _ = require('underscore');
const Elo = require('elo-calculator');


app.use(express.static(__dirname + '/views'));
// for twitter api credentials
// set up ejs view
app.set('view engine', 'ejs');

var Equals = [];
var Scored = [];
var elo = new Elo({
 rating: 1200,
 k: [40, 20, 10]
});

// homepage route
app.get('/', function (req, res) {
  data= []
  // Calculating Elos for each team and saving [team, elo] pairs
  calcElos().then(function(){
    Teams.forEach(function(item, idx){
      data.push([item, Math.round(Elos[idx].rating)])
    })
    getEquals()
    getScored()
    res.render('home', {date: data, egaluri: Equals, scoruri: Scored});
    console.log(data)
  }).catch(function(err){
    console.log("err in /: "+err)
  })

});

var Teams = [];
// Elo variables with library variables
var Elos = [];
// ids scraped from espn la liga table
LaLigaTeams = []
// List of lists with matches for a specific team
All = []

function makeTeams() {
  if(Teams.length > 0)
    return;

  if (All.length == 0) {
    console.log("err: meciurile nu sunt scapuite")
    return;
  }

  All.forEach(function(matchList,Listidx){
    if( matchList[1].indexOf(matchList[0][0]) > -1 &&
      matchList[2].indexOf(matchList[0][0]) > -1 &&
      matchList[3].indexOf(matchList[0][0]) > -1)
      Teams.push(matchList[0][0])
    else
      Teams.push(matchList[0][2])
  })
}

function getIds(req, res){
  url = "http://www.espn.com/soccer/table/_/league/esp.1"
  prom = rp(url).then(function(html){
    var $ = cheerio.load(html);
    $('span.team-names').each(function(i, element){
      link = $(this).parent().parent().attr('href')
      LaLigaTeams.push(parseInt(link.split("\/").pop()))
    })
  }).catch(function(err){
    console.log('eroare /ids '+err)
  })
  return prom;
}

function scrapTeams(req, res) {
  //TODO check if its older than or something
  if(true) {
   text = ""
   try {
    text = fs.readFileSync("LaLiga.json");
   } catch (e){
    text = false
  }
    if(text){
      All = JSON.parse(text)
      return Promise.resolve();
    }
  }

  url = 'http://www.espn.com/soccer/club/_/id/'
  promises = []
  LaLigaTeams.forEach(function(item, idx){
    promises[idx] = rp(url+ item).then(function (html){
      All[idx] = []
      i = 0
      rezScore = []
      rezTeam = []
      var $ = cheerio.load(html);
      // Number of goals
      $('div.score-container').each(function(i, element){
       rezScore[i++] = $(this).text();
     })
      i = 0;
      // Team Name Abbreviation
      $('.abbrev').each(function(i, element){
        rezTeam[i++] = $(this).text();
      })
      aux = []
      // Create Team Name1, Team Score1, Team Name2, Team Score2
      for(var j = 0; j < rezTeam.length/2; j++){
        All[idx][j] = [ rezTeam[2*j],rezScore[2*j], rezTeam[2*j + 1],rezScore[2*j + 1] ]
      }
      // Removing duplicate matches
      All[idx] = _.uniq(All[idx], false, function(item) {return item[0]+item[1]+item[2]+item[3]})
      All[idx].shift()
    }).catch(function(err){
      console.log("error in request" + err)
    })
  })
  var prom = Promise.all(promises).then(function(html){
  fs.writeFile("LaLiga.json", JSON.stringify(All), (err) => {
    if (err) throw err;
    console.log("The file was succesfully saved!");
  })
  }).catch(function (err){
    console.log("a request retured error" + err)
  })
  return prom;
}

app.get('/ids', getIds)

function getScored() {
  All.forEach(function(data, index) {
    // console.log("inainte de getTeamScored");
    Scored[index] = parseFloat(getTeamScored(data, index)/data.length);
  })
  console.log(Scored);
}

function getTeamScored(TeamResults, TeamIndex) {
  var k = 0;
  TeamResults.forEach(function(item, index) {
    if (item[0] == Teams[TeamIndex])
        k+= +item[1];
    else k+= +item[3];
    console.log("k este: " + k);
  });
  return k;
}

app.get('/scored', getScored);

function getEquals() {
  All.forEach(function(data, index) {
  // console.log("inainte de getTeamEquals");
    Equals[index] = getTeamEquals(data);
  })
  console.log(Equals);
}

function getTeamEquals(TeamResults) {
  var k = 0;
  TeamResults.forEach(function(item, index) {
    // console.log("scor A este: " + item[1] + " scor B este: " + item[3]);
    if(item[1] === item[3])
      // console.log("marit: "+ k);
    ++k;
  })
  // console.log("k este: " + k);
  return k;
}

app.get('/equals', getEquals);


function calcElos(req, res){
  prom = getIds().then(scrapTeams).then(function(html) {
    console.log("Making Teams")
    makeTeams()
    console.log("Calculating Elos")
    for(var i = 0; i < LaLigaTeams.length; i++)
      Elos[i] = elo.createPlayer(1200)

    All.forEach(function(matchList,Listidx){
      matchList.forEach(function( match, idx) {
        i = Teams.indexOf(match[0])
        j = Teams.indexOf(match[2])
        rez = 0.5
        if(parseInt(match[1]) > parseInt(match[3]) )
          rez = 1
        else if (parseInt(match[1]) < parseInt(match[3]) )
          rez = 0

        if(i > -1 && j > -1  && j > i)
          elo.updateRatings([[Elos[i], Elos[j], rez]])
      })
    })
  }).catch(function(err){
    console.log("shit went down" + err)
  })
  return prom;
}

app.get('/elos', calcElos)

app.get('/list', scrapTeams)

// Deprecated
app.get('/scrape', function(req, res) {
  // Let's scrape Anchorman 2
  url = 'http://www.espn.com/soccer/club/_/id/382';
  rezScore = []
  rezTeam = []
  rez = []
  i = 0;

  request(url, function(error, response, html){

   var score;
   if (!error && response.statusCode == 200) {
    var $ = cheerio.load(html);
    $('div.score-container').each(function(i, element){
         //console.log($(this).html());
         rezScore[i++] = $(this).text();
       })
    i = 0;
    $('.abbrev').each(function(i, element){
        //console.log($(this).html());
        rezTeam[i++] = $(this).text();
      })
  }
  j = 0;

  for(var j = 0; j < rezTeam.length/2; j++){
   rez[j] = [ rezTeam[2*j],rezScore[2*j], rezTeam[2*j + 1],rezScore[2*j + 1] ]

 }
    //console.log(rez)
    res.send('Check your console!')
  })
})

const keys = require('./config/keys')
var Twitter = require('twitter');
// TWITTER
var client = new Twitter({
  consumer_key: keys.twitter.consumer_key,
  consumer_secret: keys.twitter.consumer_secret,
  access_token_key: keys.twitter.access_token_key,
  access_token_secret: keys.twitter.access_token_secret
});

// Twitter Stream
var stream = client.stream('statuses/filter', {track: 'Realsdadsaa332432 sdsdMadridsdsadsadsarewe232s'});
stream.on('data', function(event) {
  console.log(event && event.text);
});

stream.on('error', function(error) {
  throw error;
});

app.listen(3000, () => {
  console.log('app is listening on port 3000');
});
