import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles(theme => ({
	root: {
		'& .logo-icon': {
			transition: theme.transitions.create(['width', 'height'], {
				duration: theme.transitions.duration.shortest,
				easing: theme.transitions.easing.easeInOut
			})
		},
		'& .react-badge, & .logo-text': {
			transition: theme.transitions.create('opacity', {
				duration: theme.transitions.duration.shortest,
				easing: theme.transitions.easing.easeInOut
			})
		}
	},
	reactBadge: {
		backgroundColor: '#121212',
		color: '#61DAFB'
	}
}));

function Logo() {
	const classes = useStyles();
	const { t } = useTranslation();

	return (
		<div className={clsx(classes.root, 'flex items-center')}>
			<img className="logo-icon" src="assets/images/logos/alamahLogo.png" alt="logo" width="60px" />
			<Typography className="text-28 pb-2 leading-none mx-12 font-medium logo-text" color="#50F2F2">
				{t('alamah')}
			</Typography>
		</div>
	);
}

export default Logo;
