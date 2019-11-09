/**
 * A system that draws a uniform grid.
 * @deprecated
 */
class GridSystem{
	constructor(htmlCanvasContext, cellSize){
		this.htmlCanvasContext = htmlCanvasContext
		this.cellSize = cellSize
	}

	/**
	 * Set the uniform cell size.
	 * @param {number} size - The width and height of a cell.
	 */
	setCellSize(size){
		this.cellSize = size
	}

	/**
	 * Renders a grid on a HTML Canvas.
	 * @param {number} width - The total width of the grid.
	 * @param {*} height - The total height of the grid.
	 */
	drawGrid(width, height){
		this.htmlCanvasContext.strokeStyle = '#757575'
		this.htmlCanvasContext.lineWidth = 0.5
		for (let x = 0; x < width; x += this.cellSize){
			this.htmlCanvasContext.beginPath()
			this.htmlCanvasContext.moveTo(x,0)
			this.htmlCanvasContext.lineTo(x, height)
			this.htmlCanvasContext.stroke()
		}

		for (let y = 0; y < height; y += this.cellSize){
			this.htmlCanvasContext.beginPath
			this.htmlCanvasContext.moveTo(0,y)
			this.htmlCanvasContext.lineTo(width, y)
			this.htmlCanvasContext.stroke()
		}
	}

	/**
	 * Clears a region of the HTML canvas.
	 * @param {number} x - The left most coordinate of the area to clear.
	 * @param {number} y - The upper most coordinate of the area to clear.
	 * @param {number} width - The width of the area to clear.
	 * @param {number} height - The height of the area to clear.
	 */
	clear(x,y, width, height){
		this.htmlCanvasContext.clearRect(x,y,width,height)
	}
}

module.exports = GridSystem
