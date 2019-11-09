/**
 * A module for working with a 2D quadtree.
 * @module quadtree
 */

const {CellStates} = require('./CellStates.js')
const Entity = require('../entity-system/Entity')

/**
 * Represents a single unit on an abstract 2D grid.
 *
 * The width and height of the cell are the equal.
 * The grid is uniform.
 * @extends Entity
 */
class Cell extends Entity{
	/**
	 * Create a new cell.
	 * @param {number} row - The horizontal location of the cell on a grid.
	 * @param {number} col - The vertical location of the cell on a grid.
	 * @param {number} age - The number of simulation iterations the cell has been alive.
	 * @param {CellState} state - The state of the cell.
	 */
	constructor(row, col, age=0, state=CellStates.ALIVE){
		super()
		this.location = {row: row, col: col}
		this.age = age
		this.width = 1
		this.height = 1
		this.state = state
	}

	/**
	 * Intersection Test. Is the cell inside of a provided rectangle.
	 * @param {number} x
	 * @param {number} y
	 * @param {number} xx
	 * @param {number} yy
	 * @returns {boolean}
	 */
	isInsideRect(x,y,xx,yy){
		return (x <= this.location.row && this.location.row <= xx &&
						y <= this.location.col && this.location.col <= yy);
	}

	/**
	 * Getter for the cell's state.
	 */
	getState(){
		return this.state
	}

	/**
	 * Create a deep copy of the cell.
	 * @returns {Cell}
	 */
	clone(){
		return new Cell(this.location.row, this.location.col, this.age, this.state)
	}
}

/**
 * Singleton instance of a dead cell.
 * */
const DeadCell = new Cell(Infinity,Infinity, 0, CellStates.DEAD)
Object.freeze(DeadCell)

let idCount = 0
/**
 * Generate a unique ID for a node in the quad tree. Used for debugging.
 * @private
 */
function generateId(){
	return idCount++;
}

/**
 * A node in the pointer based quad tree.
 */
class QTNode{
	/**
	 * Initialize a new QTNode.
	 * @param {number} id - The unique identifier of the node.
	 * @param {number} x
	 * @param {number} y
	 * @param {number} xx
	 * @param {number} yy
	 */
	constructor(id, x,y, xx, yy){
		this.id = id
		this.rect = {
			x: x,
			y: y,
			xx: xx,
			yy: yy
		}
		this.area = this.area()
		this.subdivided = false //Flag indicating this node has been subdivided.

		//The potential children of this node.
		this.upperLeft = null
		this.upperRight = null
		this.lowerLeft =  null
		this.lowerRight = null

		//The index is a reference to the data in the array containing all the live cells.
		//It should be the number index, not a pointer to the data itself.
		//If it is null, then this node is empty or not a leaf.
		this.index = null
	}

	/**
	 * Returns true if the region doesn't contain a point yet.
	 * @returns {boolean}
	 */
	empty(){
		return this.index === null
	}

	/**
	 * Sets all class members to null.
	 */
	destroy(){
		this.id = null
		this.rect = null
		this.area = null
		this.upperLeft = null
		this.upperRight = null
		this.lowerLeft =  null
		this.lowerRight = null
		this.index = null
	}

	/**
	 * Returns the all the children as an array. Returns an empty array if the children have not been initialized yet.
	 * @return {QTNode[]}
	 */
	children(){
		let kids = null
		if (this.subdivided){
			kids = [this.upperLeft, this.upperRight, this.lowerLeft, this.lowerRight]
		}else{
			kids = []
		}
		return kids
	}

	/**
	 * Rectangle/Point intersection test
	 * @param {number} x - Left most boundary of the rectangle
	 * @param {number} y - Upper most boundary of the rectangle
	 * @returns {boolean}
	 */
	containsPoint(x,y){
		return (this.rect.x <= x && x <= this.rect.xx) &&
			(this.rect.y <= y && y <= this.rect.yy);
	}

	/**
	 * Tests if a given cell is fully contained by the QTNode's bounding box.
	 * This is defined by all 4 points of the cell being inside (or on edge)
	 * of the bounding box.
	 *
	 * @param {Cell} cell
	 * @returns {boolean}
	 */
	containsRect(cell){
		if (cell == null || cell == undefined){
			throw new Exception('QTNode.contains cannot process a null cell.')
		}

		//Since both the cell and bounding box are aligned to the same axes
		//we can just check the min and max points.
		return this.containsPoint(cell.location.row, cell.location.col) &&
			this.containsPoint(cell.location.row+cell.width, cell.location.col+cell.height)
	}

	/**
	 * Axis-aligned bounding box intersection test.
	 * @param {number} x
	 * @param {number} y
	 * @param {number} xx
	 * @param {number} yy
	 * @returns {boolean} Returns whether or not the node's bounding box intersects the provided range.
	 */
	intersectsAABB(x,y,xx,yy){
		let intersects = false
		if ((this.rect.x <= xx && this.rect.xx >= x) &&
		(this.rect.y <= yy && this.rect.yy >= y)){
			intersects = true
		}
		return intersects
	}

