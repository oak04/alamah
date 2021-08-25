import React from 'react';
import FuseLayout from '@fuse/core/FuseLayout';
import FuseTheme from '@fuse/core/FuseTheme';
import history from '@history';
import { createGenerateClassName, jssPreset, StylesProvider } from '@material-ui/core/styles';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { create } from 'jss';
import jssExtend from 'jss-plugin-extend';
import rtl from 'jss-rtl';
import Provider from 'react-redux/es/components/Provider';
import { Router } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import DateFnsUtils from '@date-io/date-fns';
import { drizzleReactHooks } from '@drizzle/react-plugin';
import { Drizzle } from '@drizzle/store';
import { IPFSProvider } from './IPFSContext';
import AppContext from './AppContext';
import routes from './fuse-configs/routesConfig';
import store from './store';

import drizzleOptions from '../drizzleOptions';

const drizzle = new Drizzle(drizzleOptions);

const jss = create({
	...jssPreset(),
	plugins: [...jssPreset().plugins, jssExtend(), rtl()],
	insertionPoint: document.getElementById('jss-insertion-point')
});

const generateClassName = createGenerateClassName({ disableGlobal: true });

const App = () => {
	return (
		<drizzleReactHooks.DrizzleProvider drizzle={drizzle}>
			<drizzleReactHooks.Initializer error="Drizzle init error">
				<IPFSProvider>
					<AppContext.Provider
						value={{
							routes
						}}
					>
						<StylesProvider jss={jss} generateClassName={generateClassName}>
							<Provider store={store}>
								<MuiPickersUtilsProvider utils={DateFnsUtils}>
									<Router history={history}>
										<FuseTheme>
											<SnackbarProvider
												maxSnack={5}
												anchorOrigin={{
													vertical: 'bottom',
													horizontal: 'right'
												}}
												classes={{
													containerRoot: 'bottom-0 right-0 mb-52 md:mb-68 mr-8 lg:mr-80 z-99'
												}}
											>
												<FuseLayout />
											</SnackbarProvider>
										</FuseTheme>
									</Router>
								</MuiPickersUtilsProvider>
							</Provider>
						</StylesProvider>
					</AppContext.Provider>
				</IPFSProvider>
			</drizzleReactHooks.Initializer>
		</drizzleReactHooks.DrizzleProvider>
	);
};

export default App;
