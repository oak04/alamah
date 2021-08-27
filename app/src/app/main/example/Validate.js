import FusePageCarded from '@fuse/core/FusePageCarded';
import { makeStyles } from '@material-ui/core/styles';
import { useTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';
import { useCallback, useState, useEffect, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import _ from '@lodash';
import {  FormProvider } from 'react-hook-form';
import TextField from '@material-ui/core/TextField';
import clsx from 'clsx';
import Icon from '@material-ui/core/Icon';
import { Base64 } from 'js-base64';
import CircularProgress from '@material-ui/core/CircularProgress';
import { drizzleReactHooks } from '@drizzle/react-plugin';
import CopyIcon from '@material-ui/icons/FileCopy';
import { Grid, Divider } from '@material-ui/core';
import EthCrypto from 'eth-crypto';
import mime from 'mime-types';
import { IPFSContext } from '../../IPFSContext';

const useStyles = makeStyles({
	layoutRoot: {}
});

function Validate() {
	const classes = useStyles();
	const [footprintId, setfootprintId] = useState('');
	const [selectedTimestamp, setSelectedTimestamp] = useState(undefined);
	const [footprintCount, setfootprintCount] = useState(0);
	const [success, setSuccess] = useState(undefined);

	const [publicAddress, setPublicAddress] = useState('');
	const [file, setFile] = useState(undefined);
	const [fileContent, setFileContent] = useState(undefined);
	const [validationSuccess, setValidationSuccess] = useState(undefined);
	const [mimeTypeInput, setMimeTypeInput] = useState('');
	const [mimeType, setMimeType] = useState(undefined);
	const [privateKey, setPrivateKey] = useState('');
	const [loading, setLoading] = useState(false);

	const { ipfsClient } = useContext(IPFSContext);

	const openFile = useCallback(
		data => {
			// data has to be of type array
			const blob = new Blob(data, { type: mimeType });
			const url = URL.createObjectURL(blob);
			window.open(url);
		},
		[mimeType]
	);

	const downloadContent = useCallback(async () => {
		setLoading(true);
		const chunks = [];
		// eslint-disable-next-line no-restricted-syntax
		for await (const chunk of ipfsClient.cat(selectedTimestamp.cid)) {
			chunks.push(chunk);
		}

		setLoading(false);
		openFile(chunks);
	}, [selectedTimestamp, ipfsClient, openFile]);

	const downloadAndDecryptContent = async () => {
		try {
			setLoading(true);

			const chunks = [];
			try {
				const { cid } = selectedTimestamp;

				// eslint-disable-next-line no-restricted-syntax
				for await (const chunk of ipfsClient.cat(cid)) {
					chunks.push(chunk);
					console.log(chunk)
				}
			} catch (error) {
				console.error(error);
			}
			// use blob as workaround for parsing the downloaded data chunks
			const blob = await new Blob(chunks, { type: '' });
			const cipherString = await blob.text();
			const cipherObject = await EthCrypto.cipher.parse(cipherString);

			const decrypted = await EthCrypto.decryptWithPrivateKey(privateKey, cipherObject);

			const binaryContent = await Base64.atob(decrypted);
			const binaryContentArray = await binaryContent.split(',');
			const uintArray = await new Uint8Array(binaryContentArray);

			openFile([uintArray]);
		} catch (error) {
			console.error(error);
			setLoading(false);
		} finally {
			setLoading(false);
		}
	};

	const handleMimeTypeChange = useCallback(event => {
		const input = event.target.value;
		setMimeTypeInput(input);

		const foundMimeType = mime.lookup(input);
		setMimeType(foundMimeType);
	}, []);

	const { t } = useTranslation();
	const [tabValue, setTabValue] = useState(0);

	const { drizzle } = drizzleReactHooks.useDrizzle();
	const { web3 } = drizzle;
	const { FootPrinter } = drizzle.contracts;

	const history = useHistory();

	const timestampStore = drizzleReactHooks.useDrizzleState(drizzleState => ({
		...drizzleState.contracts.FootPrinter
	}));

	useEffect(() => {
		const url = new URL(window.location.href);
		const id = url.searchParams.get('id');
		if (id) {
			setfootprintId(id);
		}

		const address = url.searchParams.get('address');
		if (address) {
			setPublicAddress(address);
		}
	}, []);

	useEffect(() => {
		if (footprintId && footprintId < footprintCount) {
			FootPrinter.methods.footPrints(footprintId).call().then(setSelectedTimestamp).catch(console.error);
		} else {
			setSelectedTimestamp(undefined);
		}
	}, [footprintId, footprintCount, FootPrinter.methods]);

	useEffect(() => {
		if ('0x0' in timestampStore.getFootPrintsCount) {
			// eslint-disable-next-line radix
			setfootprintCount(parseInt(timestampStore.getFootPrintsCount['0x0'].value));
		}
	}, [timestampStore.getFootPrintsCount]);

	useEffect(() => {
		if (!file) {
			return;
		}
		file.arrayBuffer().then(contentBuffer => {
			setFileContent(contentBuffer);
		});
	}, [file]);

	FootPrinter.methods.getFootPrintsCount.cacheCall();

	const onDrop = useCallback(acceptedFiles => {
		if (acceptedFiles.length) {
			const selectedFile = acceptedFiles[0];
			setFile(selectedFile);
		}
	}, []);

	const validateTimestamp = useCallback(async () => {
		let originalMessage;
		if (selectedTimestamp.cid) {
			originalMessage = selectedTimestamp.cid;
		} else {
			const contentString = Base64.fromUint8Array(new Uint8Array(fileContent));
			originalMessage = web3.utils.sha3(contentString);
		}

		const recoveredAddress = await web3.eth.personal.ecRecover(originalMessage, selectedTimestamp.signature);

		if (recoveredAddress && recoveredAddress.toLowerCase() === publicAddress.toLowerCase()) {
			setValidationSuccess(true);
		} else {
			setValidationSuccess(false);
		}
	}, [fileContent, selectedTimestamp, publicAddress, web3.utils, web3.eth.personal]);

	const onfootprintIdChange = e => {
		setfootprintId(e.target.value);
	};

	const onPublicAddressChange = e => {
		setPublicAddress(e.target.value);
	};

	const copyToClipboard = useCallback(() => {
		navigator.permissions.query({ name: 'clipboard-write' }).then(result => {
			if (result.state === 'granted' || result.state === 'prompt') {
				const url = `https://ipfs.io/ipfs/${selectedTimestamp.cid}`;

				window.navigator.clipboard.writeText(url).then(
					function a() {
						setSuccess(true);
					},
					function b() {
						setSuccess(false);
					}
				);
			}
		});
	}, [selectedTimestamp]);

	return (
		<FormProvider autoComplete="off">
			<FusePageCarded
				classes={{
					root: classes.layoutRoot
				}}
				header={
					<div
						className="pt-44 pb-24"
						style={{ width: '100%', display: 'flex', flexDirection: 'row-reverse' }}
					>
						<Button
							style={{ fontSize: '18px', height: '70px' }}
							color="secondary"
							variant="contained"
							onClick={() => history.push('/wathyqe')}
						>
							{t('proveOwnership')}
						</Button>
					</div>
				}
				contentToolbar={
					<Tabs
						value={tabValue}
						indicatorColor="primary"
						textColor="primary"
						variant="scrollable"
						scrollButtons="auto"
						classes={{ root: 'w-full h-64' }}
					>
						<Tab style={{ fontSize: '18px' }} className="h-64" label={t('digitalAsset')} />
					</Tabs>
				}
				content={
					<div className="p-16 sm:p-24 max-w-2xl">
						<div className={tabValue !== 0 ? 'hidden' : ''}>
							<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
								<div style={{ display: 'flex', width: '75%' }}>
									<TextField
										error={Boolean(footprintId) && footprintId >= footprintCount}
										label={footprintId >= footprintCount ? t('itmid') : t('tmid')}
										fullWidth
										variant="filled"
										value={footprintId}
										onChange={onfootprintIdChange}
									/>
								</div>
								<div style={{ display: 'flex', width: '20%' }}>
									<div className={classes.buttonContainer}>
										<Button
											color="secondary"
											variant="outlined"
											endIcon={<CopyIcon />}
											onClick={copyToClipboard}
										>
											{t('cp')}
										</Button>
										{success !== undefined ? (
											success === true ? (
												<Typography variant="body1" style={{ marginLeft: 8 }}>
													Successfully copied to clipboard!
												</Typography>
											) : (
												<Typography variant="body1" style={{ marginLeft: 8 }}>
													Something went wrong...
												</Typography>
											)
										) : undefined}
									</div>
								</div>
							</div>
							{selectedTimestamp && (
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										marginBottom: '20px'
									}}
								>
									<div style={{ display: 'flex', flexDirection: 'column', width: '75%' }}>
										<Grid container>
											<Grid container spacing={3}>
												<Grid className={classes.typographyItem} item xs={9}>
													<Typography variant="h6">{selectedTimestamp.timestamp}</Typography>
												</Grid>
											</Grid>
											<Grid container spacing={2}>
												<Grid item xs={3}>
													<Typography variant="h6" align="right">
														<b>Signature</b>
													</Typography>
												</Grid>
												<Grid className={classes.typographyItem} item xs={9}>
													<Typography variant="h6">{selectedTimestamp.signature}</Typography>
												</Grid>
											</Grid>
											<Grid container spacing={2}>
												<Grid item xs={3}>
													<Typography variant="h6" align="right">
														<b>{t('ipfsId')}</b>
													</Typography>
												</Grid>
												<Grid className={classes.typographyItem} item xs={9}>
													<Typography variant="h6">
														{selectedTimestamp.cid ? selectedTimestamp.cid : '-'}
													</Typography>
												</Grid>
											</Grid>
										</Grid>

										<TextField
											className={classes.textField}
											error={mimeType === false}
											label={t('fileExtension')}
											onChange={handleMimeTypeChange}
											placeholder={t('fileExtensionPlaceholder')}
											value={mimeTypeInput}
											fullWidth
										/>
										<TextField
											className={classes.textField}
											label={t('privateKey')}
											placeholder="E..."
											onChange={event => setPrivateKey(event.target.value)}
											value={privateKey}
											fullWidth
										/>
										<Button
											variant="outlined"
											disabled={loading || !mimeType || !privateKey}
											onClick={downloadAndDecryptContent}
											fullWidth
											className="mt-8 mb-16"
											style={{ fontSize: '16px', height: '50px' }}
											color="secondary"
										>
											{t('dnd')}
										</Button>
										<Button
											variant="outlined"
											disabled={loading || !mimeType}
											onClick={downloadContent}
											fullWidth
											className="mt-8 mb-16"
											style={{ fontSize: '16px', height: '50px' }}
											color="secondary"
										>
											{t('d')}
										</Button>
										{loading && <CircularProgress size={36} className={classes.buttonProgress} />}
									</div>
									<div style={{ display: 'flex', width: '20%' }} />
								</div>
							)}
						</div>
					</div>
				}
			/>
		</FormProvider>
	);
}

export default Validate;
