// APP SETTINGS
const CAMERA_SIZE = 480/2;
const BUFFER_SIZE = 9;
const REPEATING_LETTER_THERSOLD = 2;
const MIN_LETTER_REQ_IN_BUFFER = Math.floor((BUFFER_SIZE*3)/4)
const SPEECH_LANG = 'en-IN';
const SPEAK_LETTER_ENABLED = false;
const SPEAK_WORD_ENABLED = false;

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

const SPEECH = new SpeechSynthesisUtterance();
SPEECH.lang = SPEECH_LANG;
SPEECH.rate = 2;
SPEECH.volume = 1;
SPEECH.pitch = 1;

function onResults(results) {
	if(results.multiHandedness.length > 0){
		if(results.multiHandedness[0].label == "Right"){ 
			drawHand(results, canvasElement, showHand = false);
			return;
		}
	}
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
				if(SPEAK_WORD_ENABLED && maxFound[0] == ' '){
					speak(result.split(" ").at(-2), SPEECH) 
				} else if(SPEAK_LETTER_ENABLED){
					speak(maxFound[0], SPEECH)
				}
				repeatCount=0;
		} else {
			repeatCount++;
		}}
		letterCountInBuffer = 0;
		buffer = {};
		return;
	}
} 
function speak(text, speech){
	speech.text = text;
	if(!speech.voice){
		voices = window.speechSynthesis.getVoices();
		speech.voice = voices.find(x => x.lang === SPEECH_LANG);
		if(speech.voice === null) speech.voice = voices[0];
	}
	window.speechSynthesis.speak(speech);
}