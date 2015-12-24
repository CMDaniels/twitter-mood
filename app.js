"use strict";

// Connecting dependencies
var Twitter = require('twitter');
var dotenv = require('dotenv');
var five = require('johnny-five');

// Declaring components
var board = new five.Board();
var led;

// Loading environment variables
dotenv.load();

// Connecting to Twitter
var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

// Used in findWorldMood to detect finish
var count;

// Static declaration of moods
var moodNames = [
  "love",
  "joy",
  "suprise",
  "anger",
  "envy",
  "sadness",
  "fear"
];

// Assigns colors to moods
var moodColors = {
  love: '#ff9cce',
  joy: '#ffff94',
  suprise: '#ffa500',
  anger: '#ff4d4d',
  envy: '#009a00',
  sadness: '#1e90ff',
  fear: '#ffffff'
};

// Average mood values (recorded on 12/24/15)
var moodCompare = {
  love: 80,
  joy: 25,
  suprise: 80,
  anger: 28,
  envy: 1,
  sadness: 1,
  fear: 1
};

// Queries corresponding to certain moods
var queries = {
  love: '\"i+love+you\"+OR+\"i+love+her\"+OR+\"i+love+him\"+OR+\"all+my+love\"+OR+\"i\'m+in+love\"+OR+\"i+really+love\"',
  joy: '\"happiest\"+OR+\"so+happy\"+OR+\"so+excited\"+OR+\"i\'m+happy\"+OR+\"woot\"+OR+\"w00t\"',
  suprise: '\"wow\"+OR+\"O_o\"+OR+\"can\'t+believe\"+OR+\"wtf\"+OR+\"unbelievable\"',
  anger: '\"i+hate\"+OR+\"really+angry\"+OR+\"i+am+mad\"+OR+\"really+hate\"+OR+\"so+angry\"',
  envy: '\"i+wish+i\"+OR+\"i\'m+envious\"+OR+ \"i\'m+jealous\"+OR+\"i+want+to+be\"+OR+\"why+can\'t+i\"',
  sadness: '\"i\'m+so+sad\"+OR+\"i\'m+heartbroken\"+OR+\"i\'m+so+upset\"+OR+\"i\'m+depressed\"+OR+\"i+can\'t+stop+crying\"',
  fear: '\"i\'m+so+scared\"+OR+\"i\'m+really+scared\"+OR+\"i\'m+terrified\"+OR+\"i\'m+really+afraid\"+OR+\"so+scared+i\"'
};

// Determines if a tweet was posted in the last 30 seconds
function parseTwitterDate(tdate) {
  var system_date = new Date(Date.parse(tdate));
  var user_date = new Date();
  var diff = Math.floor((user_date - system_date) / 1000);
  if (diff <= 25) {
    return true; // 30 sec or less
  } else {
    return false; // More 30 sec
  }
}

// Updates LED color according to results
function analyzeResults(results) {
  var worldMood = 'suprise';
  // Finds the mood with the highest tweet count
  moodNames.forEach(function (mood) {
    if (results[mood] > results[worldMood]) {
      worldMood = mood;
    }
  });
  // Change LED color
  led.color(moodColors[worldMood]);
  console.log("Changing the LED color to " + moodColors[worldMood] + ", or " + worldMood);
}

// Searches for tweets and sends results to analyzeResults
function findWorldMood() {
  // Declares/resets results object
  var results = {
    love: 0,
    joy: 0,
    suprise: 0,
    anger: 0,
    envy: 0,
    sadness: 0,
    fear: 0
  };
  count = 0;
  moodNames.forEach(function(mood) {
    var yesterday = (new Date(new Date() - 24*60*60*1000)).toISOString().slice(0,10);
    client.get('search/tweets', {q: queries[mood] + "since:" + yesterday, result_type: 'recent', count: 100}, function(error, tweets, response) {
      if (error) {
        console.error(error);
        return false;
      }
      count++;
      tweets.statuses.forEach(function(tweet) {
        if(parseTwitterDate(tweet.created_at)) {
          results[mood]++; // Increment Tweet Count
        }
      });
      if (count === moodNames.length) {
        moodNames.forEach(function(mood) {
          results[mood] -= moodCompare[mood]; // Level Results
        });
        analyzeResults(results);
      }
    });
  });
}

// Starts program when board is ready to compute
board.on('ready', function() {
  // Initializes LED
  led = new five.Led.RGB({
    pins: {
      red: 6,
      green: 5,
      blue: 3
    }
  });
  // Runs every 40 seconds (Not to exceed API Request Limit of 180 requests per 15 minutes)
  setInterval(findWorldMood, 40 * 1000);
});
