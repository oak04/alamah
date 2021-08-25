import Button from '@material-ui/core/Button';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import Popover from '@material-ui/core/Popover';
import Typography from '@material-ui/core/Typography';
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { changeLanguage } from 'app/store/i18nSlice';
import Icon from '@material-ui/core/Icon';

const languages = [
	{
		id: 'ar',
		title: 'العربية',
		flag: 'sa',
		shortcut: 'العربية'
	},
	{
		id: 'en',
		title: 'English',
		flag: 'us',
		shortcut: 'English'
	}
];

function LanguageSwitcher(props) {
	const dispatch = useDispatch();

	const currentLanguageId = useSelector(({ i18n }) => i18n.language);
	const currentLanguage = languages.find(lng => lng.id === currentLanguageId);

	const [menu, setMenu] = useState(null);

	const langMenuClick = event => {
		setMenu(event.currentTarget);
	};

	const langMenuClose = () => {
		setMenu(null);
	};

	function handleLanguageChange(lng) {
		dispatch(changeLanguage(lng.id));
		langMenuClose();
	}

	return (
		<>
			<Button className="h-40 w-69" onClick={langMenuClick}>
				<Icon className="text-20 " color="action">
					translate
				</Icon>
				<Typography className="mx-4 font-semibold uppercase" color="textSecondary">
					{currentLanguage.shortcut}
				</Typography>
			</Button>

			<Popover
				open={Boolean(menu)}
				anchorEl={menu}
				onClose={langMenuClose}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'center'
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'center'
				}}
				classes={{
					paper: 'py-8'
				}}
			>
				{languages.map(lng => (
					<MenuItem key={lng.id} onClick={() => handleLanguageChange(lng)}>
						<ListItemIcon className="min-w-40">
							<img className="min-w-20" src={`assets/images/flags/${lng.flag}.png`} alt={lng.title} />
						</ListItemIcon>
						<ListItemText primary={lng.title} />
					</MenuItem>
				))}
			</Popover>
		</>
	);
}

export default LanguageSwitcher;
