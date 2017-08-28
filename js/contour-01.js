import * as d3 from 'd3';
import * as d3ScaleChromatic from 'd3-scale-chromatic';
import { contourDensity } from 'd3-contour';

/**
 * set up empty d3 workspace with conventional margins
 * https://bl.ocks.org/mbostock/3019563
 */
export default function () {

	const MODE_SVG = 'svg',
		MODE_CANVAS = 'canvas',
		MODE = MODE_CANVAS;

	let app,
		width,
		height,
		nodes,
		links;

	let contourGenerator,
		contours,
		colorScale;

	let graph,
		circles;

	let canvas,
		ctx,
		path;

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
				// x: (0.3 + 0.4 * Math.random()) * width,
				// y: (0.3 + 0.4 * Math.random()) * height,
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
			.bandwidth(40)
			.thresholds(10);
			// .cellSize(64);

		if (MODE === MODE_CANVAS) {
			canvas = app.append('canvas')
				.attr('width', outerWidth)
				.attr('height', outerHeight);
			ctx = canvas.node().getContext('2d');
			// ctx.globalCompositeOperation = 'multiply';
			ctx.translate(margin.left, margin.top);

			path = d3.geoPath().context(ctx);
			// colorScale = d3.scaleSequential(d3.interpolateRainbow);
			colorScale = d3.scaleSequential(d3ScaleChromatic.interpolateYlGnBu);
			// colorScale = d3.scaleSequential(d3.interpolateCool);
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

		draw();
	}

	function updateParams (params) {
		params.counter += params.speed;
		params.value = params.base + Math.sin(params.counter) * params.mod;
	}

	function draw () {
		if (MODE === MODE_CANVAS) {
			ctx.clearRect(0, 0, width, height);

			// TODO:
			// reduce alpha of higher-index contours to work better with multiply
			// find nice color scale
			// fix up motion of nodes

			contours = contourGenerator(nodes);
			colorScale.domain([0, contours.length]);
			contours.forEach((d, i) => {
				ctx.fillStyle = colorScale(i);
				ctx.beginPath();
				path(d);
				ctx.fill();
			});

			nodes.forEach(d => {
				ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
				// ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
				// ctx.lineWidth = 3;
				ctx.beginPath();
				ctx.arc(d.x, d.y, d.r, 0, 2*Math.PI);
				ctx.stroke();
				// ctx.fill();
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