	/**
	 * Tests to see if the Node's AABB is inside the provided rectangle.
	 * @param {number} x
	 * @param {number} y
	 * @param {number} xx
	 * @param {number} yy
	 * @returns {boolean}
	 */
	isInsideRect(x,y,xx,yy){
		let firstPointIntersection = (x <= this.rect.x && this.rect.x <= xx &&
			y <= this.rect.y && this.rect.y <= yy);

		let secondPointIntersection = (x <= this.rect.xx && this.rect.xx <= xx &&
			y <= this.rect.yy && this.rect.yy <= yy)

		return firstPointIntersection && secondPointIntersection
	}

	/**
	 * Calculates the area of the bounding rectangle.
	 * Formula: Area = Length * Height
	 *
	 * @returns {number} The area of the rectangle.
	 */
	area(){
		let length = Math.abs(this.rect.xx) - Math.abs(this.rect.x)
		let height = Math.abs(this.rect.yy) - Math.abs(this.rect.y)
		return length * height
	}

	/**
	 * Set the node to a leaf. This is where the data lives.
	 * @param {number} index - The location of the leaf.
	 */
	setLeaf(index){
		this.index = index
	}

	/**
	 * Divides the node's region into 4 equal quadrants.
	 *
	 * Given the bounding box BB divide into the Quadrants Q1, Q2, Q3 & Q4 where:
	 * BB ------------------->
	 *    |   Q1   |   Q2   |
	 *    |--------|--------|
	 *    |   Q3   |   Q4   |
	 *    -------------------
	 *
	 * And the quadrants being divided by the point (p,q).
	 */
	subdivide(){
		//Only support the scenario of subdividing exactly once.
		if (this.subdivided){
			return
		}

		let p = this.rect.x + Math.ceil( (Math.abs(this.rect.xx) - Math.abs(this.rect.x))/2 )
		let q = this.rect.y + Math.ceil( (Math.abs(this.rect.yy) - Math.abs(this.rect.y))/2 )

		//How to handle overlap?..
		this.upperLeft = new QTNode(generateId(), this.rect.x, this.rect.y, p, q) //Q1
		this.upperRight = new QTNode(generateId(), p,this.rect.y, this.rect.xx, q) //Q2
		this.lowerLeft = new QTNode(generateId(), this.rect.x, q, p, this.rect.yy) //Q3
		this.lowerRight = new QTNode(generateId(), p,q, this.rect.xx, this.rect.yy) //Q4
		this.subdivided = true
	}
}

/**
* Create an empty Axis-aligned bounding box.
* @returns {object} An AABB defined by two points.
*/
function emptyAABB(){
	return {
		rowMin: 0, colMin: 0,
		rowMax: 0, colMax: 0
	}
}

/**
* Constructs an axis aligned bounding box from a set of cells
* on a uniform grid.
*
* @param {Cell[]} cells - An array of alive cells.
* @returns {object} An AABB defined by two points.
*/
function buildAxisAlignedBoundingBox(cells){
	let rowMin = cells[0].location.row
	let rowMax = cells[0].location.row
	let colMin = cells[0].location.col
	let colMax = cells[0].location.col
	cells.forEach((cell)=>{
		rowMin = Math.min(rowMin, cell.location.row)
		rowMax = Math.max(rowMax, cell.location.row)
		colMin = Math.min(colMin, cell.location.col)
		colMax = Math.max(colMax, cell.location.col)
	})
	// The max is increased by one in both axis to
	// account for including the farthest cell rather
	// than intersecting it.
	return {
		rowMin: rowMin, colMin: colMin,
		rowMax: rowMax+1, colMax: colMax+1
	}
}

