const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon');

const Trait = require('./../../lib/entity-system/Trait'
)
const {
	CircleTrait,
	ColorByAgeTrait,
	ColorByContents,
	DarkFillTrait,
	DarkThinLines,
	FilledRectTrait,
	FillStyle,
	GridCellToRenderingEntity,
	GridPattern,
	ProcessBoxAsRect,
	RectOutlineTrait,
	ScaleTransformer,
	StrokeStyle
} = require('./../../lib/entity-system/traits')

const Entity = require('./../../lib/entity-system/Entity');
const {
	Box,
	GridEntity
} = require('./../../lib/entity-system/entities')

describe('The Entity System', function(){
	describe('Entities', function(){
		it ('should register traits', function(){
			let entity = new Entity()
			expect(entity.traits.length).to.equal(0)

			entity
			.register(new Trait())
			.register(new Trait())
			.register(new Trait())

			expect(entity.traits.length).to.equal(3)
		})

		it ('should process all traits when rendered', function(){
			let fakeTrait = new Trait()
			fakeTrait.process = sinon.spy()
			let entity = new Entity()
			entity.register(fakeTrait)
			entity.render()
			expect(fakeTrait.process.calledOnce).to.be.true
		})

		describe('Box Entity', function(){
			it ('should be defined by two points', function(){
				let box = new Box(0,1,2,3, false)
				expect(box.x).to.equal(0)
				expect(box.y).to.equal(1)
				expect(box.xx).to.equal(2)
				expect(box.yy).to.equal(3)
			})

			it ('should indicate if it contains alive cells', function(){
				let box = new Box(0,1,2,3, false)
				expect(box.alive).to.be.false
			})
		})

		describe('Grid Entity', function(){
			it('should be defined by a width and height', function(){
				let grid = new GridEntity(24, 33, 14, 17)
				expect(grid.width).to.equal(24)
				expect(grid.height).to.equal(33)
			})

			it('should have uniform cells', function(){
				let grid = new GridEntity(24, 33, 42, 67)
				expect(grid.cell.width).to.equal(42)
				expect(grid.cell.height).to.equal(67)
			})
		})
	})


	describe('Traits', function(){
		it ('should enforce implementing the process method', function(){
			let trait = new Trait()
			expect(trait.process).throws('Traits must implement a process method.')
		})

		it ('should have a trait for rendering a circle', function(){
			let fakeRenderingContext = {}
			fakeRenderingContext.beginPath = sinon.spy()
			fakeRenderingContext.arc = sinon.spy()
			fakeRenderingContext.fill = sinon.spy()
			fakeRenderingContext.stroke = sinon.spy()

			let context = {
				rendererContext: fakeRenderingContext,
				rendering: {
					entity: {
						x: 0,
						y: 0,
						width: 10,
						height: 10
					}
				}
			}
			let circleTrait = new CircleTrait()
			circleTrait.process(context)
			expect(fakeRenderingContext.beginPath.calledOnce).to.be.true
			expect(fakeRenderingContext.arc.calledOnce).to.be.true
			expect(fakeRenderingContext.fill.calledOnce).to.be.true
			expect(fakeRenderingContext.stroke.calledOnce).to.be.true
		})

		it ('should leverage the Fibonacci sequence for cell color', function(){
			let trait = new ColorByAgeTrait()

			let context = {
				entity:{
					age: 1
				}
			}

			trait.process(context)
			expect(context.fillStyle).to.equal('#e3f2fd')

			context.entity.age = 2
			trait.process(context)
			expect(context.fillStyle).to.equal('#bbdefb')

			context.entity.age = 3
			trait.process(context)
			expect(context.fillStyle).to.equal('#90caf9')

			context.entity.age = 5
			trait.process(context)
			expect(context.fillStyle).to.equal('#64b5f6')

			context.entity.age = 8
			trait.process(context)
			expect(context.fillStyle).to.equal('#42a5f5')

			context.entity.age = 13
			trait.process(context)
			expect(context.fillStyle).to.equal('#2196f3')

			context.entity.age = 21
			trait.process(context)
			expect(context.fillStyle).to.equal('#1e88e5')

			context.entity.age = 34
			trait.process(context)
			expect(context.fillStyle).to.equal('#1976d2')

			context.entity.age = 55
			trait.process(context)
			expect(context.fillStyle).to.equal('#1565c0')

			context.entity.age = 89
			trait.process(context)
			expect(context.fillStyle).to.equal('#0d47a1')

			context.entity.age = 144
			trait.process(context)
			expect(context.fillStyle).to.equal('#263238')

			context.entity.age = 233
			trait.process(context)
			expect(context.fillStyle).to.equal('#870000')

			context.entity.age = 377
			trait.process(context)
			expect(context.fillStyle).to.equal('#bf360c')

			context.entity.age = 378
			trait.process(context)
			expect(context.fillStyle).to.equal('#ffeb3b')

			context.entity.age = 1.5
			expect(() => trait.process(context)).to.throw('Unexpected Age: 1.5')

			context.entity.age = 'garbage'
			expect(() => trait.process(context)).to.throw('The trait ageBasedColor requires a property "age" be set to a number.')
		})

		it ('should enable setting the color based on if the entity is alive or not', function(){
			let trait = new ColorByContents()
			let context = {
				entity:{
					alive: false
				}
			}
			trait.process(context)
			expect(context.strokeStyle).to.equal('#0d47a1')
			expect(context.lineWidth).to.equal(2)

			context.entity.alive = true
			trait.process(context)
			expect(context.strokeStyle).to.equal('#c41c00')
			expect(context.lineWidth).to.equal(2)
		})

		it ('should provide a dark stroke and fill', function(){
			let trait = new DarkFillTrait()
			let context = {}
			trait.process(context)
			expect(context.fillStyle).to.equal('#263238')
			expect(context.strokeStyle).to.equal('#263238')
		})

		it ('should DarkThinLines', function(){
			let trait = new DarkThinLines()
			let context = {rendererContext:{}}
			trait.process(context)
			expect(context.rendererContext.strokeStyle).to.equal('#757575')
			expect(context.rendererContext.lineWidth).to.equal(0.5)
		})

		it ('should FilledRectTrait', function(){
			let trait = new FilledRectTrait()
			let context = {
				rendererContext:{
					fillRect: sinon.spy()
				},
				rendering:{
					entity:{
						x:0, y:0,
						width:0, height:0
					}
				}
			}
			trait.process(context)
			expect(context.rendererContext.fillStyle).to.equal('rgb(44, 193, 59)')
			expect(context.rendererContext.fillRect.calledOnce).to.be.true
		})
	})

	it ('should FillStyle', function(){
		let expectedColor = '123'
		let trait = new FillStyle(expectedColor)
		let context = {}
		trait.process(context)
		expect(context.fillStyle).to.equal(expectedColor)
	})

	it ('should GridCellToRenderingEntity', function(){
		let trait = new GridCellToRenderingEntity()
		let context = {
			entity:{
				location:{
					row:1, col:2
				},
				width:5, height:6
			}
		}
		trait.process(context)
		expect(context.rendering.entity.x).to.equal(1)
		expect(context.rendering.entity.y).to.equal(2)
		expect(context.rendering.entity.width).to.equal(5)
		expect(context.rendering.entity.height).to.equal(6)
	})

	it('should GridPattern', function(){
		let trait = new GridPattern()
		let context = {
			entity:{
				width:5, height:10,
				cell:{
					width:1, height:1,
				}
			},
			rendererContext:{
				beginPath: sinon.spy(),
				moveTo: sinon.spy(),
				lineTo: sinon.spy(),
				stroke: sinon.spy(),
			}
		}

		trait.process(context)
		expect(context.rendererContext.beginPath.callCount).to.equal(15)
		expect(context.rendererContext.moveTo.callCount).to.equal(15)
		expect(context.rendererContext.lineTo.callCount).to.equal(15)
		expect(context.rendererContext.stroke.callCount).to.equal(15)
	})

	it('should ProcessBoxAsRect', function(){
		let trait = new ProcessBoxAsRect()
		let context = {
			entity:{
				x: 5, y:10,
				xx:20, yy: 30
			}
		}
		trait.process(context)
		expect(context.rendering.entity.x).to.equal(5)
		expect(context.rendering.entity.y).to.equal(10)
		expect(context.rendering.entity.width).to.equal(15)
		expect(context.rendering.entity.height).to.equal(20)
	})

	it ('should RectOutlineTrait', function(){
		let trait = new RectOutlineTrait()
		let context = {
			strokeStyle:'123',
			rendering:{
				entity:{
					x:0, y:0,
					width:0, height:0
				}
			},
			rendererContext:{
				strokeRect: sinon.spy()
			}
		}
		trait.process(context)
		expect(context.rendererContext.strokeStyle).to.equal('123')
		expect(context.rendererContext.strokeRect.calledOnce).to.be.true
	})

	it('should ScaleTransformer', function(){
		let scalingFactor = 14
		let trait = new ScaleTransformer(scalingFactor)
		let context = {
			rendering:{
				entity:{
					x: 5, y:12,
					width: 2, height:15
				}
			}
		}
		trait.process(context)
		expect(context.rendering.entity.x).to.equal(5 * scalingFactor)
		expect(context.rendering.entity.y).to.equal(12 * scalingFactor)
		expect(context.rendering.entity.width).to.equal(2 * scalingFactor)
		expect(context.rendering.entity.height).to.equal(15 * scalingFactor)

		let badContext = {}
		expect(() => trait.process(badContext)).to.throw('ScaleTransformer attempted to process an entity that did not have context.rendering or context.rendering.entity defined.')
	})

	it ('should StrokeStyle', function(){
		let trait = new StrokeStyle('red')
		let context = {}
		trait.process(context)
		expect(trait.strokeStyle).to.equal('red')
	})
})
