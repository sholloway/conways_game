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

module.exports = Entity;
