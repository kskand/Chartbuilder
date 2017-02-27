// Svg text elements used to describe chart
import React, {PropTypes} from 'react';
const markdown = require("markdown-it")();
import {reduce, map} from 'lodash';

const config = {
	textDy: 0.7,
	textLineHeight: 1.2
};

/**
 * An Svg <text> element with experimental text wrapping support
 * @instance
 * @memberof RendererWrapper
 */
class SvgText extends React.Component {

	constructor(props) {
    super(props);

    this.state = {
			lines: [ props.text ]
		};
  }

	shouldComponentUpdate (nextProps, nextState) {
		if ((nextState.lines.length !== this.state.lines.length) && nextProps.onUpdate && nextProps.wrap) {
			if (nextState.lines.length === 1) {
				this.props.onUpdate(0);
			} else {
				this.props.onUpdate((nextState.lines.length) * this.props.heightPerLine);
			}
			return false;
		}
		if (nextProps.text !== this.props.text) {
			return true;
		}
		const t1 = this.props.translate;
		const t2 = nextProps.translate;
		const newTrans = ( (t1[0] !== t2[0]) || (t1[1] !== t2[1]) );
		if (newTrans) {
			return true;
		}
		if (this.props.maxWidth !== nextProps.maxWidth) {
			return true;
		}

		return true;
	}

	_wrapLines (props) {
		let lines = [];

		if (props.wrap) {
			maxCharacters = props.maxCharacters;
			const newWords = props.text.split(" ");
			let words = [];
			let spanLength = 0;
			let cont_bold = false;
			let cont_ital = false;

			newWords.forEach(function(word) {
				if (spanLength + word.length > maxCharacters) {
					lines.push(words.join(" "));
					words.length = 0;
					spanLength = 0;
				}
				spanLength += word.length;
				words.push(word);
			});

			if (words.length) {
				let line = words.join(" ");

				//make sure we don't break markdown styling by splitting a line
				//this will break if _**italic bold**_ is used but not if **_bold italic_** is used

				if(cont_bold) {
					//start with a bold token if a bold token had to be added to the end previous line
					line = "**" + line;
					cont_bold = false;
				}

				if(cont_ital) {
					//start with a italic token if a italic token had to be added to the end previous line
					line = "_" + line;
					cont_ital = false;
				}

				if(line.split("**").length % 2 == 0 && props.text.split("**").length % 2 != 0) {
					//end with a bold token if the line left an odd number of them
					line += "**";
					cont_bold = true;
				}

				if(line.split("_").length % 2 == 0 && props.text.split("_").length % 2 != 0) {
					//end with a italic token if the line left an odd number of them
					line += "_";
					cont_ital = true;
				}

				lines.push(line);
			}
		} else {
			lines = [props.text];
		}

		return {
			lines: lines
		};
	}

	componentWillMount () {
		if (this.props.text && this.props.wrap) {
			const lineSettings = this._wrapLines(this.props, this.state);
			this.setState(lineSettings);
		}
	}

	componentDidMount () {
		if (this.props.onUpdate && this.props.wrap) {
			if (this.state.lines.length === 1) {
				this.props.onUpdate(0);
			} else {
				this.props.onUpdate((this.state.lines.length) * this.props.heightPerLine);
			}
		}
	}

	componentWillReceiveProps (nextProps) {
		if (this.props.wrap) {
			const lineSettings = this._wrapLines(nextProps);
			this.setState(lineSettings);
		}
	}

	_markdownToTspans (token) {
		if (!token) return null;
		const children = token[0].children;

		// take markdown-it parsed markdown and return an array of objs like
		// { tags: ["em", "strong"], content: "some text…"
		const tagged = reduce(children, function(prev, child) {
			if (child.nesting === 1) {
				prev[prev.length - 1].tags = prev[prev.length - 1].tags.concat([child.tag]);
				return prev;
			} else if (child.nesting === 0 && child.content !== "") {
				prev[prev.length - 1].content = child.content;
				prev = prev.concat([{ tags: [] }]);
				return prev;
			} else {
				return prev;
			}
		}, [{ tags: [] }]);

		return tagged.map(function(input, index) {
			if (!input.content) return null;

			return (
				<tspan className = {input.tags.join(" ")} key={index} >
					{input.content}
				</tspan>
			);
		});
	}

	render () {
		let textNodes;
		let parsed_text;
		const mdToSpans = this._markdownToTspans;
		if (this.props.wrap) {
			textNodes = this.state.lines.map(function(text, i) {
				return (
					<text
						dy={(i * config.textLineHeight).toString() + "em"}
						y="0"
						x="0"
						key={i}
					>
						{ mdToSpans(markdown.parseInline(this.props.text)) }
					</text>
				);
			});
		} else {
			let dy;
			if (this.props.align === "bottom") {
				dy = "-0.35em";
			} else if (this.props.align === "top"){
				dy = "0.35em";
			} else {
				dy = "0em";
			}

			textNodes = (
				<text y="0" x="0" dy={dy} >
					{mdToSpans(markdown.parseInline(this.props.text))}
				</text>
			);
		}
		return (
			<g
				className={["svg-text", this.props.className].join(" ")}
				transform={"translate(" + this.props.translate + ")"}
			>
				{textNodes}
			</g>
		);
	}
};

SvgText.propTypes = {
	className: PropTypes.string,
	heightPerLine: PropTypes.number,
	onUpdate: PropTypes.func,
	translate: PropTypes.array.isRequired,
	text: PropTypes.string.isRequired,
	wrap: PropTypes.bool,
	maxCharacters: PropTypes.number
}

SvgText.defaultProps = {
	wrap: false,
	maxCharacters: 100
};

module.exports = SvgText;
