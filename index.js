var firstWord =""; // root word
var beginWordTreeWord = "";
var currentType = ''; // current type of the word tree = prefix tree by default
var inputs;
var results = []; // array for storing results
var chart = null;
var taggedWords = [];
var sentiments = [];
var topWords = [];
var ignorePosTags = [",", ".", ":", ";", "$", "#", '"', "(", ")"];

// Uploading a text file and parsing the text content to sentences
$(document).ready(function () {
    $("#fileselect").on("change", function () {
        var fd = new FormData();
        var files = $('#fileselect')[0].files[0];
        fd.append('files', files);

        $.ajax({
            url: "/fileupload",
            type: "post",
            data: fd,
            contentType: false,
            processData: false,
            success: function(data) {
                firstWord = '';
                sentiments = data[0];
                taggedWords = data[1];
                taggedWords = taggedWords.filter(function(elem){
                    return !ignorePosTags.includes(elem[1]);
                });
                handleFile();
            }
        })
    });
});

// Callback function provided by the google api for drawing and displaying the word tree
function draw() {
    google.charts.load('current', {packages:['wordtree','corechart']});
    google.charts.setOnLoadCallback(drawChart);    
    google.charts.setOnLoadCallback(drawPieChart);
    google.charts.setOnLoadCallback(drawBarChart);    
}

