
function draw() {
    google.charts.load('current', {packages:['wordtree']});
    google.charts.setOnLoadCallback(drawChart);
}

      function drawChart() {
        var substrings = results[0].split('.')
        var finalArray = [['Phrases']];
        substrings.forEach(element => {
            finalArray.push([element + '.']);   
        });
        var data = google.visualization.arrayToDataTable(finalArray
         
        );

        var options = {
          wordtree: {
            format: 'implicit',
            word: 'cats',
            fontName: 'Times-Roman'
          }
        };

        var chart = new google.visualization.WordTree(document.getElementById('wordtree_basic'));
        chart.draw(data, options);
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