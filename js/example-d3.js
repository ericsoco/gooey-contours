import * as d3 from 'd3';
import { contourDensity } from 'd3-contour';

/**
 * set up empty d3 workspace with conventional margins
 * https://bl.ocks.org/mbostock/3019563
 */
export default function () {

	function init () {
		initGraph();
	};

	function initGraph () {

		let app = d3.select('#app')
				.attr('class', 'example-d3'),
			graph,
			margin = {
				top: 0,
				right: 0,
				bottom: 0,
				left: 0
			},
			outerWidth = app.node().offsetWidth,
			outerHeight = app.node().offsetHeight,
			width = outerWidth - margin.left - margin.right,
			height = outerHeight - margin.top - margin.bottom;

		graph = app.append('svg')
			.attr('width', outerWidth)
			.attr('height', outerHeight)
		.append('g')
			.attr('transform', `translate(${ margin.left }, ${ margin.top })`);

		var x = d3.scaleLinear()
			.rangeRound([0, width]);

		var y = d3.scaleLinear()
			.rangeRound([height, 0]);

		d3.tsv('./data/faithful.tsv', function(d) {
			d.eruptions = +d.eruptions;
			d.waiting = +d.waiting;
			return d;
		}, function(error, faithful) {
			if (error) throw error;

			x.domain(d3.extent(faithful, function(d) { return d.waiting; })).nice();
			y.domain(d3.extent(faithful, function(d) { return d.eruptions; })).nice();

			graph.insert('g', 'g')
				.attr('fill', 'none')
				.attr('stroke', 'steelblue')
				.attr('stroke-linejoin', 'round')
			.selectAll('path')
			.data(contourDensity()
				.x(function(d) { return x(d.waiting); })
				.y(function(d) { return y(d.eruptions); })
				.size([width, height])
				.bandwidth(40)
				(faithful))
			.enter().append('path')
				.attr('d', d3.geoPath());

			graph.append('g')
				.attr('stroke', 'white')
			.selectAll('circle')
			.data(faithful)
			.enter().append('circle')
				.attr('cx', function(d) { return x(d.waiting); })
				.attr('cy', function(d) { return y(d.eruptions); })
				.attr('r', 2);

			graph.append('g')
				.attr('transform', 'translate(0,' + (height - margin.bottom) + ')')
				.call(d3.axisBottom(x))
			.select('.tick:last-of-type text')
			.select(function() { return this.parentNode.appendChild(this.cloneNode()); })
				.attr('y', -3)
				.attr('dy', null)
				.attr('font-weight', 'bold')
				.text('Idle (min.)');

			graph.append('g')
				.attr('transform', 'translate(' + margin.left + ',0)')
				.call(d3.axisLeft(y))
			.select('.tick:last-of-type text')
			.select(function() { return this.parentNode.appendChild(this.cloneNode()); })
				.attr('x', 3)
				.attr('text-anchor', 'start')
				.attr('font-weight', 'bold')
				.text('Erupting (min.)');

		});

	}
	
	return {
		init
	};
};
