import DemoContent from '@fuse/core/DemoContent';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { makeStyles } from '@material-ui/core/styles';
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles({
	layoutRoot: {}
});

function SimpleFullWidthSample() {
	const classes = useStyles();
	const { t } = useTranslation();

	return (
		<FusePageCarded
			classes={{
				root: classes.layoutRoot
			}}
			header={
				<div className="p-24">
					<h4>{t('SEARCH_PLACEHOLDER')}</h4>
				</div>
			}
			contentToolbar={
				<div className="px-24">
					<h4>{t('TITLE')}</h4>
				</div>
			}
			content={
				<div className="p-24">
					<h4>Content</h4>
					<br />
					<DemoContent />
				</div>
			}
		/>
	);
}

export default SimpleFullWidthSample;
