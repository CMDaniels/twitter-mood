// Connecting dependencies
var Twitter = require('twitter');
var dotenv = require('dotenv');
var five = require('johnny-five');
var board = new five.Board();

// Loading environment variables
dotenv.load();

// Connecting to Twitter
var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

var tweetsPerPage = 100, // Maximum of 100
    count; // Used as Mood Count

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

// Levels data to comparable levels
var moodAmplifier = {
  love: 0.87,
  joy: 0.85,
  suprise: 0.75,
  anger: 0.86,
  envy: 0.84,
  sadness: 0.88,
  fear: 0.90
}

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

// Determines if Tweet was posted in the last 30 seconds
function parseTwitterDate(tdate) {
    var system_date = new Date(Date.parse(tdate));
    var user_date = new Date();
    var diff = Math.floor((user_date - system_date) / 1000);
    if (diff <= 30) {
      return true; // 30 sec or less
    } else {
      return false; // More 30 sec
    }
}

// Updates LED according to Results
function analyzeResults(results) {

}

// Searches for Tweets
function findWorldMood() {
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
    var today = (new Date()).toISOString().slice(0,10);
    var yesterday = (new Date(new Date() - 24*60*60*1000)).toISOString().slice(0,10);
    client.get('search/tweets', {q: queries[mood] + "since:" + yesterday, result_type: 'recent', count: tweetsPerPage}, function(error, tweets, response) {
      if (error) throw error;
      count++;
      tweets.statuses.forEach(function(tweet) {
        if(parseTwitterDate(tweet.created_at)) {
          results[mood]++; // Increment Tweet Count
        }
      });
      if (count === moodNames.length) {
        moodNames.forEach(function(mood) {
          results[mood] *= moodAmplifier[mood]; // Level Results
        });
        analyzeResults(results);
      }
    });
  });
}

// Dev Testing, Delete When Finished
findWorldMood();

board.on('ready', function() {
  // var led = new five.Led(3);
  // this.loop(35 * 1000, function() {
  //   findWorldMood();
  // }); // Find the mood every 35 seconds (Not to exceed API Request Limit of 30 requests per 15 minutes)
});
