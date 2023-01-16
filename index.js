// APP SETTINGS
const CAMERA_SIZE = 480/2;
const TIMER_MAX_COUNT = 1;
const TIMER_INTERVAL = 1000; //in ms
const LETTER_THRESOLD = 10;//DEVICE DEPENDENT
const appStatus = { //TEMP
    starting: "App Starting, Please Wait",
    idle: "Idle",
}

// HTML ELEMENT REFERENCES
const videoElement = getElement("camera_feed"); 
const canvasElement = getElement("canvas");
const outputConsole = getElement("app_output");
const predictedLetter = getElement("predicted_letter");
const predictedResult = getElement("predicted_result")

let brain;
let result = '';
let buffer = {};
let timer = new Timer(TIMER_MAX_COUNT, TIMER_INTERVAL);

function setup() {
	noCanvas(); // PREVENTS p5.js DEFAULT BEHAVIOUR

    // Brain initialization
	const BRAIN_CONFIG = {
        inputs: 63, //21*3	[TOTAL_POINTS*(X+Y+Z)]
        task: 'classification',
    }
    brain = ml5.neuralNetwork(BRAIN_CONFIG);

	// Loading our model into brain
    const MODEL_FILES = {
        model: 'model/model.json',
        metadata: 'model/model_meta.json',
        weights: 'model/model.weights.bin'
    }
    brain.load(MODEL_FILES, () => console.log('Brain Loaded'));

	
	const HANDS_MODEL = new Hands({
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
	CAMERA.start();

    updateElementText(outputConsole, 'App started');
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
            brain.classify(inputs, (err, res) => {
				if (err) {
					console.warn(err);
					return;
				}
				

				updateResult(res[0].label);
				// updateElementText(outputConsole,`${res[0].label} ${res[0].confidence.toFixed(3)} ${result}`);
				updateElementText(predictedLetter,`${res[0].label}`);
				updateElementText(predictedResult,`${result}`);
            
			});
        }
    } else {
        updateOutputConsole('NONE');
    }
}

// UPDATE RESULT
function updateResult(label){
	if(buffer[label] === undefined || buffer[label] === null){
		buffer[label] = 1;
	} else {
		buffer[label]++;
	}

	if(!timer.isStarted) {
		timer.start();
	}else if(timer.isEnded){
		timer.reset();

		let maxFound = null;
		let count = 0;
		for(const ele in buffer){
			count = count + buffer[ele];
			if(!maxFound) maxFound = [ele, buffer[ele]]
			else {
				if (buffer[ele] > maxFound[1] && maxFound[1] < LETTER_THRESOLD){
					maxFound = [ele, buffer[ele]]
				}
			}
		}

		if(maxFound && (count*60)/100 <= maxFound[1] && !result.endsWith(maxFound[0])){
			result = result + maxFound[0];
		}
		buffer = {};
	}
}
