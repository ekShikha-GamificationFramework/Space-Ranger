window.addEventListener('load', init, false);
var SCORE = 0;

//three js scene and camera
var scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane,
    HEIGHT, WIDTH, renderer, container;
var worldLeft = -30, worldRight = 30;

//for timings
var then;

var requestID;

//lights
var hemisphereLight, shadowLight, ambientLight;

var Colors = [
    0xf25346,
    0xd8d0d1,
    0x59332e,
    0xF5986E,
    0x23190f,
    0x68c3c0];

//game objects
var loadingManager;
var cars = [];
var carScaleFactor = 500;
//var carDistanceFactor =
var carGeom;
var carMat = [null, null, null, null];
var playerCar;  //number of player's car - {0, 1, 2, 3}
var smarty, average, idiot;    //random enemies
var answerTime = [3, 3, 3, 3];    //time took by computer cars to answer (in seconds)
var answerTimeRange = [1, 3];     //range between which the computer answers, e.g after every random(1, 4) seconds
var carReady = [false, false, false, false];
var accelerations = [0, 0, 0, 0];  //accelerations of all cars
var defaultSpeed = 100;
var speedUp = 50, speedDown = -30;
var stars = [];
var starCount = 100;
var checkerBoard;

var startTime;
var lastAnsweredTime = [];
var showingMenu = true;
var cameraOffset = 40;   //Camera's distance from player's car

//set of questions
var questions = [];
questions.push(new Question("What is 7 + 1 = ?", "8", "9", "10", "6"));
questions.push(new Question("What is 8 / 2 = ?", "4", "5", "6", "9"));
questions.push(new Question("What is 3 X 2 = ?", "6", "5", "1", "9"));
questions.push(new Question("What is 5 - 2 = ?", "3", "50", "11", "7"));
questions.push(new Question("What is 10 X 10 = ?", "100", "50", "110", "901"));
var currentQuestion;


