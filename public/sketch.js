//partially from @MOQN sample code of socket.io
let canva1;
let mask1;

let userName = "anonymous";
let partyCode = 'default';
let socket;

let classifier;
let currentImg;

let video;
let label = "Choose a camera first👆";

let cameraSelect;

let openai_api_proxy = "https://zest-quiet-phalange.glitch.me/";
let openai_api_params = {
    model: "gpt-3.5-turbo",
    messages: [
        {
            role: "user",
            content: "Say this is a test!",
        },
    ],
    temperature: 0.7,
};
let openai_result;
let opennai_lock = false;

let comfy, workflow, comfy_result;

// Import Matter.js components
let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies;
Events = Matter.Events;

let engine, world; // Engine and world objects
let ground, leftWall, rightWall; // Ground and wall objects
let boxes = [];

//gyroscope
let permissionGranted = false;
let cx, cy;
let gyroGravity;

const vibrateDetected = window.navigator.vibrate || window.navigator.webkitVibrate || window.navigator.mozVibrate || window.navigator.msVibrate;
let canVibrate = false;
let vibrated = false;

function preload() {
    classifier = ml5.imageClassifier("MobileNet");
    workflow = loadJSON("workflow.json");
    updateUserData();
    if (vibrateDetected) {
        canVibrate = true;
    }
}

function setup() {
    canva1 = createCanvas(windowWidth, windowHeight);
    videoWidth = canva1.width * 0.96;
    videoHeight = canva1.width * 1.2;
    videoPTx = canva1.width * 0.03;
    videoPTy = canva1.height * 0.15;

    mask1 = createGraphics(windowWidth, windowHeight);
    mask1.background(10);
    mask1.erase();
    mask1.rect(videoPTx, 0, videoWidth - 10, videoHeight, 0, 0, 50, 50);
    mask1.noErase();
    mask1.fill(255);
    mask1.stroke(0);
    mask1.strokeWeight(0.5);
    for (let i = 0; i < 18; i++) {
        mask1.rect(videoPTx + videoWidth - 30, 10 + i * (videoHeight / 20), 21, 2);
    }
    for (let i = 0; i < 4; i++) {
        mask1.rect(videoPTx + videoWidth - 60, 10 + i * (videoHeight / 4), 51, 2);
    }

    canva1.parent("p5sketch");

    comfy = new ComfyUiP5Helper("https://gpu1.gohai.xyz:8188");
    console.log("workflow is", workflow);

    socket = io.connect();
    console.log(socket);

    // receive
    socket.on("connection_name", receiveViaSocket);

    setInterval(() => {
        classifyImg();
    }, 1000);

    // Create the engine and world
    engine = Engine.create();
    world = engine.world;

    ground = Bodies.rectangle(width / 2, videoHeight + videoPTy + 20, width, 40, { isStatic: true });
    leftWall = Bodies.rectangle(videoPTx - 10, height / 2, 20, height, { isStatic: true });
    rightWall = Bodies.rectangle(videoPTx + videoWidth, height / 2, 20, height, { isStatic: true });
    // Add the box to the world
    World.add(world, ground);
    World.add(world, leftWall);
    World.add(world, rightWall);


    //gyroscope 
    // DeviceOrientationEvent, DeviceMotionEvent
    if (typeof (DeviceOrientationEvent) !== 'undefined' && typeof (DeviceOrientationEvent.requestPermission) === 'function') {
        // ios 13 device
        DeviceOrientationEvent.requestPermission()
            .catch(() => {
                // show permission dialog only the first time
                let button = createButton("click to allow access to sensors");
                button.style("font-size", "24px");
                button.center();
                button.mousePressed(requestAccess);
                throw error;
            })
            .then(() => {
                permissionGranted = true;
            })
    } else {
        // non ios 13 device
        permissionGranted = true;
    }

    //vibrate the phone
    //vibrate
    Events.on(engine, 'collisionStart', function (event) {
        let pairs = event.pairs;
        // change object colours to show those starting a collision
        for (let i = 0; i < pairs.length; i++) {
            //     // vibrate the phone
            if (canVibrate) {
                navigator.vibrate(20);
            }
            // console.log(canVibrate);
        }

    });

    setupFinished();
}

