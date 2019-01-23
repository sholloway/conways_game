const {Cell, QuadTree} = require('./Quadtree.js')

const {Entity, ColorByAgeTrait, CircleTrait, ScaleTransformer, GridCellToRenderingEntity,
	ProcessBoxAsRect, ColorByContents, RectTrait} = require('./EntitySystem.js')

	/*TODO: Change this for drawing mode. */
function registerCellTraits(config, cells){
	cells.forEach((cell) => {
		cell.register(new GridCellToRenderingEntity())
			.register(new ScaleTransformer(config.zoom))
			.register(new ColorByAgeTrait())
			.register(new CircleTrait())
	});
}

function clone(cells){
	let clones = []
	cells.forEach( cell => { clones.push(new Cell(cell.location.row, cell.location.col, 1))})
	return clones
}

// TODO: Move this to either QuadTree or EntitySystem
/**
 * Represents a containing box that can be processed via Traits.
 */
class Box extends Entity{
	constructor(x,y,xx,yy, alive){
		super()
		this.x = x
		this.y = y
		this.xx = xx
		this.yy = yy
		this.alive = alive
	}
}

/**
 * Recursively traverses a quad tree and adds the partition boxes to the provided array.
 * @param {QTNode} currentNode - The current node to process.
 * @param {Array[Box]} boxes - The array to add the partition boxes to.
 */
function collectBoxes(currentNode, boxes){
	let containsAliveCell = currentNode.index != null
	boxes.push(new Box(currentNode.rect.x, currentNode.rect.y, currentNode.rect.xx, currentNode.rect.yy, containsAliveCell))
	if(currentNode.subdivided){
		currentNode.children().forEach((child)=>{
			collectBoxes(child, boxes)
		})
	}
}

function registerBoxTraits(config, boxes){
	boxes.forEach(box => {
		box.register(new ProcessBoxAsRect())
			.register(new ScaleTransformer(config.zoom))
			.register(new ColorByContents())
			.register(new RectTrait())
	})
}

class DrawingStateManager{
	constructor(config){
		this.config = config
		this.cells = []
		this.currentTree = QuadTree.empty()
		this.nextTree = QuadTree.empty()
		this.currentTree.index(this.cells)
	}

	/*
		Start really dumb...

		Eventually:
		Test the tree. If it doesn't exist, add it. If it does remove it and rebuild the tree.
	*/
	toggleCell(x,y){
		let node = this.currentTree.search(new Cell(x,y))
		if (node == null){ //Doesn't exist. Add it.
			this.cells.push(new Cell(x,y,1))
			this.nextTree.clear()
			this.nextTree.index(this.cells)
		}else{
			//remove it.
			this.cells.splice(node.index, 1)
			this.nextTree.clear()
			this.nextTree.index(this.cells)
		}
		this.activateNext()
	}

	processCells(scene){
		let clones = clone(this.cells)
		registerCellTraits(this.config, clones)
		scene.push(clones)
	}

	/**
	 * Replaces the current tree with the next state tree and re-initializes the next
	 * tree to be empty.
	 */
	activateNext(){
		this.currentTree = QuadTree.clone(this.nextTree)
		this.nextTree.clear().index()
	}

	clear(){
		this.currentTree.clear().index()
		this.nextTree.clear().index()
		this.cells = []
	}

	/**
	 * Traverses the next state data structure and adds it to the scene to be rendered.
	 * @param {SceneManager} scene - The active list of things that need to be rendered.
	 */
	stageStorage(scene, display){
		if (!display){
			return
		}
		let boxes = []
		collectBoxes(this.currentTree.root,boxes)
		registerBoxTraits(config, boxes)
		scene.push(boxes)
	}
}

module.exports = DrawingStateManager