/**
We want to use recursion to add a cell to quad tree.
Starting with the root, check to see if the cell belongs the active node,
if it does not, then subdivide by 4 and call each new child recursively.

@param {number} minimumCellSize - The smallest area a partition can have.
@param {QTNode} node - The node in the QuadTree to start the test.
@param {Cell} cell - The cell to be added to the QualTree.
@param {number} index - The location of the cell in the array of leaves.
*/
function addCell(minimumCellSize, node, cell, index){
	//If the cell does not fall in the node's bounding box end.
	if (!node.containsRect(cell)){
		return
	}

	//Is this the smallest a region can be? If so set the index otherwise subdivide.
	//Experiment: Rather than have the cell get to the minimum area, just add the cell
	//if none exist. However, the challenge with that, is when the second point is added,
	//the previously added leaf needs to be moved.
	/* Original
	if(minimumCellSize >= node.area)
	{
		//set the cell
		node.setLeaf(index)
		return
	}else{
		if (!node.subdivided){
			node.subdivide()
		}
		//make recursive call for each quadrant
		node.children().forEach((quadrant) => {
			addCell(minimumCellSize, quadrant, cell, index)
		})
	}
	*/

	if (node.subdivided){ //Index should always be empty
		//make recursive call for each quadrant
		node.children().forEach((quadrant) => {
			addCell.bind(this)(minimumCellSize, quadrant, cell, index)
		})
	}else{
		if(node.empty()){
			node.setLeaf(index)
			return
		}else{
			//If it's not empty, there's already a cell here. We need to subdivide and reposition the existing cell.
			node.subdivide()
			let relocateCell = this.leaves[node.index]
			let relocateCellIndex = node.index
			node.setLeaf(null)
			node.children().forEach((quadrant) => {
				//attempt to place the existing cell
				addCell.bind(this)(minimumCellSize, quadrant, relocateCell, relocateCellIndex)

				//attempt to place the current cell
				addCell.bind(this)(minimumCellSize, quadrant, cell, index)
			})
		}
	}
}

/**
 * Given an array and index, verifies that the index is valid.
 * @param {Array} array - The array to verify the index against.
 * @param {number} index - The index to verify
 * @returns {Boolean}
 */
function validIndex(array, index){
	return (typeof index === 'number' &&
		(index >=0 && index <=array.length - 1))
}

/**
 * Deletes the provided and all children nodes.
 * @param {QTNode} node - The node to start the top-down delete from.
 */
function recursiveDelete(node){
	if (typeof node === 'undefined' || node === null){
		return
	}
	recursiveDelete(node.upperLeft)
	recursiveDelete(node.upperRight)
	recursiveDelete(node.lowerLeft)
	recursiveDelete(node.lowerRight)
	node.destroy()
}

/**
 * A pointer based 2D spatial quad tree.
 */
class QuadTree{
	constructor(liveCells){
		this.leaves = liveCells
		this.root = null
		this.minimumCellSize = 1
	}

	aliveCellsCount(){
		return this.leaves.length
	}

	/**
	 * Empties the tree. It sets the leaves to an empty array and recursively deletes all nodes.
	 * @returns {QuadTree} The instance of the tree being operated on.
	 */
	clear(){
		recursiveDelete(this.root)
		this.root = null
		this.leaves = []
		return this
	}

	/**
	 * Create a new empty quad tree.
	 */
	static empty(){
		return new QuadTree([])
	}

	/**
	 * Creates a deep copy of the provided quad tree.
	 * @param {QuadTree} tree
	 * @returns {QuadTree} A deep copy of the tree. Returns an empty tree if passed null.
	 */
	static clone(tree){
		if (typeof tree === 'undefined' || tree === null){
			return QuadTree.empty()
		}

		let clonedCells = []
		tree.leaves.forEach((leaf) => {
			clonedCells.push(leaf.clone())
		})
		let clonedTree = new QuadTree(clonedCells)
		clonedTree.index()
		return clonedTree
	}

	/**
	 * Build the spatial data structure based on a provided array of cells.
	 * @param {Cell[]} liveCells
	 * @returns {QTNode} Returns the root of the tree.
	 */
	index(liveCells = null){
		if(liveCells !== null){
			this.leaves = liveCells
		}
		this.boundary = (this.leaves.length > 0)? buildAxisAlignedBoundingBox(this.leaves) : emptyAABB()
		this.root = new QTNode(generateId(),
			this.boundary.rowMin, this.boundary.colMin,
			this.boundary.rowMax, this.boundary.colMax)

		this.leaves.forEach((cell, index) => {
			addCell.bind(this)(this.minimumCellSize, this.root, cell, index)
		})
		return this.root
	}

	/**
	 * Recursively searches for an alive cell in the tree.
	 * @param {Number} x - The column coordinate of the cell.
	 * @param {Number} y - The row column coordinate of the cell.
	 *
	 * @returns {QTNode} Returns the node that points to the alive cell if it exists. Otherwise returns null.
	 */
	search(cell, currentNode = this.root){
		if (currentNode === null){
			throw new Error('Cannot search a null tree.')
		}
		// End the search
		if (currentNode.area == this.minimumCellSize){
			if (currentNode.containsRect(cell) && currentNode.index !== null){
				return currentNode
			}else{
				return null
			}
		}

		//End Search
		if (!currentNode.subdivided){
			return null
		}

		//try searching on the left of the horizontal partition.
		let cellRightBoundary = cell.location.row + cell.width
		let cellLowerBoundary = cell.location.col + cell.height
		let horizontalPartition = currentNode.upperLeft.rect.xx
		let verticalPartition = currentNode.upperLeft.rect.yy
		let nextNode = null
		if (cellRightBoundary <= horizontalPartition){ // The right most boundary of the cell is to the left horizontal partition.
			if(cellLowerBoundary <= verticalPartition){ //try upper left
				nextNode = currentNode.upperLeft
			}else{ //try lower left
				nextNode = currentNode.lowerLeft
			}
		}else{ //try searching on the right of the horizontal partition.
			if(cellLowerBoundary <= verticalPartition){ //try upper right
				nextNode = currentNode.upperRight
			}else{ //try lower right
				nextNode = currentNode.lowerRight
			}
		}
		return (nextNode === null)? null : this.search(cell, nextNode)
	}