function draw() {
    background(10);
    if (video) {
        image(video, videoPTx, videoPTy, videoWidth, videoHeight);
    }
    // Printing class with the highest probability on the canvas

    fill(255);
    textSize(20);
    text("THIS IS:", canva1.width * 0.05, canva1.height * 0.05);
    textSize(30);
    text(label, canva1.width * 0.05, canva1.height * 0.12);

    push();
    // Update the physics engine
    for (let box of boxes) {
        if (box.alive) {
            box.update();
            box.display();
        } else {
            boxes.splice(boxes.indexOf(box), 1);
        }
    }
    Engine.update(engine);
    pop();
    getGyro();

    image(mask1, 0, videoPTy - 1);

    // if (mixing) {
    //     background(255);
    //     textSize(20);
    //     textAlign(LEFT, LEFT);
    //     text("Mixing...", canva1.width / 2, canva1.height / 2);
    // }
    // text(containObjectList, 10, 100);
}

function classifyImg() {
    //save the current video as an image
    if (video) {
        currentImg = video.get();
        classifier.classify(currentImg, gotResultClassifier);
    }
}

function requestAccess() {
    DeviceOrientationEvent.requestPermission()
        .then(response => {
            if (response == 'granted') {
                permissionGranted = true;
            } else {
                permissionGranted = false;
            }
        })
        .catch(console.error);
    this.remove();
}

function cameraChanged(deviceId) {
    console.log("cameraChangedStart!");
    if (video) {
        video.remove();
        // classifier.classifyStop();
    }
    const constraints = {
        video: {
            deviceId: deviceId
        },
        audio: false
    };

    // Use the selected camera as video input
    video = createCapture(constraints, () => {
        video.size(480, 640);
        video.hide();
        // classifier.classifyStart(video, gotResultClassifier);
    });
}

function getGyro() {
    if (permissionGranted) {
        // const dx = constrain(rotationY, -3, 3);
        // const dy = constrain(rotationX, -3, 3);
        let dx = rotationY * 3;
        let dy = rotationX * 3;
        engine.world.gravity.x = dx;
        engine.world.gravity.y = dy;
        // engine.world.gravity.y = -1;
        // text(accelerationX, 10, 100);
        // text(accelerationY, 10, 120);
        // text(accelerationZ, 10, 140);
        detectShake();
    }
}

function detectShake() {
    let threshold = 100;
    let x = accelerationX;
    let y = accelerationY;
    let z = accelerationZ;
    let total = Math.abs(x) + Math.abs(y) + Math.abs(z);
    if (total > threshold && rotationY < rotationX * 10) {
        if (!vibrated) {
            if (canVibrate) {
                navigator.vibrate(500);
            }
            vibrated = true;
            mixButton.click();
            setTimeout(() => {
                vibrated = false; // Reset the flag after 1 second
            }, 1000);
        }
    }
}

function receiveViaSocket(data) {
    if (data.name == "send recognition" && data.partycode == partyCode && partyCode != '') {
        //merge the data.object and containObjectList
        boxes.push(new ContainBox(data.object[0], data.image, true));
        // console.log(containObjectList);
    }
}

// function sendToOpenAI(){
//     sendOpenAIRequest();
// }

function sendItem(object, name) {
    data = {
        name: 'send recognition',
        object: [name],
        username: userName,
        partycode: partyCode
    };
    socket.emit("connection_name", data);
    console.log(name + "sent!");
    // containObjectList = [];
    object.alive = false;
}

//classifier receive
function gotResultClassifier(results) {
    label = results[0].label.split(",")[0];
}

//openAI send and receive
function sendOpenAIRequest(prompt) {
    console.log("OpenAI request received:" + prompt);
    openai_api_params.messages[0].content = prompt;
    requestOAI("POST", "/v1/chat/completions", openai_api_params, gotResultOpenAI);
    console.log("openai request sent!");
}