function init(event) {

    loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
        //console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    };
    loadingManager.onStart = function ( url, itemsLoaded, itemsTotal ) {
    	//console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    };
    loadingManager.onLoad = function ( ) {
    	console.log( 'Loading complete!');
        createCars();
    };
    loadingManager.onError = function ( url ) {
    	console.log( 'There was an error loading ' + url );
    };

    //set up the scene, the camera and the renderer
    createScene();

    //add the light
    createLights();

    //add the objects
    loadCars();
    createRoad();
    createStars();
    createCheckerBoard();

    //add the listener
    //document.body.addEventListener('onkeyup', onkey, false);
    //playerCar = 2;

    //show menu
    showMenu();

    //show first question
    //showQuestion();

    //start a loop that will update the objects' positions
    //and render the scene on each frame
    then = Date.now();
    loop();
}

function loop() {

    var now = Date.now();
    var delta = now - then;

    //update everything
    if(showingMenu) {
        rotateCars();
    } else {
        updateCars(delta);
        updateCamera();
        updateStars();
        document.getElementById("time").innerHTML = "TIME: " + Math.floor((Date.now() - startTime)/1000) + "s";
    }

    //render the scene
    renderer.render(scene, camera);

    then = now;
    //console.log(1000/delta + " fps");

    // call the loop function again
    requestID = requestAnimationFrame(loop);
}

function updateCars(delta) {

    //provide random accelerations to computer vehicles
    var c;
    for(var i = 0; i < 4; i++) {
        if(i == playerCar) continue;
        if(Date.now() - lastAnsweredTime[i] > answerTime[i] * 1000) {
            switch (i) {
                case smarty:
                    //gives correct answer 90% of time
                    c = Math.floor(Math.random() * 10);
                    if(c == 0)
                        accelerations[i] = speedDown;
                    else
                        accelerations[i] = speedUp;
                    //this vehicle will give next answer in some random(specified in answerTimeRange) seconds later
                    answerTime[i] = Math.random()*answerTimeRange[1] + answerTimeRange[1] - answerTimeRange[0];
                    break;
                case average:
                    //gives correct answer 75% of time
                    c = Math.floor(Math.random() * 4);
                    if(c == 0)
                        accelerations[i] = speedDown;
                    else
                        accelerations[i] = speedUp;
                    //this vehicle will give next answer in some random(specified in answerTimeRange) seconds later
                    answerTime[i] = Math.random()*answerTimeRange[1] + answerTimeRange[1] - answerTimeRange[0];
                    break;
                case idiot:
                    //gives correct answer 50% of time
                    c = Math.floor(Math.random() * 2);
                    if(c == 0)
                        accelerations[i] = speedDown;
                    else
                        accelerations[i] = speedUp;
                    //this vehicle will give next answer in some random(specified in answerTimeRange) seconds later
                    answerTime[i] = Math.random()*answerTimeRange[1] + answerTimeRange[1] - answerTimeRange[0];
                    break;
                default:
                    break;
            }
            lastAnsweredTime[i] = Date.now();
        }
    }

    var rate = 80;
    if(carReady[0] && carReady[1] && carReady[2] && carReady[3]) {
        if(delta >= 100) return;
        for(var i = 0; i < 4; i++) {
            cars[i].position.z -= (defaultSpeed + accelerations[i] + Math.random()*4) * delta / 1000;
            cars[i].position.y += ((Math.random()*4) - 2) * delta / 1000;
            if(accelerations [i] > 0) {
                accelerations[i] -= rate * delta / 1000;
                if(accelerations[i] < 0)
                    accelerations[i] = 0;
            }
            else if(accelerations[i] < 0) {
                accelerations[i] += rate * delta / 1000;
                if(accelerations[i] > 0)
                    accelerations[i] = 0;
            }
        }
    }
}

function rotateCars() {
    for(var i = 0; i < 4; i++) {
        if(carReady[i]) {
            cars[i].rotation.y -= 0.02;
        }
    }
}

function updateCamera() {
    if(carReady[playerCar]) {
        var targetPos = cars[playerCar].position.z + cameraOffset;
        var currentPos = camera.position.z;
        //camera.position.z += (targetPos - currentPos)/4;
        camera.position.z = targetPos;
    }
}

function clicked(option) {

    if(showingMenu) {
        switch (option.innerHTML) {
            case "Red":
                playerCar = 0;
                break;
            case "Yellow":
                playerCar = 1;
                break;
            case "Blue":
                playerCar = 2;
                break;
            case "Green":
                playerCar = 3;
                break;
            default:
        }
        //assign enemy cars
        var ar = [0, 1, 2, 3];
        ar.splice(ar.indexOf(playerCar), 1);
        smarty = ar[Math.floor(Math.random()*ar.length)];
        ar.splice(ar.indexOf(smarty), 1);
        average = ar[Math.floor(Math.random()*ar.length)];
        ar.splice(ar.indexOf(average), 1);
        idiot = ar[Math.floor(Math.random()*ar.length)];
        ar.splice(ar.indexOf(idiot), 1);

        showingMenu = false;

        document.getElementById("time").innerHTML = "TIME: " + 0;
        SCORE = 0;
        document.getElementById("score").innerHTML = "SCORE: " + SCORE;
        document.getElementById("middle").innerHTML = "";
        cancelAnimationFrame(requestID);
        //reset cars' rotation
        for(var i = 0; i < 4; i++) {
            cars[i].rotation.y = Math.PI;
        }
        //reset checkerboard position
        checkerBoard.position.set(0, 0, -20);
        renderer.render(scene, camera);
        setTimeout(displayStart, 100);
        return;
    }

    // TODO: don't repeat questions
    if(option.innerHTML == currentQuestion.correctOption) {
        accelerations[playerCar] = speedUp;
        //increase score
        SCORE += 2;
        document.getElementById("score").innerHTML = "SCORE: " + SCORE;
    } else {
        accelerations[playerCar] = speedDown;
        //decrease score
        SCORE -= 1;
        document.getElementById("score").innerHTML = "SCORE: " + SCORE;
    }
    //document.getElementById("question").classList.toggle('question-close');
    //setTimeout(showQuestion, 1000);
    showQuestion();
}

function displayStart() {
    switch (document.getElementById("middle").innerHTML) {
        case "3":
            document.getElementById("middle").innerHTML = "2";
            setTimeout(displayStart, 1000);
            break;
        case "2":
            document.getElementById("middle").innerHTML = "1";
            setTimeout(displayStart, 1000);
            break;
        case "1":
            document.getElementById("middle").innerHTML = "GO";
            setTimeout(beforeStartingMainLoop, 500);
            break;
        default:
            document.getElementById("middle").innerHTML = "3";
            setTimeout(displayStart, 1000);
            break;
    }
}

function beforeStartingMainLoop() {
    startTime = Date.now();
    for(i = 0; i < 4; i++) {
        lastAnsweredTime[i] = startTime;
    }
    showQuestion();
    document.getElementById("middle").innerHTML = "";
    loop();
}

//Question constructor
function Question(questionString, correctOption, incorrectOption1, incorrectOption2, incorrectOption3) {
    this.questionString = questionString;
    this.correctOption = correctOption;
    this.incorrectOptions = [incorrectOption1, incorrectOption2, incorrectOption3];
}
function showQuestion() {
    //console.log(document.getElementById("question").classList);
    //document.getElementById("question").classList.toggle('question-open');
    var index = Math.floor(Math.random() * questions.length);
    document.getElementById("question").innerHTML = questions[index].questionString;
    var randomOption = Math.floor(Math.random()*4);
    for(var i = 0, j = 0; i < 4; i++) {
        if(randomOption == i)
            document.getElementById("option" + (i+1)).innerHTML = questions[index].correctOption;
        else {
            document.getElementById("option" + (i+1)).innerHTML = questions[index].incorrectOptions[j];
            j++;
        }
    }
    currentQuestion = questions[index];
}
function showMenu() {
    document.getElementById("question").innerHTML = "Select Vehicle:";
    document.getElementById("option1").innerHTML = "Red";
    document.getElementById("option2").innerHTML = "Blue";
    document.getElementById("option3").innerHTML = "Yellow";
    document.getElementById("option4").innerHTML = "Green";
}

function loadCars() {
    var loader = new THREE.JSONLoader(loadingManager);
    loader.load("models/plane.js", function(geometry, materials) {
        carMat[0] = new THREE.MultiMaterial(materials);
        carGeom = geometry;
    })
    var imgLoader1 = new THREE.TextureLoader(loadingManager);
    imgLoader1.load('models/space_ship_test_color_yellow.png', function(txt) {
        carMat[1] = new THREE.MeshBasicMaterial({map: txt});
    });
    var imgLoader2 = new THREE.TextureLoader(loadingManager);
    imgLoader2.load('models/space_ship_test_color_blue.png', function(txt) {
        carMat[2] = new THREE.MeshBasicMaterial({map: txt});
    });
    var imgLoader3 = new THREE.TextureLoader(loadingManager);
    imgLoader3.load('models/space_ship_test_color_green.png', function(txt) {
        carMat[3] = new THREE.MeshBasicMaterial({map: txt});
    });
}

function createCars() {
    for(var i = 0; i < 4; i++) {
        cars[i] = new THREE.Mesh(carGeom, carMat[i]);
        scene.add(cars[i]);
        carReady[i] = true;
        cars[i].rotation.y = Math.PI;
        cars[i].position.x = -(WIDTH/45) + (WIDTH/75)*i;
        cars[i].scale.set(WIDTH/carScaleFactor, WIDTH/carScaleFactor, WIDTH/carScaleFactor);
    }
}

function createRoad() {

}

function createStars() {
    var starGeom = new THREE.SphereGeometry(0.05);
    var starMat = new THREE.MeshPhongMaterial({color: 0xffffff});
    for(var i = 0; i < starCount; i++) {
        var star = new THREE.Mesh(starGeom, starMat);
        star.position.x = Math.random() * (Math.abs(worldLeft) + Math.abs(worldRight)) - Math.abs(worldRight);
        star.position.z = -Math.random() * 100;
        star.position.y = Math.random() * 50;
        scene.add(star);
        stars.push(star);
    }
}
function updateStars() {
    for(var i = 0; i < starCount; i++) {
        if(stars[i].position.z > camera.position.z) {
            stars[i].position.x = Math.random() * (Math.abs(worldLeft) + Math.abs(worldRight)) - Math.abs(worldRight);
            stars[i].position.z = -Math.random() * 100 + camera.position.z;
            stars[i].position.y = Math.random() * 50;
        }
    }
}
function createCheckerBoard() {
    // Geometry
    var cbgeometry = new THREE.PlaneGeometry(worldRight*2 + 20, 15, 8, 3);
    // Materials
    var cbmaterials = [];
    cbmaterials.push(new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.DoubleSide }));
    cbmaterials.push(new THREE.MeshBasicMaterial( { color: 0x000000, side: THREE.DoubleSide }));
    var l = cbgeometry.faces.length / 2;
    for(var i = 0; i < l; i++) {
        j = i * 2;
        cbgeometry.faces[j].materialIndex = ((i + Math.floor(i/8)) % 2);
        cbgeometry.faces[j+1].materialIndex = ((i + Math.floor(i/8)) % 2);
    }
    // Mesh
    checkerBoard = new THREE.Mesh( cbgeometry, new THREE.MeshFaceMaterial( cbmaterials ) );
    scene.add(checkerBoard);
    checkerBoard.rotation.x = Math.PI/2;
    checkerBoard.position.set(100, 100, 100); //somewhere far away
}
function createScene() {
    //Get the width and height of the screen,
    //use them to set up the aspect ratio of the camera
    //and the size of the renderer.
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    //create the scene
    scene = new THREE.Scene();

    //Add a fog effect to the scene; same color as the
    //background color used in the style sheet
    scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

    //create the camera
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 60;
    nearPlane = 1;
    farPlane = 10000;
    camera = new THREE.PerspectiveCamera(
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane
    );

    //set the position of the camera
    camera.position.x = 0;
    camera.position.z = cameraOffset;
    camera.position.y = 20;
    camera.rotation.x = -Math.PI/8;

    //create the renderer
    renderer = new THREE.WebGLRenderer( {
        //Allow transparency to show the gradient background
        //we defined in CSS
        alpha: true,

        //Activate the anti-aliasing; this is less performant,
        //but, as the project is low-poly based, it should be fine.
        antialias: true
    });

    //Define the size of the renderer; in this case,
    //it will fill the entire screen
    renderer.setSize(WIDTH, HEIGHT);

    //Enable shadow rendering
    renderer.shadowMap.enabled = true;

    //Add the DOM element of the renderer to the
    //container we created in the HTML
    container = document.getElementById('world');
    container.appendChild(renderer.domElement);

    //Listen to the screen: if the user resizes it
    //we have to update the camera and the renderer size
    window.addEventListener('resize', handleWindowResize, false);
}
function handleWindowResize() {
    //update height and width of the renderer and the camera
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();

    for(var i = 0; i < 4; i++) {
        if(carReady[i])
            cars[i].position.x = -(WIDTH/45) + (WIDTH/75)*i;
            cars[i].scale.set(WIDTH/carScaleFactor, WIDTH/carScaleFactor, WIDTH/carScaleFactor);
    }
}

function createLights() {
    // A hemisphere light is a gradient colored light;
    // the first parameter is the sky color, the second parameter is the ground color
    // the third parameter is the intensity of light
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9);

    // A directional light shines from a specific direction.
    // It acts like a sun, that means that all the rays produced are parallel.
    shadowLight = new THREE.DirectionalLight(0xffffff, .9);

    // Set the directional light
    shadowLight.position.set(150, 350,350);

    // Allow shadow casting
    shadowLight.castShadow = true;

    // define the visible area of the projected shadow
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    // define the resolution of the shadow; the higher the better,
    // but also the more expensive and less performant
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    //an ambient light modifies the global color of a scene and make the shadows softer
    ambientLight = new THREE.AmbientLight(0xdc8874, .5);

    // to activate the lights, just add them to the scene
    scene.add(hemisphereLight);
    scene.add(shadowLight);
    scene.add(ambientLight);
}
