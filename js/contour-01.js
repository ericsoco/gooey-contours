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
	const SHOW_NODES = false;
	const BLEND_MULTIPLY = true;

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
			base: 16,
			value: 16,
			mod: 16,
			speed: 0.01,
			counter: 0.5 * Math.PI,
		}
	};
	let collisionParams = {
		strength: {
			base: 4,
			value: 4,
			mod: 4,
			speed: 0.01,
			counter: Math.PI
		},
		radius: {
			base: 4,
			value: 4,
			mod: 4,
			speed: 0.01,
			counter: Math.PI
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
		const RADIUS_MIN = 8;
		const RADIUS_VAR = 16;
		const NUM_NODES = 50;
		nodes = [];
		for (let i=0; i<NUM_NODES; i++) {
			nodes.push({
				// x: (0.3 + 0.4 * Math.random()) * width,
				// y: (0.3 + 0.4 * Math.random()) * height,
				// r: RADIUS_MIN + Math.random() * RADIUS_VAR,
				r: RADIUS_MIN,
				id: i
			});
		}

		/*
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
			.bandwidth(40)
			.thresholds(16);
			// .cellSize(64);

		if (MODE === MODE_CANVAS) {
			canvas = app.append('canvas')
				.attr('width', outerWidth)
				.attr('height', outerHeight);
			ctx = canvas.node().getContext('2d');
			if (BLEND_MULTIPLY) ctx.globalCompositeOperation = 'multiply';
			ctx.translate(margin.left, margin.top);

			path = d3.geoPath().context(ctx);
			// colorScale = d3.scaleSequential(d3ScaleChromatic.interpolateYlGnBu);
			colorScale = d3.scaleSequential(d3.interpolateCubehelixDefault);
			
			// colorScale = d3.scaleSequential(d3ScaleChromatic.interpolatePuBu);
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

			contours = contourGenerator(nodes);
			const numContours = contours.length;
			// colorScale.domain([0, (BLEND_MULTIPLY ? 1.5 : 1) * numContours]);
			colorScale.domain([(BLEND_MULTIPLY ? 1.5 : 1) * numContours, 0]);		// reverse for cubehelix
			contours.forEach((d, i) => {
				let color = colorScale(i);
				if (BLEND_MULTIPLY) {
					color = d3.color(colorScale(i));
					color.opacity = 1 - 0.75 * Math.pow(i / numContours, 0.75);
				}
				// console.log(i, color);
				ctx.fillStyle = color;
				ctx.beginPath();
				path(d);
				ctx.fill();
			});

			if (SHOW_NODES) {
				nodes.forEach(d => {
					ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
					ctx.beginPath();
					ctx.arc(d.x, d.y, d.r, 0, 2*Math.PI);
					ctx.stroke();
				});
			}
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
