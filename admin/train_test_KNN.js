const videoElement = document.getElementById("camera_feed");
const canvasElement = document.getElementById("canvas");
const canvasCtx = canvasElement.getContext("2d");
const menuHolder = document.getElementById("menu_holder");
const outputConsole = document.getElementById("dev_console");
const outputLetter = document.getElementById("predicted_letter");
const out = document.getElementById("out");

let brain;
let gestureName = menuHolder.querySelector("#gesture_name");
let collecting = false;

const SAMPLE_COUNT = 100;
let currentCount = 0;

const appStatus = {
    brainLoaded: "KNN Model Loaded!",
    idle: "Ready to collect",
    collecting: "Sample Collected: "
}

function setup() {
	noCanvas();
    brain = ml5.KNNClassifier();
    brain.load('./model/testingKNN.json').then(() => 
    updateOutputConsole(appStatus.brainLoaded))

    const containerDiv = createDiv();
    const collectDataBtn = createButton('Collect Data');
    collectDataBtn.parent(containerDiv);
    containerDiv.parent(menuHolder)
    collectDataBtn.mousePressed(startCollecting);
}

function keyPressed(){
    if (keyCode == 9){ //TAB
        brain.save();
    }
    if(keyCode == 27){ //ESC
        camera.stop();
    }
    if(keyCode == 17){ //CTRL
        startCollecting();
    }
}

function startCollecting(){
    collecting = true;
}


const decimalAccuracy = 2;
function showOut(results, out){
    if (results.multiHandWorldLandmarks) {
        for (const landmarks of results.multiHandWorldLandmarks) {
            let outs = [];
            for(const landmark of landmarks){
                outs.push([landmark.x, landmark.y, landmark.z]);
            }
            out.innerHTML = outs.map(ele => ele.map(x => x.toFixed(decimalAccuracy)).join(" ")).join('<br/>');
        }
    }
}

function onResults(results) {
    // console.log(results);
	drawHand(results);
    showOut(results, out);
    if(collecting){
        updateOutputConsole(appStatus.collecting + ` ${currentCount}/${SAMPLE_COUNT}`);
        if(currentCount >= SAMPLE_COUNT){
            currentCount = 0;
            collecting = false;
        }
        //multiHandWorldLandmarks
        if (results.multiHandWorldLandmarks) {
            for (const landmarks of results.multiHandWorldLandmarks) {
                let inputs = [];
                let output = gestureName.value;
                for(const landmark of landmarks){
                    inputs.push(landmark.x);
                    inputs.push(landmark.y);
                    inputs.push(landmark.z);
                }
                brain.addExample(inputs, output);
                currentCount++;
            }
        }
    } else {
        if (results.multiHandWorldLandmarks) {
            for (const landmarks of results.multiHandWorldLandmarks) {
                let inputs = [];
                // let output = gestureName.value;
                for(const landmark of landmarks){
                    inputs.push(landmark.x);
                    inputs.push(landmark.y);
                    inputs.push(landmark.z);
                }
                brain.classify(inputs).then(res => {
                    const label = Object.entries(res.confidencesByLabel)
                    .find(([k,v]) => v==1)
                    if (!label) return
                    updateOutputLetter(label !== undefined && label[0]);
                });
            }
        }
        updateOutputConsole(appStatus.idle);
    }
}

function drawHand(results) {
	canvasCtx.save();
	canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
	canvasCtx.drawImage(
		results.image,
		0,
		0,
		canvasElement.width,
		canvasElement.height
	);
	if (results.multiHandLandmarks) {
		for (const landmarks of results.multiHandLandmarks) {
			drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
				color: "#00FF00",
				lineWidth: 5,
			});
			drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 2 });
		}
	}
	canvasCtx.restore();
}

function updateOutputConsole(text){
    outputConsole.innerHTML = text;
}
function updateOutputLetter(text){
    outputLetter.innerHTML = text;
}

const hands = new Hands({
	locateFile: (file) => {
		return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
	},
})
hands.setOptions({
	maxNumHands: 2,
	modelComplexity: 1,
	minDetectionConfidence: 0.8,
	minTrackingConfidence: 0.8,
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
	onFrame: async () => {
		await hands.send({ image: videoElement });
	},
	width: 480,
	height: 480,
});
camera.start();
