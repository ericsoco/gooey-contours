import * as d3 from 'd3';
import { contourDensity } from 'd3-contour';

/**
 * set up empty d3 workspace with conventional margins
 * https://bl.ocks.org/mbostock/3019563
 */
export default function () {

	const MODE_SVG = 'svg',
		MODE_CANVAS = 'canvas',
		MODE = MODE_SVG;

	let app,
		width,
		height,
		nodes,
		links;

	let contourGenerator,
		contours;

	let graph,
		circles;

	let canvas,
		ctx;

	let attractParams = {
		strength: {
			base: 0.5,
			value: 0.5,
			mod: 0.45,
			speed: 0.1,
			counter: Math.PI,
		}
	};
	let collisionParams = {
		strength: {
			base: 1.75,
			value: 1.75,
			mod: 1,
			speed: 0.25,
			counter: 0.5 * Math.PI
		},
		radius: {
			base: 2,
			value: 2,
			mod: 0.25,
			speed: 0.003,
			counter: 0.75 * Math.PI
		}
	};
	let simulation;

	function init (params) {
		initGraph();
	};

	function initGraph () {

		app = d3.select('#app')
			.attr('class', 'contour-01');
		let graph,
			margin = {
				top: 0,
				right: 0,
				bottom: 0,
				left: 0
			},
			outerWidth = app.node().offsetWidth,
			outerHeight = app.node().offsetHeight;
		width = outerWidth - margin.left - margin.right,
		height = outerHeight - margin.top - margin.bottom;

		// dummy data
		const RADIUS_MIN = 4;
		const RADIUS_VAR = 16;
		const NUM_NODES = 50;
		nodes = [];
		for (let i=0; i<NUM_NODES; i++) {
			nodes.push({
				x: (0.3 + 0.4 * Math.random()) * width,
				y: (0.3 + 0.4 * Math.random()) * height,
				r: RADIUS_MIN + Math.random() * RADIUS_VAR,
				id: i
			});
		}

		// randomly generate links
		// TODO: not working yet
		// 		 every node must have a link (not yet the case)
		//		 some can have multiple
		//		 therefore, walk thru all nodes instead of picking sources randomly
		// TODO: then, apply contours
		const NODE_LINK_RATIO = 5;
		const NUM_LINKS = Math.floor(NUM_NODES / NODE_LINK_RATIO);
		let source, target;
		links = [];
		for (let i=0; i<NUM_LINKS; i++) {
			source = Math.floor(Math.random() * NUM_NODES);
			target = (source + Math.floor(Math.random() * 10)) % NUM_NODES;
			links.push({
				source,
				target
			});
		}

		/*
		const RADIUS = 4,

		let xScale = d3.scaleLinear()
				.domain([0, 24])
				.range([margin.left, width - margin.right]),
			yScale = d3.scalePoint()
				.domain(organisms.map(o => o.name))
				.range([margin.top, height - margin.bottom])
				.padding(margin.top)
				.round(true),
			rScale = d3.scalePow()
				.domain(d3.extent(allPathways, d => d.totalCount))
				.range([RADIUS, 10*RADIUS])
				.exponent(0.5),
			colorScale = d3.scaleOrdinal(d3.schemeCategory10)
				.domain(organisms.map(o => o.name)),
			rColorScale = d3.scalePow()
				.domain(d3.extent(allPathways, d => d.totalCount))
				.range(['rgba(0, 0, 0, 0.1)', 'rgba(150, 30, 60, 0.3)'])
				.exponent(0.25);
		*/

		simulation = d3.forceSimulation(nodes)
			.force('collision', d3.forceCollide()
				.strength(collisionParams.strength.value)
				.radius(d => 1.5 * d.r)
			)
			/*
			.force('link', d3.forceLink()
				.id(d => d.id)
				.links(links)
				.distance(30)
			)
			*/
			.force('attract', d3.forceManyBody()
				.strength(attractParams.strength.value)
				.distanceMax(600)
			)
			.force('center', d3.forceCenter(
				width/2,
				height/2
			))
			.alphaDecay(0)
			.on('tick', layoutTick);

		contourGenerator = contourDensity()
			.x(d => d.x)
			.y(d => d.y)
			.size([width, height])
			.bandwidth(40);
			// .thresholds([1, 2, 4, 8, 16])
			// .cellSize(16);

		// console.log(contourGenerator.thresholds());

		if (MODE === MODE_CANVAS) {
			canvas = app.append('canvas')
				.attr('width', outerWidth)
				.attr('height', outerHeight);
			ctx = canvas.node().getContext('2d');
			ctx.globalCompositeOperation = 'multiply';
			ctx.translate(margin.left, margin.top);
		} else {
			graph = app.append('svg')
				.attr('width', outerWidth)
				.attr('height', outerHeight)
			.append('g')
				.attr('transform', `translate(${ margin.left }, ${ margin.top })`);

			circles = graph.selectAll('circle')
			.data(nodes)
			.enter().append('circle')
				.attr('cx', d => d.x)
				.attr('cy', d => d.y)
				.attr('r', d => d.r);

			//
			// TODO NEXT:
			// get these contours to update on draw()
			//
			contours = graph.selectAll('path')
				.data(contourGenerator(nodes))
				.enter().append('path')
					.classed('contour', true)
					.attr('d', d3.geoPath());
		}
	}

	function layoutTick () {
		updateParams(collisionParams.strength);
		updateParams(collisionParams.radius);
		updateParams(attractParams.strength);
		simulation.force('collision')
			.strength(collisionParams.strength.value)
			.radius(d => collisionParams.radius.value * d.r);
		simulation.force('attract').strength(attractParams.strength.value);

		/*
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
		*/

		draw();
	}

	function updateParams (params) {
		params.counter += params.speed;
		params.value = params.base + Math.sin(params.counter) * params.mod;
	}

	function draw () {
		if (MODE === MODE_CANVAS) {
			ctx.clearRect(0, 0, width, height);
			nodes.forEach(d => {
				// ctx.strokeStyle = colorScale(d.pathway.orgName);
				// ctx.fillStyle = colorScale(d.pathway.orgName);
				ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
				// ctx.lineWidth = 3;
				ctx.beginPath();
				ctx.arc(d.x, d.y, d.r, 0, 2*Math.PI);
				// ctx.stroke();
				ctx.fill();
			});
		} else {
			circles
				.attr('cx', d => d.x)
				.attr('cy', d => d.y)
				.attr('r', d => d.r);

			contours.data(contourGenerator(nodes))
				.attr('d', d3.geoPath());
		}
	}
	
	return {
		init
	};
};