async function gotResultOpenAI(results) {
    console.log("openai result received!");
    opennai_lock = false;
    openai_result = results.choices[0].message.content.split(";");
    //sperate the word and sentence
    document.getElementById("openaiResult").innerHTML = openai_result[1];
    console.log(openai_result);
    // containObjectList[0][0] = openai_result[0];
    // boxes.push(new ContainBox(openai_result[0]));
    updateTable();
    await requestImageComfy(openai_result[1]);
    return results;
}

//comfyUI send and receive
async function requestImageComfy(prompt) {
    // replace the prompt
    workflow[6].inputs.text = prompt;
    workflow[3].inputs.seed = Math.floor(Math.random() * 1000000);
    const test = await comfy.run(workflow, gotImageComfy);
    console.log(test);
    console.log("comfy request sent!");
}

async function gotImageComfy(data, err) {
    // data is an array of outputs from running the workflow
    mixing = false;
    loadingDiv.style.display = "none";
    console.log("gotImage", data);
    if (data.length > 0) {
        // comfy_result = loadImage(data[0].src);
    }
    boxes.push(new ContainBox(openai_result[0], data[0].src, true));
    comfyImage.src = data[0].src;
    testDataVisible();
    document.getElementById("popup-images").click();

}

class ContainBox {
    constructor(name, img, isDataURL = false) {
        this.name = name;
        this.size = canva1.width * 0.05 + canva1.width * 0.02 * name.length;
        this.scale = 0;
        this.x = random(canva1.width * 0.2, canva1.width * 0.8);
        this.y = canva1.height * 0.10;
        this.alive = true;
        this.isDataURL = isDataURL;
        if (isDataURL) {
            this.image = loadImage(img);
            this.url = img;
        } else {
            this.image = img;
            this.url = null;
        }
        this.color = color(random(255), random(255), random(255), 100);
        this.box = Bodies.rectangle(this.x, this.y, this.size, this.size);
        World.add(world, this.box);
    }

    display() {
        push();
        rectMode(CENTER);
        textAlign(CENTER, CENTER)
        translate(this.box.position.x, this.box.position.y);
        rotate(this.box.angle);
        scale(this.scale);
        fill(255);
        stroke(0);
        rect(0, 0, this.size, this.size);
        if (this.image) {
            image(this.image, -this.size / 2, -this.size / 2, this.size, this.size);
        }
        fill(this.color);
        rect(0, 0, this.size, this.size);
        rotate(-this.box.angle);
        fill(255)
        textSize(15);
        text(this.name, 0, 0);
        pop();
    }

    update() {
        if (this.box.position.y < -10) {
            let data_url = null;
            if (this.image && this.isDataURL) {
                //load this.image to an extraCanvas
                if (this.image.width > 5) {
                    let extraCanvas = createGraphics(128, 128);
                    extraCanvas.image(this.image, 0, 0, 128, 128);
                    extraCanvas.loadPixels();
                    data_url = extraCanvas.canvas.toDataURL();
                }
                // console.log(data_url);
            } else {
                if (this.image && this.image.loadPixels) {
                    this.image.loadPixels();
                    data_url = this.image.canvas.toDataURL();
                }
            }

            let data = {
                name: 'send recognition',
                object: [this.name, userName],
                image: data_url,
                username: userName,
                partycode: partyCode
            };
            console.log(data);

            //emit if the socket is connected
            while (!socket.connected) {
                socket = io.connect();
            }

            socket.emit("connection_name", data);
            console.log(this.name + "sent!");
            this.remove();
        }

        if (this.scale < 0.99) {
            this.scale = lerp(this.scale, 1, 0.1);
        }
    }

    remove() {
        World.remove(world, this.box);
        this.alive = false;
    }


}