	//Most time is spent here according to profiler.
	/**
	 * Finds a cell if it is alive in landscape.
	 * @param {number} row
	 * @param {number} col
	 * @returns {Cell} Returns the found cell or the DeadCell.
	 */
	findCellIfAlive(row, col){
		let foundLeafNode = this.search(new Cell(row, col))
		if (foundLeafNode !== null && validIndex(this.leaves, foundLeafNode.index)){
			let indexedCell = this.leaves[foundLeafNode.index]
			return indexedCell
		}else{
			return DeadCell
		}
	}

	//Most time is spent here according to profiler.
	/**
	 * Recursive Range query. Finds all alive cells in the rectangle defined by bounds of the points (x,y), (xx,yy).
	 * @param {number} x
	 * @param {number} y
	 * @param {number} xx
	 * @param {number} yy
	 * @param {QTNode} currentNode - The node to perform the range on. Defaults to the root of the tree.
	 * @returns {Cell[]} The array of alive cells found. Returns an empty array if none are found.
	 */
	findAliveInArea(x,y,xx,yy, currentNode = this.root){
		if (typeof currentNode === 'undefined' || currentNode === null){
			throw new Error('Cannot perform a range query on an empty node.')
		}
		let foundCells = []
		if (!currentNode.intersectsAABB(x,y,xx,yy)){
			return foundCells
		}

		if (currentNode.subdivided){
			let q1 = this.findAliveInArea(x,y,xx,yy,currentNode.upperLeft)
			let q2 = this.findAliveInArea(x,y,xx,yy,currentNode.upperRight)
			let q3 = this.findAliveInArea(x,y,xx,yy,currentNode.lowerLeft)
			let q4 = this.findAliveInArea(x,y,xx,yy,currentNode.lowerRight)
			//foundCells = foundCells.concat(q1,q2,q3,q4)
			//683   10.7%  t v8::internal::(anonymous namespace)::Fast_ArrayConcat
			foundCells = [...q1, ...q2, ...q3, ...q4]
		}else{
			let cell = this.leaves[currentNode.index]
			if (cell && cell.isInsideRect(x,y,xx,yy)){
				foundCells.push(cell)
			}
		}
		return foundCells
	}
}

/**
 * Scale from the origin by a constant in place along both axis.
 *
 * @param {QTNode} node - The node in the tree to scale.
 * @param {number} factor - The scaling factor.
 */
function uniformScale(node, factor){
	node.rect.x = node.rect.x * factor
	node.rect.y = node.rect.y * factor
	node.rect.xx = node.rect.xx * factor
	node.rect.yy = node.rect.yy * factor
	node.children().forEach((child) => uniformScale(child, factor))
}

/**
 * Uniformly scales cells along both axis from the upper left corner.
 * @param {Cell[]} cells
 * @param {number} scalingFactor
 * @returns {Cell[]} A new array of cells.
 */
function scaleCells(cells, scalingFactor){
	return cells.map((cell) => new Cell(cell.location.row * scalingFactor, cell.location.col * scalingFactor, cell.age))
}

/**
 * Given a cell's coordinates, find the count of alive neighbors.
 * @param {number} row - The cell's coordinates on the x-axis.
 * @param {number} col - The cell's coordinates on the y-axis.
 * @returns {number} The count of alive neighbors.
 */
function findAliveNeighbors(tree, row, col){
	let range = {
		x : row - 1,
		y : col - 1,
		xx : row + 1,
		yy : col + 1
	}
	let aliveCells = tree.findAliveInArea(range.x, range.y, range.xx, range.yy)
	let aliveCount = aliveCells.reduce((count, cell) => {
			if (!(cell.location.row == row && cell.location.col == col)){
				count++
			}
			return count
		}, 0)
	return aliveCount
}

/**
 * Creates a deep copy of an array of cells.
 * @param {Cell[]} cells - The array of cells to copy.
 * @returns {Cell[]} The new array.
 */
function cloneCells(cells){
	let clones = []
	cells.forEach( cell => { clones.push(new Cell(cell.location.row, cell.location.col, 1))})
	return clones
}

module.exports = {
	Cell,
	cloneCells,
	DeadCell,
	findAliveNeighbors,
	QTNode,
	QuadTree,
	scaleCells,
	uniformScale
}
