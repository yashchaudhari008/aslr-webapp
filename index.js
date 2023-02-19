// APP SETTINGS
const CAMERA_SIZE = 480/2;
const BUFFER_SIZE = 9;
const REPEATING_LETTER_THERSOLD = 2;
const MIN_LETTER_REQ_IN_BUFFER = Math.floor((BUFFER_SIZE*3)/4)

// HTML ELEMENT REFERENCES
const videoElement = getElement("camera_feed"); 
const canvasElement = getElement("canvas");
const statusHolder = getElement("statusTable");
const predictedLetter = getElement("predicted_letter");
const predictedResult = getElement("predicted_result")

let brain;
let result = ``;

let HANDS_MODEL;

brain = ml5.KNNClassifier();
brain.load('./model/mainKNN.json', () => {
	addStatus(statusHolder, 'KNN Model Loaded', true);
})

HANDS_MODEL = new Hands({
	locateFile: (file) => {
		return `./libs/mediapipe/hands/${file}`;
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
				updateElementText(predictedResult,`${result}<span class="underline"> </span>`);
			});
			
        }
    }
}

// UPDATE RESULT
let buffer = {};
let letterCountInBuffer = 0;
let repeatCount = 0;
function updateResult(label){
	if(buffer[label] === undefined || buffer[label] === null){
		buffer[label] = 1;
	} else {
		buffer[label]++;
	}
	letterCountInBuffer++;
	if(letterCountInBuffer >= BUFFER_SIZE){
		let maxFound = null;
		for(const ele in buffer){
			const isMaj = buffer[ele] >= MIN_LETTER_REQ_IN_BUFFER;
			if(isMaj && ((maxFound == null) ||((maxFound !=null) && buffer[ele] > maxFound[1]))){
				maxFound = [ele, buffer[ele]];
			}	
		}
		if(maxFound){
			if(!result.endsWith(maxFound[0]) || (repeatCount >= REPEATING_LETTER_THERSOLD)){
				result = result + maxFound[0];
				repeatCount=0;
		} else {
			repeatCount++;
		}}
		letterCountInBuffer = 0;
		buffer = {};
		return;
	}
}