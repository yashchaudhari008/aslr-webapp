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

class Timer{
	constructor(MAX_COUNT, INTERVAL_IN_MS = 1000){
		this.MAX_COUNT = MAX_COUNT;
		this.INTERVAL_IN_MS = INTERVAL_IN_MS;
		this.CURRENT_COUNT = 0;
		this.TRIGGER = null;
	}
	get currentTime(){
		return this.CURRENT_COUNT;
	}
	get isEnded(){
		return (this.MAX_COUNT === this.CURRENT_COUNT);
	}
	get isStarted(){
		return (this.CURRENT_COUNT >= 0 && this.TRIGGER !== null)
	}
	start(){
		if(this.TRIGGER) return;
		this.TRIGGER = setInterval(() => this.updateTime(), this.INTERVAL_IN_MS);
	}
	reset(){
		clearInterval(this.TRIGGER);
		this.TRIGGER = null;
		this.CURRENT_COUNT = 0;
	}
	updateTime() {
		if(this.CURRENT_COUNT < this.MAX_COUNT){
			this.CURRENT_COUNT++;
		} else {
			clearInterval(this.TRIGGER);
			this.TRIGGER = null;
		}
	}
}

//#endregion