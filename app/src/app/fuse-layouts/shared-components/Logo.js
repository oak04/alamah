import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';

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
	const history = useHistory();

	return (
		<div className={clsx(classes.root, 'flex items-center')}>
			<button type="button" style={{backgroundColor:'transparent'}} className={clsx(classes.root, 'flex items-center')} onClick={()=> history.push('/wathyqe')}>
				<img className="logo-icon" src="assets/images/logos/alamahLogo.png" alt="logo" width="60px" />
				<Typography className="text-28 pb-2 leading-none mx-12 font-medium logo-text" color="#50F2F2">
					{t('alamah')}
				</Typography>
			</button>
		</div>
	);
}

export default Logo;
