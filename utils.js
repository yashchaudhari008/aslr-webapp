//#region FUNCTIONS
//----------------------------------------------

// FINDING ELEMENT BY ID
function getElement(id){
	return document.getElementById(id);
}

// UPDATE ELEMENT
function updateElementText(ele, text){
    ele.innerHTML = text;
}

// DRAWS HAND ON IMAGE
function drawHand(results, canvasElement) {
	const canvasCtx = canvasElement.getContext("2d"); 
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

//#endregion

//#region CLASSES
//----------------------------------------------

//#endregion