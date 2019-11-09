/**
 * Abstract class. Defines a render-able trait that can be processed.
 */
class Trait{
	/**
	 * Creates a new trait.
	 */
	constructor(){}
	/**
	 * Function that controls what the trait does.
	 * @abstract
	 * @param {object} context - The render context.
	 */
	process(context){
		let msg = 'Traits must implement a process method.';
		if(this && this.constructor){ //When invoked from chai, this not be defined.
			msg += ` ${this.constructor.name} does not.`;
		}
		throw new Error(msg);
	}

	/**
	 * Automatically called by JSON.stringify().
	 * Injects the original class name as a property when serialized
	 * which an be used to rebuild a Scene after communicated from a thread.
	 * @returns Trait
	 */
	toJSON(){
		this.className = this.constructor.name;
		return this;
	}

	copyParams(original){
		for (var key in original){
			if (key != 'className'){
				this[key] = original[key];
			}
		}
		return this;
	}
}

module.exports = Trait;
