var firstWord ="";
var beginWordTreeWord = "";
var currentType = '';

function draw() {
    google.charts.load('current', {packages:['wordtree']});
    google.charts.setOnLoadCallback(drawChart);
}

function drawChart() {
    var substrings = results[0].split('.')
    var finalArray = [['Phrases']];
    if(firstWord === "") {
        firstWord = substrings[0].split(" ")[0];
    }

    finalArray = finalArray.filter(function(e){
        return e;
    }); 

    substrings.forEach(element => {
        finalArray.push([element + '.']);   
    });
    var data = google.visualization.arrayToDataTable(finalArray);

    var options = {
        wordtree: {
            format: 'implicit',
            type: currentType,
            word: firstWord
        }
    };

    var chart = new google.visualization.WordTree(document.getElementById('wordtree_basic'));
    chart.draw(data, options);

    this.dosth();
}

/*file inputs*/
var inputs;
var results = []; // array for storing results


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
                document.getElementById('textoverview').textContent = this.result;
                results.push(event.target.result);
                filesLoaded++;
                if (filesLoaded == inputCount) {
                    showResult();
                    result = results;
                }
            };
            FR.readAsText(inputs[i].files[0]);
        }
    }
    this.draw();
}

function showResult() {
    for (var i = 0; i < inputs.length ; i++) {
        console.log(results[i]);
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
    $(".word").on( "click", function() {
        firstWord = this.textContent.replace(/\./g, '');
        draw();
    });
    
    $('span').removeClass('yellow');
    $('span').removeClass('red');
    var wordSpans = $('.word:contains("'  + firstWord + '")').closest('span');
    wordSpans.addClass('red');
    var length  = wordSpans.length;
    for (var i=0; i<length; i++) {
        $(wordSpans[i]).nextUntil('span.dot').addClass('yellow');        
        $(wordSpans[i]).nextUntil('span.dot').next("span").addClass('yellow');   
    }
}

function searchWord() {
    var input, filter, ul, li, a, i, txtValue;
    input = document.getElementById('search');
    filter = input.value.toUpperCase();
    ul = document.getElementById("textoverview");
    span  = ul.getElementsByTagName('span');

    // Loop through all list items, and hide those who don't match the search query
    for (i = 0; i < span.length; i++) {
        txtValue = span[i].textContent || span[i].innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
        span[i].style.display = "";
        } else {
        span[i].style.display = "none";
        }
    }
}

$('input[type=radio][name=treetype]').change(function() {
    if (this.value === "prefix") {
        currentType = '';
    }
    else if (this.value === "suffix") {
        currentType = 'suffix';
    }
    else if (this.value === "double") {
        currentType = 'double';
    }
    drawChart();
});