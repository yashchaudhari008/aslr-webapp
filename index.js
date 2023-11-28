// APP SETTINGS
const CAMERA_SIZE = 480 / 2;
const REPEATING_LETTER_THERSOLD = 2;
let BUFFER_SIZE = 9;
let MIN_LETTER_REQ_IN_BUFFER = 6; //Math.floor((value*3)/4)

// HTML ELEMENT REFERENCES
const videoElement = getElement("camera_feed");
const canvasElement = getElement("canvas");
const statusHolder = getElement("statusTable");
const predictedLetter = getElement("predicted_letter");
const predictedResult = getElement("predicted_result");
const customThresoldCheckbox = getElement("customThresoldCB");
const thresoldInput = getElement("customThresold");

// APP SETTINGS ONCHANGE EVENTS
customThresoldCheckbox.onchange = (e) => {
  if (e.target.checked) {
    updateBufferValues(thresoldInput.value);
    thresoldInput.disabled = false;
  } else {
    updateBufferValues(9);
    thresoldInput.disabled = true;
  }
};
thresoldInput.onchange = (e) => {
  if (customThresoldCheckbox.checked) updateBufferValues(e.target.value);
};
const updateBufferValues = (value) => {
  BUFFER_SIZE = value;
  MIN_LETTER_REQ_IN_BUFFER = Math.floor((value * 3) / 4);
};

let brain; // holds KNN Classifier
let result = ``; // holds actual results (i.e words)

let HANDS_MODEL; // holds Hand Landmark model

brain = ml5.KNNClassifier(); // initialize KNN classifier
brain.load(`./model/mainKNN1.json`, () => {
  addStatus(statusHolder, "KNN Model Loaded", true);
}); // load custom made KNN model which classify hand signs

HANDS_MODEL = new Hands({
  locateFile: (file) => {
    return `./libs/mediapipe/hands/${file}`;
  },
}); // loads hand landmark detection model which detect hand co-ordinates

// hand landmark setup config
const HAND_CONFIG = {
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.8,
  minTrackingConfidence: 0.8,
};
HANDS_MODEL.setOptions(HAND_CONFIG);
HANDS_MODEL.onResults(onResults); // runs onResults function whenever we get hand landmarks into video

// initialize camera (camera config)
const CAMERA = new Camera(videoElement, {
  onFrame: async () => {
    await HANDS_MODEL.send({ image: videoElement });
  },
  width: CAMERA_SIZE,
  height: CAMERA_SIZE,
});
CAMERA.start()
  .then(() => addStatus(statusHolder, "Initialize Camera Feed", true))
  .catch(() => addStatus(statusHolder, "Initialize Camera Feed", false));

function onResults(results) {
  if (results.multiHandedness.length > 0) {
    if (results.multiHandedness[0].label == "Right") {
      // draws wrong hand (RIGHT HAND) and return nothing
      drawHand(results, canvasElement, (showHand = false));
      return;
    }
  }
  // draw correct hand and process hand landmarks further
  drawHand(results, canvasElement);

  if (results.multiHandWorldLandmarks) {
    for (const landmarks of results.multiHandWorldLandmarks) {
      // (this is input to KNN model) Flatting of all 3D co-ordinates into single array i.e 21*3 -> 63
      let inputs = [];
      for (const landmark of landmarks) {
        inputs.push(landmark.x);
        inputs.push(landmark.y);
        inputs.push(landmark.z);
      }

      // Sending input for classification to knn classifier
      brain.classify(inputs).then((res) => {
        const label = Object.entries(res.confidencesByLabel).find(
          ([key, value]) => value == 1
        );
        if (!label) return;
        updateResult(label[0]); // label here is detected alphabet

        // shows letter and word on UI
        updateElementText(predictedLetter, `${getNameFromLabel(label[0])}`);
        updateElementText(
          predictedResult,
          `${result}<span class="underline"> </span>`
        );
      });
    }
  }
}

// UPDATE RESULT
// this logic handles word generation from detected letters (uses buffer, majority letter in buffer of size BUFFER_SIZE is assigned as result)
let buffer = {};
let letterCountInBuffer = 0;
let repeatCount = 0;
function updateResult(label) {
  if (buffer[label] === undefined || buffer[label] === null) {
    buffer[label] = 1;
  } else {
    buffer[label]++;
  }
  letterCountInBuffer++;
  if (letterCountInBuffer >= BUFFER_SIZE) {
    let maxFound = null;
    for (const ele in buffer) {
      const isMaj = buffer[ele] >= MIN_LETTER_REQ_IN_BUFFER;
      if (
        isMaj &&
        (maxFound == null || (maxFound != null && buffer[ele] > maxFound[1]))
      ) {
        maxFound = [ele, buffer[ele]];
      }
    }
    if (maxFound) {
      if (
        !result.endsWith(maxFound[0]) ||
        repeatCount >= REPEATING_LETTER_THERSOLD
      ) {
        if (maxFound[0] === "~") {
          result = result.slice(0, result.length - 1);
        } else {
          result = result + maxFound[0];
        }
        repeatCount = 0;
      } else {
        repeatCount++;
      }
    }
    letterCountInBuffer = 0;
    buffer = {};
    return;
  }
}