/* global
io p5 ml5 Stats dat alpha blue brightness color green hue lerpColor lightness red saturation background clear colorMode fill noFill noStroke stroke erase noErase 2D Primitives arc ellipse circle line point quad rect square triangle ellipseMode noSmooth rectMode smooth strokeCap strokeJoin strokeWeight bezier bezierDetail bezierPoint bezierTangent curve curveDetail curveTightness curvePoint curveTangent beginContour beginShape bezierVertex curveVertex endContour endShape quadraticVertex vertex plane box sphere cylinder cone ellipsoid torus loadModel model HALF_PI PI QUARTER_PI TAU TWO_PI DEGREES RADIANS print frameCount deltaTime focused cursor frameRate noCursor displayWidth displayHeight windowWidth windowHeight windowResized width height fullscreen pixelDensity displayDensity getURL getURLPath getURLParams remove disableFriendlyErrors noLoop loop isLooping push pop redraw select selectAll removeElements changed input createDiv createP createSpan createImg createA createSlider createButton createCheckbox createSelect createRadio createColorPicker createInput createFileInput createVideo createAudio VIDEO AUDIO createCapture createElement createCanvas resizeCanvas noCanvas createGraphics blendMode drawingContext setAttributes boolean string number applyMatrix resetMatrix rotate rotateX rotateY rotateZ scale shearX shearY translate storeItem getItem clearStorage removeItem createStringDict createNumberDict append arrayCopy concat reverse shorten shuffle sort splice subset float int str byte char unchar hex unhex join match matchAll nf nfc nfp nfs split splitTokens trim deviceOrientation accelerationX accelerationY accelerationZ pAccelerationX pAccelerationY pAccelerationZ rotationX rotationY rotationZ pRotationX pRotationY pRotationZ turnAxis setMoveThreshold setShakeThreshold deviceMoved deviceTurned deviceShaken keyIsPressed key keyCode keyPressed keyReleased keyTyped keyIsDown movedX movedY mouseX mouseY pmouseX pmouseY winMouseX winMouseY pwinMouseX pwinMouseY mouseButton mouseWheel mouseIsPressed requestPointerLock exitPointerLock touches createImage saveCanvas saveFrames image tint noTint imageMode pixels blend copy filter THRESHOLD GRAY OPAQUE INVERT POSTERIZE BLUR ERODE DILATE get loadPixels set updatePixels loadImage loadJSON loadStrings loadTable loadXML loadBytes httpGet httpPost httpDo Output createWriter save saveJSON saveStrings saveTable day hour minute millis month second year abs ceil constrain dist exp floor lerp log mag map max min norm pow round sq sqrt fract createVector noise noiseDetail noiseSeed randomSeed random randomGaussian acos asin atan atan2 cos sin tan degrees radians angleMode textAlign textLeading textSize textStyle textWidth textAscent textDescent loadFont text textFont orbitControl debugMode noDebugMode ambientLight specularColor directionalLight pointLight lights lightFalloff spotLight noLights loadShader createShader shader resetShader normalMaterial texture textureMode textureWrap ambientMaterial emissiveMaterial specularMaterial shininess camera perspective ortho frustum createCamera setCamera ADD CENTER CORNER CORNERS POINTS WEBGL RGB ARGB HSB LINES CLOSE BACKSPACE DELETE ENTER RETURN TAB ESCAPE SHIFT CONTROL OPTION ALT UP_ARROW DOWN_ARROW LEFT_ARROW RIGHT_ARROW sampleRate freqToMidi midiToFreq soundFormats getAudioContext userStartAudio loadSound createConvolver setBPM saveSound getMasterVolume masterVolume soundOut chain drywet biquadFilter process freq res gain toggle setType pan phase triggerAttack triggerRelease setADSR attack decay sustain release dispose notes polyvalue AudioVoice noteADSR noteAttack noteRelease isLoaded playMode set isPlaying isPaused setVolume getPan rate duration currentTime jump channels frames getPeaks reverseBuffer onended setPath setBuffer processPeaks addCue removeCue clearCues getBlob getLevel toggleNormalize waveform analyze getEnergy getCentroid linAverages logAverages getOctaveBands fade attackTime attackLevel decayTime decayLevel releaseTime releaseLevel setRange setExp width output stream mediaStream currentSource enabled amplitude getSources setSource bands panner positionX positionY positionZ orient orientX orientY orientZ setFalloff maxDist rollof leftDelay rightDelay delayTime feedback convolverNode impulses addImpulse resetImpulse toggleImpulse sequence getBPM addPhrase removePhrase getPhrase replaceSequence onStep musicalTimeMode maxIterations synced bpm timeSignature interval iterations compressor knee ratio threshold reduction record isDetected update onPeak WaveShaperNode getAmount getOversample amp setInput connect disconnect play pause stop start add mult
*/
