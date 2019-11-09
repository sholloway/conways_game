const SceneManager = require('../core/SceneManager.js');
const {Box, GridEntity} = require('../entity-system/entities');
const {ClearArea, DarkThinLines, FilledRectTrait, FillStyle,
	ProcessBoxAsRect, GridPattern} = require('../entity-system/traits');

class GridBuilder{
	/**
	 * Constructs a scene containing a 2D grid.
	 * @param {number} cellWidth
	 * @param {number} cellHeight
	 * @param {number} gridWidth
	 * @param {number} gridHeight
	 * @returns SceneManager
	 */
	static buildGrid(cellWidth, cellHeight, gridWidth, gridHeight){
		let scene = new SceneManager();
		let background = new Box(0, 0, gridWidth, gridHeight);
		//'#f5f5f5'
		background.register(new ProcessBoxAsRect())
			.register(new FillStyle('#444444'))
			.register(new FilledRectTrait());

		let grid = new GridEntity(gridWidth, gridHeight, cellWidth, cellHeight);
		grid.register(new DarkThinLines())
			.register(new GridPattern());
		return scene.push(background).push(grid);
	}

	/**
	 * Constructs a scene that will simply clear the area.
	 * @param {number} gridWidth
	 * @param {number} gridHeight
	 */
	static buildClearedArea(gridWidth, gridHeight){
		let scene = new SceneManager();
		let area = new Box(0, 0, gridWidth, gridHeight, false);
		area.register(new ProcessBoxAsRect())
			.register(new ClearArea());
		return scene.push(area);
	}

	/**
	 * Creates an empty scene to support the Null object pattern.
	 */
	static buildEmptyScene(){
		return new SceneManager();
	}
}

module.exports = GridBuilder;
