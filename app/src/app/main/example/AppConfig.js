import Example from './Example';
import Prove from './Prove';

const aa = () => <p>hi :)</p>;

const AppConfig = {
	settings: {
		layout: {
			config: {}
		}
	},
	routes: [
		{
			path: '/',
			exact: true,
			component: aa
		},
		{
			path: '/al-mudawnah',
			exact: true,
			component: Example
		},
		{
			path: '/wathyqe',
			exact: true,
			component: Prove
		},
		{
			path: '/tahakaq',
			exact: true,
			component: Example
		}
	]
};

export default AppConfig;

/**
 * Lazy load Example
 */
/*
import React from 'react';

const AppConfig = {
    settings: {
        layout: {
            config: {}
        }
    },
    routes  : [
        {
            path     : '/example',
            component: React.lazy(() => import('./Example'))
        }
    ]
};

export default ExampleConfig;

*/
