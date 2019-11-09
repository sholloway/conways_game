/**
 * A web worker dedicated to constructing a 2D grid. Rendered by the main frame.
 */

const GridBuilder = require('../core/GridBuilder');

/**
 * Processes a message sent by the main thread.
 *
 * Message Types
 * {command: 'CREATE_GRID', parameters: { cellWidth: Integer, cellHeight: Integer, gridWidth: Integer, gridHeight: Integer}}
 * {command: 'CLEAR_GRID', parameters: { gridWidth: Integer, gridHeight: Integer}}
 */
onmessage = function(event) {
	let msg = event.data;
	if (!msg.command){
		console.error('Unexpected messaged received in GridSystemWorker.');
		console.error(event);
		return;
	}

	let scene;
	switch (msg.command){
		case 'CREATE_GRID':
			//TODO: Add error handling around parameters
			scene = GridBuilder.buildGrid(
				msg.parameters.cellWidth, msg.parameters.cellHeight,
				msg.parameters.gridWidth, msg.parameters.gridHeight);
			break;
		case 'CLEAR_GRID':
			scene = GridBuilder.buildClearedArea(msg.parameters.gridWidth, msg.parameters.gridHeight);
			break;
		default:
			console.error('Unsupported command received in GridSystemWorker.');
			console.error(msg.command);
			scene = GridBuilder.buildEmptyScene();
			break;
	}
	postMessage(JSON.stringify(scene));
}
