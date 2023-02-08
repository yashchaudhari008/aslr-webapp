// APP SETTINGS
const CAMERA_SIZE = 480/2;
const BUFFER_SIZE = 7;
const MIN_LETTER_REQ_IN_BUFFER = Math.floor((BUFFER_SIZE*3)/4)
const appStatus = { //TEMP
    starting: "App Starting, Please Wait",
    idle: "Idle",
}

// HTML ELEMENT REFERENCES
const videoElement = getElement("camera_feed"); 
const canvasElement = getElement("canvas");
const statusHolder = getElement("statusTable");
const predictedLetter = getElement("predicted_letter");
const predictedResult = getElement("predicted_result")

let brain;
let result = '';

let buffer = {};
let count = 0;

let HANDS_MODEL;

function setup() {
	noCanvas(); // PREVENTS p5.js DEFAULT BEHAVIOUR

	brain = ml5.KNNClassifier();
	brain.load('/model/testingKNN.json', () => {
		addStatus(statusHolder, 'KNN Model Loaded', true);
	})

	

	HANDS_MODEL = new Hands({
		locateFile: (file) => {
			return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
		},
	})
	
	const HAND_CONFIG = {
		maxNumHands: 1,
		modelComplexity: 1,
		minDetectionConfidence: 0.8,
		minTrackingConfidence: 0.8,
	};
	HANDS_MODEL.setOptions(HAND_CONFIG);
	HANDS_MODEL.onResults(onResults);
	
	const CAMERA = new Camera(videoElement, {
		onFrame: async () => {
			await HANDS_MODEL.send({ image: videoElement });
		},
		width: CAMERA_SIZE,
		height: CAMERA_SIZE,
	});
	CAMERA.start().then(() => addStatus(statusHolder, 'Initialize Camera Feed', true)).catch(()=> addStatus(statusHolder, 'Initialize Camera Feed', false));

}

function onResults(results) {
	drawHand(results, canvasElement);

    if (results.multiHandWorldLandmarks) {
        for (const landmarks of results.multiHandWorldLandmarks) {

            // Flatting of all 3D co-ordinates into single array i.e 21*3 -> 63
			let inputs = [];
            for(const landmark of landmarks){
                inputs.push(landmark.x);
                inputs.push(landmark.y);
                inputs.push(landmark.z);
            }

			// Sending input for classification
			brain.classify(inputs).then(res => {
				const label = Object.entries(res.confidencesByLabel)
				.find(([key,value]) => value==1)
				if (!label) return
				updateResult(label[0]);
				updateElementText(predictedLetter,`${label[0]}`);
				updateElementText(predictedResult,`${result}`);
			
			});
			
        }
    }
}

// UPDATE RESULT
function updateResult(label){
	if(buffer[label] === undefined || buffer[label] === null){
		buffer[label] = 1;
	} else {
		buffer[label]++;
	}
	if(count === BUFFER_SIZE){
		let maxFound = null;
		for(const ele in buffer){
			count = count + buffer[ele];
			if(!maxFound) maxFound = [ele, buffer[ele]]
			else {
				if (buffer[ele] > maxFound[1] && 
					maxFound[1] < MIN_LETTER_REQ_IN_BUFFER){
					maxFound = [ele, buffer[ele]]
				}
			}
		}
		if(maxFound && !result.endsWith(maxFound[0])){
			result = result + maxFound[0];
		}
		count = 0;
		buffer = {};
		return;
	}
	count++;
}