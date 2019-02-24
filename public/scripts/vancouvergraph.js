var width = 720, height = 450;
var margins = { top: 10, left: 175, right: 50, bottom: 50, between: 50 };
var bottomGraphHeight = 50;
var topGraphHeight = height - (margins.top + margins.bottom + margins.between + bottomGraphHeight);
var graphWidths = width - margins.left - margins.right;
var svg = d3.select('body')
			.append('svg')
			.attrs({width: width, height: height})
			.style('font', '10px sans-serif');
// clipping path (for styling the lines - see below)
// From MDN: "The clipping path restricts the region to which paint can be applied." 
svg.append('defs')
	  .append('clipPath')
	  .attr('id', 'clip')
	  .append('rect')
	  .attrs({width: width, height: height});
// create the "focus" graph (top) and "context" graph (top)
var focus = svg.append('g')
			   .attr('transform', 'translate(' + margins.left + ',' + margins.top + ')');
var context = svg.append('g')
			   .attr('transform', 'translate(' + margins.left + ',' + (margins.top + topGraphHeight + margins.between) + ')');
// create the scales and axes
var xScaleTop = d3.scaleTime().range([0, graphWidths]),
	xScaleBottom = d3.scaleTime().range([0, graphWidths]),
	yScaleTop = d3.scaleLinear().range([topGraphHeight, 0]),
	yScaleBottom = d3.scaleLinear().range([bottomGraphHeight, 0]);	
var xAxisTop = d3.axisBottom(xScaleTop),
	xAxisBottom = d3.axisBottom(xScaleBottom),
	yAxisTop = d3.axisLeft(yScaleTop);	
xAxisTop.tickSize(0);
// draw the lines
var lineTop = d3.line().x(function (d) { return xScaleTop(d.date); })
					   .y(function (d) { return yScaleTop(d.close); });
// lineTop is a line generator: "Generates a line for the given array of data"
// "When a line is generated, the x accessor will be invoked for each defined element in the input data array"; passed d, i, array
// "This line generator can then be used to compute the d attribute of an SVG path element: path.datum(data).attr('d', line);"
var lineBottom = d3.line().x(function (d) { return xScaleBottom(d.date); })
						  .y(function (d) { return yScaleBottom(d.close); });
// create the brush
var brush = d3.brushX()
			  .extent([[0, 0], [graphWidths, bottomGraphHeight]])
			  .on('brush', function () {
					var s = d3.event.selection;  // current brush selection = [x0, x1]
					xScaleTop.domain(s.map(xScaleBottom.invert)); 
					// scale.invert returns a value from the domain for a given value from the range
					// e.g. xScaleTop.invert(400) = Sun Jun 21 2009 01:06:58 GMT-0400 (EDT)
					focus.select('.x.axis').call(xAxisTop);  // update the x-axis of the focus graph
					focus.select('.line').attr('d', lineTop);  // update the line of the focus graph
			  });
// brush.extent() "sets the brushable extent to...[[x0, y0], [x1, y1]], where [x0, y0] is the top-left corner and [x1, y1] is the bottom-right corner"
// brush.on(typename, listener): set event listener for a typename (start, brush, end); 'brush' type is triggered when brush moves
// when the brush event listener is invoked, d3.event is set to the current brush event
			  
var parseDate = d3.timeParse('%d-%b-%y');

d3.tsv('https://gist.githubusercontent.com/d3byex/b6b753b6ef178fdb06a2/raw/0c13e82b6b59c3ba195d7f47c33e3fe00cc3f56f/aapl.tsv')
  .then(function (data) {
	data.forEach(function (d) {
		d.date = parseDate(d.date);
		d.close = +d.close;
	});
	// The Array.forEach() method "calls a provided function once for each element in an array, in order."
	xScaleTop.domain(d3.extent(data, function (d) { return d.date; }));
	yScaleTop.domain(d3.extent(data, function (d) { return d.close; }));
	xScaleBottom.domain(d3.extent(data, function (d) { return d.date; }));
	yScaleBottom.domain(d3.extent(data, function (d) { return d.close; }));
	var topXAxisNodes = focus.append('g')
							 .attrs({class: 'x axis', 
									 transform: 'translate(0,' + (margins.top + topGraphHeight) + ')'})
							 .call(xAxisTop);
	topXAxisNodes.select('.domain').attr('stroke-width', 0);
	focus.append('path').datum(data)
						.attrs({class: 'line', d: lineTop});
	// selection.datum(): "Gets or sets the bound data for each selected element." (but doesn't affect enter/exit selections)
	var topYAxisNodes = focus.append('g').call(yAxisTop);
	context.append('path').datum(data)
						  .attrs({class: 'line', d: lineBottom});
	var bottomXAxisNodes = context.append('g')
								  .attr('transform', 'translate(0,' + bottomGraphHeight + ')')
								  .call(xAxisBottom);
	
	context.append('g').call(brush)  // apply the brush to the group (must be a <g> element)
	context.selectAll('.selection').attrs({stroke: '#000', 'fill-opacity': 0.125});
	styleLines(svg);
});

function styleLines(svg) {
	svg.selectAll('path.line')
		.attrs({fill: 'none', 'stroke-width': 1.5, stroke: 'steelblue', 'clip-path': 'url(#clip)'});
}