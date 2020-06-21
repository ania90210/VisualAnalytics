var firstWord ="";
var beginWordTreeWord = "";
var currentType = '';
var inputs;
var results = []; // array for storing results
var chart = null;
var sentiments = []

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
                sentiments = data;
                handleFile();
            }
        })
    });
});

function draw() {
    google.charts.load('current', {packages:['wordtree']});
    google.charts.setOnLoadCallback(drawChart);
}

function drawChart() {
    var substrings = results[0].split('.')
    var finalArray = [['phrase', {role: 'style'}]];
    if(firstWord === "") {
        firstWord = substrings[0].split(" ")[0];
    }

    // filter empty sentences
    finalArray = finalArray.filter(function(e){
        return e;
    }); 

    substrings.forEach((element, index) => {
        finalArray.push([element + '.', mapSentimentToColor(sentiments[index].comparative)]);   
    });
    var data = google.visualization.arrayToDataTable(finalArray);

    var options = {
        wordtree: {
            format: 'implicit',
            type: currentType,
            word: firstWord
        },
        width : 7000,
        maxFontSize: 24,
        tooltip: {
            isHtml: true
        }
    };

    var x = document.getElementById('wordtree_basic')
    if(x.innerHTML != "")
        x.innerHTML = "";

    chart = new google.visualization.WordTree(document.getElementById('wordtree_basic'));
    google.visualization.events.addListener(chart, 'select', selectHandler);
    chart.draw(data, options);
    this.dosth();
}

function selectHandler() {
    $("text").on("dblclick", function(d,i) { 
        var word = $(d.target)[0].innerHTML;
        if(word != firstWord) {
            firstWord = word;
            draw();
        }   
    })
}

function handleFile() {
    var inputCount;
    var filesLoaded = 0;
    inputs = [document.getElementById('fileselect')];
    if(inputs[0].files[0].size > 100000) {
        alert("File is too big. Limit is 100KB");
        return;
    }

    inputCount = Number(inputs.length);
    for (var i = 0; i < inputCount ; i++) {
        if (inputs[i].files && inputs[i].files[0]) {
            var FR = new FileReader();
            FR.onload = function (event) {
                firstWord = '';
                document.getElementById('textoverview').textContent = this.result;
                results = [];
                chart = null;
                results.push(event.target.result);
                filesLoaded++;
                if (filesLoaded == inputCount) {
                    result = results;
                }
                
                draw();
            };
            FR.readAsText(inputs[i].files[0]);
        }
    }
}

function dosth() {
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
    
    $(".word").on("click", function() {
        var selectedWord = this.textContent.replace(/\./g, '');
        if(selectedWord != firstWord) {
            firstWord = selectedWord;
            draw();
        }           
    });

    $("text").on("dblclick", function(d,i) { 
        var word = $(d.target)[0].innerHTML;
        if(word != firstWord) {
            firstWord = word;
            draw();
        }   
    })

    $('#search').on('keypress', function (e) {
        if(e.which === 13){
           $(this).attr("disabled", "disabled");
           searchWord();
           $(this).removeAttr("disabled");
        }
    });
    
    markSelectedWord(firstWord);
}

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

function searchWord() {
    var searchText = document.getElementById('search').value;
    firstWord = searchText.replace(/\./g, '');

    var weight = 0;
    var words2 = $("#textoverview").first().text().split(/(?=[.\s]|\b)/);
    words2.forEach(function(word) {
        if(searchText == word){
            weight++;
        }
    });
    tileBar(weight);
    
    draw();
}

function tileBar(weight) {
    if(currentType == '') {
        var tilebar = document.getElementById('tilebar'); 
        var wtext = document.getElementById('weight'); 
        wtext.innerHTML = weight;
        if(weight <= 1) tilebar.style.setProperty('--s', '100%');
        else if(weight > 1 && weight < 12 ) {
            var a = 100 - (10 * weight);
            tilebar.style.setProperty('--s', a+'%');
        }
        else if(weight >= 12) tilebar.style.setProperty('--s', '0%');
    }
}

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