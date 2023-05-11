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

function getNameFromLabel(label){
	if(label === ' ') return 'Spc';
	if(label === "~") return 'Del'
	return label;
}

// DRAWS HAND ON IMAGE
const rootCSS = document.querySelector(":root");
function drawHand(results, canvasElement, showHand = true) {
	let landmarkColor = getComputedStyle(rootCSS).getPropertyValue('--hoverColor');
	if(!showHand || !landmarkColor) landmarkColor = "red";
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
				color: "#000000",
				lineWidth: 5,
			});
			drawLandmarks(canvasCtx, landmarks, { color: landmarkColor, lineWidth: 2 });
		}
	}
	canvasCtx.restore();
}

function addStatus(table, text, status){
	const row = document.createElement("tr");

	const cell1 = document.createElement("td");
	const cell1Text = document.createTextNode(text + ":");
	cell1.appendChild(cell1Text);
	row.appendChild(cell1);
	const cell2 = document.createElement("td");
	const cell2Text = document.createTextNode((status)? '✅':'❌' );
	cell2.appendChild(cell2Text);
	row.appendChild(cell2);

	table.appendChild(row);

}
//#endregion

//#region CLASSES
//----------------------------------------------

//#endregion