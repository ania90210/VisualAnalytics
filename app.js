var express = require('express');
var Sentiment = require('sentiment');
var path = require('path');
var bodyParser = require('body-parser');
var fs = require('fs');
const fileUpload = require('express-fileupload');
var pos = require('pos');
var sentiment = new Sentiment();
var app = express();
app.use(fileUpload());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname))

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

app.post('/fileupload', async (req, res) => {
    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            var fileBuffer = JSON.parse(JSON.stringify(req.files)).files.data.data;
            var text = Buffer.from(fileBuffer).toString('utf8');
            var substrings = text.split('.')
            var finalArray = []
            substrings.forEach(element => {
                var sentimentResult = sentiment.analyze(element);
                finalArray.push(sentimentResult);   
            });

            var words = new pos.Lexer().lex(text);
            var tagger = new pos.Tagger();
            var taggedWords = tagger.tag(words);
            res.send([finalArray, taggedWords]);            
        }
    } catch (err) {
        console.log(err)
        res.status(500).send(err);
    }
})