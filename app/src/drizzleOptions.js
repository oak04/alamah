import FootPrinter from './contracts/FootPrinter.json';

const options = {
	web3: {
		fallback: {
			type: 'ws',
			url: 'ws://localhost:7545'
		}
	},
	contracts: [FootPrinter],
	events: {
		FootPrinter: ['NewFootPrint']
	}
};

export default options;
