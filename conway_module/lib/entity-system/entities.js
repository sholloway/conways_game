/**
 * A module for defining render-able entities with traits.
 * @module entity_system
 */

 /**
 * A render-able entity. The entity is defined by registering traits.
 */
class Entity{
	/**
	 * Create a new Entity.
	 */
	constructor(){
		this.traits = []
	}

	/**
	 * Process all register traits.
	 * @param {HTMLCanvasContext} rendererContext
	 */
	render(rendererContext){
		let context = {
			rendererContext: rendererContext,
			entity: this
		}
		this.traits.forEach((trait) =>{
			trait.process(context)
		})
	}

	/**
	 * Expands the definition of the entity by registering traits.
	 * @param {Trait} trait - An implementation of the Trait abstract class.
	 */
	register(trait){
		this.traits.push(trait)
		return this
	}

	/**
	 * Automatically called by JSON.stringify().
	 * Injects the original class name as a property when serialized
	 * which an be used to rebuild a Scene after communicated from a thread.
	 * @returns Entity
	 */
	toJSON(){
		this.className = this.constructor.name;
		return this;
	}

	copyParams(original){
		for (var key in original){
			if (key != 'className' && key != 'traits'){
				this[key] = original[key];
			}
		}
		return this;
	}

	initTraits(original, traitBuilderFactory){
		this.traits = original.traits.map(traitLit => {
			var traitBuilder = traitBuilderFactory(traitLit.className);
			return traitBuilder().copyParams(traitLit);
		});
		return this;
	}
}

/**
 * A grid.
 */
class GridEntity extends Entity{
	/**
	 * Creates a new grid entity
	 * @param {number} width - The total width of the grid.
	 * @param {number} height - The total height of the grid.
	 * @param {number} cWidth - The width of a grid cell.
	 * @param {number} cHeight - The height of a grid cell.
	 */
	constructor(width = null, height = null, cWidth = null, cHeight = null){
		super()
		this.width = width
		this.height = height
		this.cell = { width: cWidth, height: cHeight}
	}

	static buildInstance(params, traitBuilderMap){
		return new GridEntity()
			.copyParams(params)
			.initTraits(params, traitBuilderMap);
	}
}

/**
 * Represents a box that can be processed via Traits.
 */
class Box extends Entity{
	/**
	 * Creates a new Box.
	 * @param {number} x - Left most X coordinate.
	 * @param {number} y - Upper most Y coordinate.
	 * @param {number} xx - Right most X coordinate.
	 * @param {number} yy - Lower most Y coordinate.
	 * @param {boolean} alive - If the cell is alive or not.
	 */
	constructor(x = null,y = null, xx = null, yy = null, alive = null){
		super()
		this.x = x
		this.y = y
		this.xx = xx
		this.yy = yy
		this.alive = alive
	}

	static buildInstance(params, traitBuilderMap){
		return new Box()
			.copyParams(params)
			.initTraits(params, traitBuilderMap);
	}
}

module.exports = {
	Box,
	Entity,
	GridEntity
}
