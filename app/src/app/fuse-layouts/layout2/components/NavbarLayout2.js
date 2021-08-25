import { makeStyles } from '@material-ui/core/styles';
import Logo from 'app/fuse-layouts/shared-components/Logo';
import Icon from '@material-ui/core/Icon';
import clsx from 'clsx';
import { memo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setDefaultSettings } from 'app/store/fuse/settingsSlice';

import LanguageSwitcher from '../../shared-components/LanguageSwitcher';

const useStyles = makeStyles(theme => ({
	root: {
		backgroundColor: theme.palette.background.default,
		color: theme.palette.text.primary
	}
}));

function NavbarLayout2(props) {
	const classes = useStyles(props);
	const dispatch = useDispatch();
	const settings = useSelector(({ fuse }) => fuse.settings.current);
	const [mood, setMood] = useState(settings.theme.main);

	function changeTheme() {
		mood === 'dark6' ? setMood('dark5') : setMood('dark6');
		const newSettings = {
			...settings,
			theme: {
				main: mood === 'dark6' ? 'dark5' : 'dark6',
				navbar: mood === 'default' ? 'dark3' : 'dark3',
				toolbar: mood === 'default' ? 'dark3' : 'dark3',
				footer: mood === 'default' ? 'dark3' : 'dark3'
			}
		};

		dispatch(setDefaultSettings(newSettings));
	}
	return (
		<div className={clsx('w-full shadow-md', classes.root, props.className)}>
			<div
				className={clsx(
					'flex flex-auto justify-between items-center w-full h-full container p-0 lg:px-24 z-20'
				)}
			>
				<div className="flex flex-shrink-0 items-center px-8">
					<Logo />
				</div>
				<div style={{ display: 'flex', width: '120px', justifyContent: 'space-between' }}>
					{mood === 'dark5' && (
						<button onClick={changeTheme} type="button">
							<Icon className="text-20 " color="action">
								brightness_2
							</Icon>
						</button>
					)}
					{mood === 'dark6' && (
						<button onClick={changeTheme} type="button">
							<Icon className="text-20" color="action">
								wb_sunny
							</Icon>
						</button>
					)}

					<LanguageSwitcher />
				</div>
			</div>
		</div>
	);
}

export default memo(NavbarLayout2);
