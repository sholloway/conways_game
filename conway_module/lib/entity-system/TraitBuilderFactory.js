
const {
	CircleTrait,
	ClearArea,
	ColorByAgeTrait,
	ColorByContents,
	DarkFillTrait,
	DarkThinLines,
	FilledRectTrait,
	FillStyle,
	GridPattern,
	ProcessBoxAsRect,
	RectOutlineTrait,
	ScaleTransformer,
	StrokeStyle,
	Trait
} = require('./traits.js');

class TraitBuilderFactory{
	static select(traitName){
		let builder;
		switch (traitName){
			case	'DarkThinLines':
				builder = () => { return new DarkThinLines(); };
				break;
			case 'FilledRectTrait':
					builder = () => { return new FilledRectTrait(); };
					break;
				case 'FillStyle':
					builder = () => { return new FillStyle(); };
					break;
			case 'GridPattern':
				builder = () => { return new GridPattern(); };
				break;
			case 'ProcessBoxAsRect':
				builder = () => { return new ProcessBoxAsRect(); };
				break;
			case 'Trait':
			default:
				builder = () => { return new Trait(); };
				break;
		}
		return builder;
	}
}

module.exports = TraitBuilderFactory;
