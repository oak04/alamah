import { Redirect } from 'react-router-dom';
import FuseUtils from '@fuse/utils';
import AppConfig from 'app/main/example/AppConfig';

const routeConfigs = [AppConfig];

const routes = [
	...FuseUtils.generateRoutesFromConfigs(routeConfigs, null),
	{
		component: () => <Redirect to="/404" />
	}
];

export default routes;
