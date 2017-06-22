window.addEventListener('load', loadQuestions, false);
var xhttp;
function loadQuestions() {
    xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var data = JSON.parse(xhttp.responseText);
            for(var i = 0; i < data.questions.length; i++) {
                questions.push(new Question(data.questions[i].questionString,
                                            data.questions[i].correctOption,
                                            data.questions[i].incorrectOption1,
                                            data.questions[i].incorrectOption2,
                                            data.questions[i].incorrectOption3));
            }
        }
    };
    xhttp.open("GET", "questions.json");
    xhttp.send();
}
