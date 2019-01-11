const {Cell, QuadTree, findAliveNeighbors} = require('./Quadtree.js')
const CellEvaluator = require('./CellEvaluator.js')
const { CellStates } = require('./CellStates.js')
const {Entity, ColorByAgeTrait, CircleTrait, ScaleTransformer, GridCellToRenderingEntity,
	ProcessBoxAsRect, ColorByContents, RectTrait} = require('./EntitySystem.js')

function randomAliveOrDead(){
  return getRandomIntInclusive(CellStates.DEAD, CellStates.ALIVE)
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

class QuadTreeSeeder{
	constructor(){}

	seed(width, height){
		let aliveCells = []
		for(let x = 0; x < width; x++){
			for (let y = 0; y < height; y++){
				let birthChance = randomAliveOrDead()
				if (birthChance == 1){
					aliveCells.push(new Cell(x,y, 1))
				}
			}
		}
		return aliveCells
	}
}

function defaultCellEvaluator(){
	return new CellEvaluator()
}

function defaultSeeder(){
	return new QuadTreeSeeder()
}

function registerCellTraits(config, cells){
	cells.forEach((cell) => {
		cell.register(new GridCellToRenderingEntity())
			.register(new ScaleTransformer(config.zoom))
			.register(new ColorByAgeTrait())
			.register(new CircleTrait())
	});
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

class GameManager{
	constructor(config){
		this.config = config
		this.currentTree = QuadTree.empty()
		this.nextTree = QuadTree.empty()
	}

	/**
	 * Populates the current tree.
	 */
	seedWorld(seeder = defaultSeeder()){
		let aliveCells = seeder.seed(this.config.landscape.width, this.config.landscape.height)
		this.currentTree.index(aliveCells)
		this.nextTree.index()
	}

	/**
	 * Traverse the current grid, applying the rules defined by the evaluator and
	 * populate the next grid accordingly. No changes are made to the current grid.
	 *
	 * @param {SceneManager} scene - The active list of things that need to be rendered.
	 * @param {CellEvaluator} evaluator - Responsible for evaluating a single cell.
	*/
	evaluateCells(scene, evaluator = defaultCellEvaluator()){
		//1. Traverse every possible cell on the landscape, building up a list of new alive cells.
		let aliveNeighbors, nextCellState, foundCell;
		let nextAliveCells = []
		for(let row = 0; row < this.config.landscape.width; row++){
			for(let col = 0; col < this.config.landscape.height; col++){
				//TODO: There is an opportunity to combine findAliveNeighbors with findCellIfAlive.
				//Then, only one traversal would be needed. findAliveNeighbors could be renamed and return
				// something like { aliveNeighbors:..., aliveCenter: ... }
				aliveNeighbors = findAliveNeighbors(this.currentTree, row, col)
				foundCell = this.currentTree.findCellIfAlive(row,col) //Returns DeadCell if not alive.
				nextCellState = evaluator.evaluate(aliveNeighbors, foundCell.getState())
				if (nextCellState == CellStates.ALIVE){
					nextAliveCells.push(new Cell(row,col, foundCell.age+1))
				}
			}
		}

		//2. Create a new quad tree from the list of alive cells.
		this.nextTree.clear()
		this.nextTree.index(nextAliveCells) //TODO: We need a way to force the clean up of existing QTNodes

		//3. Feed the cells to the scene manager.
		registerCellTraits(this.config, nextAliveCells)
		scene.push(nextAliveCells)
	}

	/**
	 * Replaces the current tree with the next state tree and re-initializes the next tree to be empty.
	 * This is similar to double buffering in computer graphics.
	 */
	activateNext(){
		this.currentTree = QuadTree.clone(this.nextTree)
		this.nextTree.clear().index()
	}

	/**
	 * Traverses the next state data structure and adds it to the scene to be rendered.
	 * @param {SceneManager} scene - The active list of things that need to be rendered.
	 */
	stageStorage(scene){
		let boxes = []
		collectBoxes(this.nextTree.root,boxes)
		registerBoxTraits(config, boxes)
		scene.push(boxes)
	}
}

module.exports = GameManager