import 'babel-polyfill';
import vanilla from './example-vanilla';
import d3 from './example-d3';
import contour01 from './contour-01';

const imports = {
	vanilla,
	d3,
	contour01
}

const init = (moduleName, params) => {

	params = params ? params.split(',') : [];

	let module = imports[moduleName];
	if (module) {
		return module().init(params);
	} else {
		console.error(`No module matching ${ moduleName } found.`);
	}

}

let containingScriptTag = document.querySelector('script[data-module]') || { dataset: {} },
	{ module, params } = containingScriptTag.dataset;
init(module, params);
