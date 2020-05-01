function handleFile(){
    const file = document.getElementById("fileselect").files[0];
    var fr = new FileReader();
            fr.onload = function () {
                document.getElementById('textoverview').textContent = this.result;
            };
            fr.readAsText(file);
}