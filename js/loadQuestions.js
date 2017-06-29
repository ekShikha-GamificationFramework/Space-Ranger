window.addEventListener('load', loadQuestions, false);
var xhttp;
function loadQuestions() {
    var urlParams = parseURLParams(window.location.href);
    var x = 1, y = 1;
    if(urlParams) {
        x = urlParams["x"][0];
        y = urlParams["y"][0];
    }
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
    xhttp.open("GET", "questions" + x + y + ".json");
    xhttp.send();
}

//function to parse the parameters passed in url
function parseURLParams(url) {
    var queryStart = url.indexOf("?") + 1,
        queryEnd   = url.indexOf("#") + 1 || url.length + 1,
        query = url.slice(queryStart, queryEnd - 1),
        pairs = query.replace(/\+/g, " ").split("&"),
        parms = {}, i, n, v, nv;

    if (query === url || query === "") return;

    for (i = 0; i < pairs.length; i++) {
        nv = pairs[i].split("=", 2);
        n = decodeURIComponent(nv[0]);
        v = decodeURIComponent(nv[1]);

        if (!parms.hasOwnProperty(n)) parms[n] = [];
        parms[n].push(nv.length === 2 ? v : null);
    }
    return parms;
}