// Function that splits the input text and stores into array of sentences.
// This array serves as an input array to the word tree.
function drawChart() {
    var substrings = results[0].split('.')
    var finalArray = [['phrase', {role: 'style'}]];
    if(firstWord === "") {
        firstWord = substrings[0].split(" ")[0];        
    }

    $(document).find("#firstWord").first().text(firstWord);

    var text = results[0];
    var wordCountsObjects = { };
    var allWords = text.split(/(\b[^\s | ']+\b)/g);
    allWords = allWords.map(s => s.trim());

    allWords = allWords.filter((e) => {
        return e && !e.match(/^[.,:!?']/);
    });


    for(var i = 0; i < allWords.length; i++){
        wordCountsObjects[allWords[i]] = (wordCountsObjects[allWords[i]] || 0) + 1;
    }

    var finalWordsArray = [];
    finalWordsArray = Object.keys(wordCountsObjects).map(function (key) {
        return {
            name: key,
            value: wordCountsObjects[key]
        };
    });

    finalWordsArray.sort(function (a, b) {
        return b.value - a.value;
    });
    topWords = [];
    topWords = finalWordsArray.slice(0,10);    
    
    var weight = getWeight();    
    tileBar(weight);

    // filter empty sentences
    finalArray = finalArray.filter(function(e){
        return e;
    }); 

    // Map sentences to a color, according to its sentiment 
    // (gradient from light green to dark red)
    substrings.forEach((element, index) => {
        finalArray.push([element + '.', mapSentimentToColor(sentiments[index].comparative)]);   
    });

     // finalArray is the processed text serving as the input for google.visualization
    var data = google.visualization.arrayToDataTable(finalArray);

    // Defining options provided by the API 
    var options = {
        wordtree: {
            format: 'implicit',
            type: currentType,
            word: firstWord
        },
        width : 7000,
        maxFontSize: 24
    };

    var x = document.getElementById('wordtree_basic')

    // Reseting the word tree (after uploading a new .txt file)
    if(x.innerHTML != "")
        x.innerHTML = "";

    chart = new google.visualization.WordTree(document.getElementById('wordtree_basic'));
    // Adding listener on the chart, for when a user searches for a word in text
    google.visualization.events.addListener(chart, 'select', selectHandler);
    chart.draw(data, options);
    this.encapsulateWords();
}

// Draw pie chart for number of occurances and their pos tag
function drawPieChart(){
    var dataTable = [['POS Tag', 'Occurances']];
    var tags = [];
    var tagCountObjects = {};
    taggedWords.forEach(function(element){
        tags.push(element[1]);
    })

    for(var i = 0; i < tags.length; i++){
        tagCountObjects[tags[i]] = (tagCountObjects[tags[i]] || 0) + 1;
    }

    var finalTagsArray = [];
    finalTagsArray = Object.keys(tagCountObjects).map(function (key) {
        return {
            name: key,
            value: tagCountObjects[key]
        };
    });

    finalTagsArray = finalTagsArray.filter(function(element){
        if(ignorePosTags.includes(element.name))
            return false;
        
        return true;
    });

    finalTagsArray.sort(function (a, b) {
        return b.value - a.value;
    });

    finalTagsArray.forEach((element) => {
        dataTable.push([posTagsMapper(element.name), element.value ]);   
    });

    var slices = [];
    finalTagsArray.forEach((element) => {
        slices.push({
            color: getMappedColor(element.name)
        });
    })

    var options = {
        title: 'POS Tag occurances',
        legend : {
            position: "bottom"
        },
        chartArea: { width:'100%',height:'60%'},
        slices: slices
    };

    var data = google.visualization.arrayToDataTable(dataTable);
    var pieChart = new google.visualization.PieChart(document.getElementById('piechart'));

    pieChart.draw(data, options);
}

// Draw bar chart with word type and number of occurances for the whole text 
// (all words are considered in making this chart)
function drawBarChart(){
    var finalBarArray = [["Word", 
    "Coordinating Conjunction",
    "Cardinal number",
    "Determiner",
    "Existential there",
    "Foreign Word",
    "Preposition",
    "Adjective",
    "Adjective, comparative",
    "Adjective, superlative",
    "List item marker",
    "Modal",
    "Noun, sing. or mass",
    "Proper noun, sing.",
    "Proper noun, plural",
    "Noun, plural",
    "Possessive ending",
    "Predeterminer",
    "Possessive pronoun",
    "Personal pronoun",
    "Adverb",
    "Adverb, comparative",
    "Adverb, superlative",
    "Particle",
    "Symbol",
    "to",
    "Interjection",
    "verb, base form",
    "verb, past tense",
    "verb, gerund",
    "verb, past part",
    "verb, present",
    "verb, present",
    "Wh-determiner",
    "Wh pronoun",
    "Possessive-Wh",
    "Wh-adverb", { role: 'annotation' } ]];

    var wordsWithTags = [];
        topWords.forEach(function(topWord){
        var tagsCountArray = [
            ["CC", 0],
            ["CD", 0],
            ["DT", 0],
            ["EX", 0],
            ["FW", 0],
            ["IN", 0],
            ["JJ", 0],
            ["JJR", 0],
            ["JJS", 0],
            ["LS", 0],
            ["MD", 0],
            ["NN", 0],
            ["NNP", 0],
            ["NNPS", 0],
            ["NNS", 0],
            ["POS", 0],
            ["PDT", 0],
            ["PRP$", 0],
            ["PRP", 0],
            ["RB", 0],
            ["RBR", 0],
            ["RBS", 0],
            ["RP", 0],
            ["SYM", 0],
            ["TO", 0],
            ["UH", 0],
            ["VB", 0],
            ["VBD", 0],
            ["VBG", 0],
            ["VBN", 0],
            ["VBP", 0],
            ["VBZ", 0],
            ["WDT", 0],
            ["WP", 0],
            ["WP$", 0],
            ["WRB", 0]
        ];
        taggedWords.forEach(function(element){
            if(topWord.name == element[0]){
                tagsCountArray.find(function(e){
                    if(e[0] == element[1])
                        e[1]++;
                })
            }
        });
        wordsWithTags.push([topWord.name, tagsCountArray]);
    });
  
    var colors = getAllColorMappings();
    wordsWithTags.forEach(function(element, index){
        var returnArray = [element[0]];
        element[1].forEach(function(subelement){
            returnArray.push(subelement[1]);
        })
        returnArray.push(element[0]);
        finalBarArray.push(returnArray);
    })

    // Invoking the API functionality for drawing the chart
    var data = google.visualization.arrayToDataTable(finalBarArray);
    var view = new google.visualization.DataView(data);
    var options = {
        title: "Top 10 words by occurance",
        legend: { 
            position: "none" 
        },
        axes: {
            x: {
                0: { side: 'top', label: 'Occurances'} // Top x-axis.
            }
        },
        isStacked: true,
        series: colors
    };

    var barChart = new google.visualization.BarChart(document.getElementById("barchart"));
    barChart.draw(view, options);
}

// Implementation of the double-click functionality, where the double-clicked word becomes the new root word
function selectHandler() {
    $("text").on("dblclick", function(d,i) { 
        var word = $(d.target)[0].innerHTML;
        if(word != firstWord) {
            firstWord = word;
            draw();
        }   
    })
}

// Function for handling the file, by checking that the file is not larger than 100KB
// If the file is larger than 100KB, the browser alert appears
function handleFile() {
    var inputCount;
    var filesLoaded = 0;
    inputs = [document.getElementById('fileselect')];
    if(inputs[0].files[0].size > 100000) {
        alert("File is too big. Limit is 100KB");
        return;
    }

    // Processing the input text by saving the text information in an array and initializing the chart
    inputCount = Number(inputs.length);
    for (var i = 0; i < inputCount ; i++) {
        if (inputs[i].files && inputs[i].files[0]) {
            var FR = new FileReader();
            FR.onload = function (event) {
                document.getElementById('textoverview').textContent = this.result;                
                firstWord = this.result.split(" ")[0];
                results = [];
                chart = null;
                results.push(event.target.result);
                filesLoaded++;
                if (filesLoaded == inputCount) {
                    result = results;
                }
                
                draw();
                drawPieChart();
            };
            FR.readAsText(inputs[i].files[0]);
        }
    }
}

// Encapsulate words into a correct class depending on the type (normal word, dot, punctuation, space)
function encapsulateWords() {
    var words = $("#textoverview").first().text().split(/(?=[.\s]|\b)/);
    words.forEach(function(value, index, collection) {
        var isPunctuation = !!value.match(/^[.,:!?]/)
        var isSpace = !!value.match(/\s+/);
        var isDot = !!value.match(/^[.]/)
        if(!isPunctuation && !isSpace)
            collection[index] = "<span class='word'>" + value + "</span>";
        if(isPunctuation)
            collection[index] = "<span class='punctuation'>" + value + "</span>";
        if(isDot)
            collection[index] = "<span class='dot'>" + value + "</span>";
        if(isSpace)
            collection[index] = "<span class='space'>" + value + "</span>";
        
    });
    var text = words.join("");
    $("#textoverview").first().html(text);
    
    // Join the word clicked on to the rest of the phrase (root word)
    $(".word").on("click", function() {
        var selectedWord = this.textContent.replace(/\./g, '');
        if(selectedWord != firstWord) {
            firstWord = selectedWord;
            draw();
        }           
    });

    // Make the word that user double-clicked on the new root word
    $("text").on("dblclick", function(d,i) { 
        var word = $(d.target)[0].innerHTML;
        if(word != firstWord) {
            firstWord = word;
            draw();
        }   
    })

    // Keypress listener for the search field
    $('#search').on('keypress', function (e) {
        if(e.which === 13){
           $(this).attr("disabled", "disabled");
           searchWord();
           $(this).removeAttr("disabled");
        }
    });
    
    // Call on markSelectedWord function, to correctly color the word
    markSelectedWord(firstWord);
}

// Correctly color the word - red (the root word) or 
// yellow (the words comming after the root word until the first dot)
function markSelectedWord(word) {
    $('span').removeClass('yellow');
    $('span').removeClass('red');
    var wordSpans = $('.word').filter(function() {
        return $(this).text() === word;
        }).closest('span');
    wordSpans.addClass('red');
    var length  = wordSpans.length;
    for (var i=0; i<length; i++) {
        $(wordSpans[i]).nextUntil('span.dot').addClass('yellow');        
        $(wordSpans[i]).nextUntil('span.dot').next("span").addClass('yellow');   
    }
}

// Search functionality for finding a word user enetered in the search field
function searchWord() {
    var searchText = document.getElementById('search').value;
    firstWord = searchText.replace(/\./g, '');    
    draw();
}

function getWeight(){
    var weight = 0;
    var words2 = $("#textoverview").first().text().split(/(?=[.\s]|\b)/);
    words2.forEach(function(word) {
        if(firstWord == word){
            weight++;
        }
    });

    return weight;
}

// Create a tile bar, with information on what is the word searched for, number of its
// occurances and color the tile bar with correct gradient (w.r.t. the number of occurences)
function tileBar(weight) {
    if(currentType == '') {
        var tilebar = document.getElementById('tilebar'); 
        var wtext = document.getElementById('weight'); 
        wtext.innerHTML = weight;
        var topTenWords = topWords.map((el) => el.name);
        if(topTenWords.includes(firstWord)){
            tilebar.style.setProperty('--s', '0%');
        }
        else tilebar.style.setProperty('--s', '100%');        
    }
}

// Color the word according to its sentiment 
// (positive - light to dark green, 
// negative - light to dark red),
// neutral - black
function mapSentimentToColor(sentiment){
    if(sentiment < -0.5)
        return '#8b0000';
    if(sentiment < 0)
        return '#FF0000';
    if(sentiment == 0)
        return '#000000';
    if(sentiment < 0.5)
        return '#32CD32';
    return '#6B8E23';	
}

// Mapping the word type with color and key word
function getTagDict() {
    var dict = [];
    dict.push({
        key:   "CC",
        value: "Coordinating Conjunction",
        color: "#3366cc"
    });
    dict.push({
        key:   "CD",
        value: "Cardinal number",
        color: "#dc3912"
    });
    dict.push({
        key:   "DT",
        value: "Determiner",
        color: "#ff9900"
    });
    dict.push({
        key:   "EX",
        value: "Existential there",
        color: "#109618"
    });
    dict.push({
        key:   "FW",
        value: "Foreign Word",
        color: "#990099"
    });
    dict.push({
        key:   "IN",
        value: "Preposition",
        color: "#0099c6"
    });
    dict.push({
        key:   "JJ",
        value: "Adjective",
        color: "#dd4477"
    });
    dict.push({
        key:   "JJR",
        value: "Adjective comparative",
        color: "#cccccc"
    });
    dict.push({
        key:   "JJS",
        value: "Adjective, superlative",
        color: "#66aa00"
    });
    dict.push({
        key:   "LS",
        value: "List item marker",
        color: "#b82e2e"
    });
    dict.push({
        key:   "MD",
        value: "Modal",
        color: "#316395"
    });
    dict.push({
        key:   "NN",
        value: "Noun, sing. or mass",
        color: "#994499"
    });
    dict.push({
        key:   "NNP",
        value: "Proper noun, sing.",
        color: "#22aa99"
    });
    dict.push({
        key:   "NNPS",
        value: "Proper noun, plural",
        color: "#6633cc"
    });
    dict.push({
        key:   "NNS",
        value: "Noun, plural",
        color: "#e67300"
    });
    dict.push({
        key:   "POS",
        value: "Possessive ending",
        color: "#8b0707"
    });
    dict.push({
        key:   "PDT",
        value: "Predeterminer",
        color: "#651067"
    });
    dict.push({
        key:   "PRP$",
        value: "Possessive pronoun",
        color: "#329262"
    });
    dict.push({
        key:   "PRP",
        value: "Personal pronoun",
        color: "#5574a6"
    });
    dict.push({
        key:   "RB",
        value: "Adverb",
        color: "#3b3eac"
    });
    dict.push({
        key:   "RBR",
        value: "Adverb, comparative",
        color: "#b77322"
    });
    dict.push({
        key:   "RBS",
        value: "Adverb, superlative",
        color: "#16d620"
    });
    dict.push({
        key:   "RP",
        value: "Particle",
        color: "#b91383"
    });
    dict.push({
        key:   "SYM",
        value: "Symbol",
        color: "#f4359e"
    });
    dict.push({
        key:   "TO",
        value: "to",
        color: "#9c5935"
    });
    dict.push({
        key:   "UH",
        value: "Interjection",
        color: "#c7b1b9"        
    });
    dict.push({
        key:   "VB",
        value: "verb, base form",
        color: "#26c146"
    });
    dict.push({
        key:   "VBD",
        value: "verb, past tense",
        color: "#13bacf"
    });
    dict.push({
        key:   "VBG",
        value: "verb, gerund",
        color: "#e37a7d"
    });
    dict.push({
        key:   "VBN",
        value: "verb, past part",
        color: "#049572"
    });                                            
    dict.push({
        key:   "VBP",
        value: "Verb, present",
        color: "#660162"
    });
    dict.push({
        key:   "VBZ",
        value: "Verb, present",
        color: "#7c4454"
    });
    dict.push({
        key:   "WDT",
        value: "Wh-determiner",
        color: "#f7986c"
    });
    dict.push({
        key:   "WP",
        value: "Wh pronoun",
        color: "#75e3c4"
    });
    dict.push({
        key:   "WP$",
        value: "Possessive-Wh",
        color: "#b1bb4c"
    });
    dict.push({
        key:   "WRB",
        value: "Wh-adverb",
        color: "#8f080a"
    });
    dict.push({
        key:   ",",
        value: "Comma"
    });
    dict.push({
        key:   ".",
        value: "Sent-final punct"
    });
    dict.push({
        key:   ":",
        value: "Mid-sent punct."
    });
    dict.push({
        key:   "$",
        value: "Dollar sign"
    });
    dict.push({
        key:    "#",
        value: "Pound sign"
    });
    dict.push({
        key:   "keyName",
        value: "the value"
    });
    dict.push({
        key:   '"',
        value: "quote"
    });
    dict.push({
        key:   "(",
        value: "Left paren"
    });
    dict.push({
        key:   ")",
        value: "Right paren"
    });
    dict.push({
        key:   ";",
        value: "Semicolon"
    });
    return dict;
}

// Get tag value
function posTagsMapper(tag){
    var dict = getTagDict();
    var mapping = dict.find(function(el){
        if(el.key == tag)
            return true;
    })
    return mapping.value;           
}
// Get tag color
function getMappedColor(tag){
    var dict = getTagDict();
    var mapping = dict.find(function(el){
        if(el.key == tag)
            return true;
    });
    if(typeof mapping === "undefined"){
        return "#000000";
    }

    return mapping.color; 
}

// Get all tag colors
function getAllColorMappings(){
    var mappings = [];
    var dict = getTagDict();
    dict.forEach(function(element, index){
        if(typeof element.color !== "undefined"){
            var colorObject = {
                color : element.color
            };
            mappings.push(colorObject);
        }
    })

    return mappings;
}