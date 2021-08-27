import FusePageCarded from '@fuse/core/FusePageCarded';
import { makeStyles } from '@material-ui/core/styles';
import { useTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';
import { useCallback, useState, useContext ,useEffect} from 'react';
import { useHistory } from 'react-router-dom';
import _ from '@lodash';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import TextField from '@material-ui/core/TextField';
import clsx from 'clsx';
import Icon from '@material-ui/core/Icon';
import { useDropzone } from 'react-dropzone';
import RootRef from '@material-ui/core/RootRef';
import EthCrypto from 'eth-crypto';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { Base64 } from 'js-base64';
import CircularProgress from '@material-ui/core/CircularProgress';
import { drizzleReactHooks } from '@drizzle/react-plugin';
import CardContent from '@material-ui/core/CardContent';
import { motion } from 'framer-motion';
import Card from '@material-ui/core/Card';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { IPFSContext } from '../../IPFSContext';

const useStyles = makeStyles({
	layoutRoot: {}
});

function ProveEth() {
	const classes = useStyles();
	const { t } = useTranslation();
	const { drizzle } = drizzleReactHooks.useDrizzle();
	const history = useHistory();

	const schema = yup.object().shape({
		signature: yup.string().required(t('signatureRequired')).min(5, t('fiveCahrs')),
		privateKey: yup
			.string()
			.required(t('pkRequired'))
			.min(66, t('pk66Chars'))
			.max(66, t('pk66Chars'))
			.matches('^(0x|0X)?[a-fA-F0-9]+$', t('pk0x')),
		fileExtension: yup.string().required(t('required'))
	});
	const [keys, setKeys] = useState();
	const [transaction, setTransaction] = useState();

	const printDocument = () => {
		let pdf;
		let imgData;
		let can;
		html2canvas(document.querySelector('#capture'))
			.then(canvas => {
				// document.body.appendChild(canvas); // if you want see your screenshot in body.
				imgData = canvas.toDataURL('image/png');
				can = canvas;
			})
			.then(() => {
				// eslint-disable-next-line new-cap
				pdf = new jsPDF('p', 'pt', [can.width, can.height]);
				const pdfWidth = pdf.internal.pageSize.getWidth();
				const pdfHeight = pdf.internal.pageSize.getHeight();
				pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
			})
			.then(() => {
				pdf.save('download.pdf');
			});
	};

	const [signature, setSignature] = useState();
	const methods = useForm({
		mode: 'onChange',
		defaultValues: {},
		resolver: yupResolver(schema),
		reValidateMode: 'onChange'
	});
	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'SAR',
		minimumFractionDigits: 2
	});
	const [file, setFile] = useState(undefined);
	const [invoice, setInvoice] = useState();
	const [ethSuccess, seethSuccess] = useState(false);

	const generateInvoice = () => {
		const services = [
			{
				id: 1,
				title: t('pinToIpfs'),
				unit: 'FIL/GB',
				quantity: '-',
				unitPrice: '0',
				total: '0'
			},
			{
				id: 3,
				title: t('serFee'),
				unit: 'SAR',
				quantity: '1',
				unitPrice: '40',
				total: '40'
			}
		];
		const subtotal = 40;
		const tax = 40 * 0.15;
		const total = 40 * 0.15 + 40;
		setInvoice({ services, subtotal, tax, total });
	};
	const onDrop = useCallback(acceptedFiles => {
		if (acceptedFiles.length) {
			const selectedFile = acceptedFiles[0];
			setFile(selectedFile);
			setUploadIcon('check');
			generateInvoice();
		}
	}, []);
	const { getRootProps, getInputProps } = useDropzone({ onDrop });
	const { ref, ...rootProps } = getRootProps();
	const [tabValue, setTabValue] = useState(0);
	const [uploadIcon, setUploadIcon] = useState('attach_file');

	const generateKeys = () => {
		const identity = EthCrypto.createIdentity();
		methods.setValue('privateKey', identity.privateKey, { shouldValidate: true });
		setKeys({ pr: identity.privateKey, pb: identity.publicKey });
	};
	const setPrKey = pr => {
		let publicKey = '';
		if (pr && pr.length === 66 && pr.match('^(0x|0X)?[a-fA-F0-9]+$')) {
			publicKey = EthCrypto.publicKeyByPrivateKey(pr);
		}
		methods.setValue('privateKey', pr, { shouldValidate: true });
		setKeys({ pr, pb: publicKey });
	};
	function handleTabChange(event, value) {
		setTabValue(value);
	}

	const [ipfsIdentifier, setIPFSIdentifier] = useState('');
	const [loading, setLoading] = useState(false);
	const [fileContent, setFileContent] = useState(undefined);

	const getEncryptedContent = useCallback(async () => {
		const publicKey = EthCrypto.publicKeyByPrivateKey(keys.pr);
	
		const content = Base64.btoa(new Uint8Array(fileContent));
	
		// see https://github.com/pubkey/eth-crypto#encryptwithpublickey
		const encryptedContentObject = await EthCrypto.encryptWithPublicKey(
		  publicKey,
		  content
		);
	
		const encryptedContentString = EthCrypto.cipher.stringify(
		  encryptedContentObject
		);
	
		return encryptedContentString;
	  }, [keys, fileContent]);
	const { currentAccount, ipfsClient } = useContext(IPFSContext);
	useEffect(() => {
		if (!file) {
		  return;
		}
		file.arrayBuffer().then((contentBuffer) => {
		  setFileContent(contentBuffer);
		});
	  }, [file]);
	const onUploadToIPFS = useCallback(async () => {
		const encryptedContent = await getEncryptedContent();

		if (encryptedContent) {
			const f = async () => {
				// eslint-disable-next-line no-restricted-syntax
				for await (const result of ipfsClient.add(encryptedContent)) {
					setIPFSIdentifier(result.path);
				}
			};
			setLoading(true);
			f()
				.catch(console.error)
				.finally(() => setLoading(false));
		}
	}, [getEncryptedContent, ipfsClient]);

	const onAddToEthereum = useCallback(async () => {
		drizzle.contracts.FootPrinter.methods.createFootPrint.cacheSend(ipfsIdentifier, signature, {
			gas: 500000
		});
		setTransaction({
			blockHash: '0x4eb74e9daf39743c47c05d2a5d7826ee89afc3541a47ecff6afb56cb033b4fa5',
			blockNumber: '82'
		});
	}, [drizzle.contracts.FootPrinter.methods, ipfsIdentifier, signature]);

	return (
		<FormProvider {...methods} autoComplete="off">
			<FusePageCarded
				classes={{
					root: classes.layoutRoot
				}}
				header={
					<div
						className="pt-44 pb-24"
						style={{ width: '100%', display: 'flex', flexDirection: 'row-reverse' }}
					/>
				}
				contentToolbar={
					<Tabs
						value={tabValue}
						onChange={handleTabChange}
						indicatorColor="primary"
						textColor="primary"
						variant="scrollable"
						scrollButtons="auto"
						classes={{ root: 'w-full h-64' }}
					>
						<Tab style={{ fontSize: '18px' }} className="h-64" label={t('digitalAsset')} />
						<Tab style={{ fontSize: '18px' }} className="h-64" label={t('encrypt')} />
						<Tab style={{ fontSize: '18px' }} className="h-64" label={t('checkout')} />
						<Tab style={{ fontSize: '18px' }} className="h-64" label={t('proveOwnership')} />
					</Tabs>
				}
				content={
					<div className="p-16 sm:p-24 max-w-2xl">
						<div className={tabValue !== 0 ? 'hidden' : ''}>
							<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
								<div style={{ display: 'flex', width: '75%' }}>
									<RootRef rootRef={ref}>
										<label
											htmlFor="button-file"
											className={clsx(
												classes.productImageUpload,
												'flex items-center justify-center relative w-128 h-128 rounded-16 mx-12 overflow-hidden cursor-pointer shadow hover:shadow-lg'
											)}
											{...rootProps}
										>
											<input {...getInputProps()} />
											<Icon fontSize="large" color="action">
												{uploadIcon}
											</Icon>
										</label>
									</RootRef>
								</div>
								<div style={{ width: '23%', marginTop: '10px' }}>
									<Typography
										style={{ fontSize: '14px', fontWeight: '400' }}
										align="left"
										variant="caption"
										color="primary"
									>
										{file ? (
											<>
												<p>{`${t('fileName')} :`}</p>
												<p style={{ color: '#43B4C0' }}>
													{file.name.slice(0, 30)} {file.name.slice(30, 31) ? '...' : ''}
												</p>
												<p>{`${t('fileSize')} :`}</p>
												<p style={{ color: '#43B4C0' }}>{`${file.size} KB`}</p>
											</>
										) : (
											<p>{t('dropFiles')}</p>
										)}
									</Typography>
								</div>
							</div>
							<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
								<div style={{ width: '75%' }}>
									<Controller
										name="fileExtension"
										control={methods.control}
										render={({ field }) => (
											<TextField
												{...field}
												className="mt-8 mb-16"
												error={!!methods.formState.errors.fileExtension}
												required
												helperText={methods.formState.errors?.fileExtension?.message}
												label={t('fileExtension')}
												autoFocus
												id="fileExtension"
												variant="filled"
												value={file ? file.name.split('.').pop() : ''}
												fullWidth
												InputProps={{
													style: { fontSize: '16px' }
												}}
												InputLabelProps={{
													style: { fontSize: '16px', fontWeight: '500' }
												}}
												// placeholder={t('fileExtensionPlaceholder')}
											/>
										)}
									/>
								</div>
								<div style={{ width: '23%', marginTop: '10px' }}>
									<Typography
										style={{ fontSize: '14px', fontWeight: '400' }}
										align="left"
										variant="caption"
										color="primary"
									>
										{t('fileExtensionPlaceholder')}
									</Typography>
								</div>
							</div>
							<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
								<div style={{ width: '75%' }}>
									<Controller
										name="signature"
										control={methods.control}
										render={({ field }) => (
											<TextField
												{...field}
												className="mt-8 mb-16"
												error={!!methods.formState.errors.signature}
												required
												helperText={methods.formState.errors?.signature?.message}
												label={t('signature')}
												autoFocus
												id="signature"
												variant="filled"
												onChange={e => setSignature(e.target.value)}
												fullWidth
												InputProps={{
													style: { fontSize: '16px' }
												}}
												InputLabelProps={{
													style: { fontSize: '16px', fontWeight: '500' }
												}}
												placeholder={t('signaturePlaceholder')}
											/>
										)}
									/>
								</div>
								<div style={{ width: '23%', marginTop: '8px' }}>
									<Typography
										style={{ fontSize: '14px', fontWeight: '400' }}
										align="left"
										variant="caption"
										color="primary"
									>
										{t('signatureDesc')}
									</Typography>
								</div>
							</div>
							<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
								<div style={{ width: '75%', display: 'flex', justifyContent: 'flex-end' }}>
									<Button
										style={{ fontSize: '16px', height: '50px' }}
										color="secondary"
										// variant="outlined"
										onClick={() => setTabValue(1)}
									>
										{t('next')}
									</Button>
								</div>
								<div style={{ width: '23%', marginTop: '8px' }} />
							</div>
						</div>
						{/** -------------------------- tab 2 ------------------------------- */}
						<div className={tabValue !== 1 ? 'hidden' : ''}>
							<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
								<div style={{ width: '75%' }}>
									<Controller
										name="privateKey"
										control={methods.control}
										render={({ field }) => (
											<>
												<TextField
													{...field}
													className="mt-8 mb-16"
													error={!!methods.formState.errors.privateKey}
													required
													helperText={methods.formState.errors?.privateKey?.message}
													label={t('privateKey')}
													autoFocus
													id="privateKey"
													variant="filled"
													fullWidth
													value={keys ? keys.pr : ''}
													onChange={e => setPrKey(e.target.value)}
													InputProps={{
														style: { fontSize: '16px' }
													}}
													InputLabelProps={{
														style: { fontSize: '16px', fontWeight: '500' }
													}}
													placeholder={t('privateKeyPlaceholder')}
												/>
												<Button
													{...field}
													className="mt-8 mb-16"
													style={{ fontSize: '16px', height: '50px' }}
													color="primary"
													variant="outlined"
													fullWidth
													onClick={() => generateKeys()}
												>
													{t('genKeys')}
												</Button>
											</>
										)}
									/>
								</div>
								<div style={{ width: '23%', marginTop: '3px' }}>
									<Typography
										style={{ fontSize: '14px', fontWeight: '400' }}
										align="left"
										variant="caption"
										color="primary"
									>
										{t('privateKeyDesc')}
									</Typography>
								</div>
							</div>
							<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
								<div style={{ width: '75%', display: 'flex', justifyContent: 'flex-end' }}>
									<Button
										style={{ fontSize: '16px', height: '50px' }}
										color="secondary"
										// variant="outlined"
										onClick={() => setTabValue(2)}
									>
										{t('next')}
									</Button>
								</div>
								<div style={{ width: '23%', marginTop: '8px' }} />
							</div>
						</div>
						{/** -------------------------- tab 3 ------------------------------- */}
						<div className={tabValue !== 2 ? 'hidden' : ''}>
							{invoice && (
								<div className="mt-64">
									<Table className="simple">
										<TableHead>
											<TableRow>
												<TableCell>{t('service')}</TableCell>
												<TableCell>{t('unit')}</TableCell>
												<TableCell align="right">{t('unitPrice')}</TableCell>
												<TableCell align="right">{t('quantity')}</TableCell>
												<TableCell align="right">{t('total')}</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{invoice.services.map(service => (
												<TableRow key={service.id}>
													<TableCell>
														<Typography variant="subtitle1">{service.title}</Typography>
													</TableCell>
													<TableCell>{service.unit}</TableCell>
													<TableCell align="right">
														{formatter.format(service.unitPrice)}
													</TableCell>
													<TableCell align="right">{service.quantity}</TableCell>
													<TableCell align="right">
														{formatter.format(service.total)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>

									<Table className="simple mt-32">
										<TableBody>
											<TableRow>
												<TableCell>
													<Typography
														className="font-normal"
														variant="subtitle1"
														color="textSecondary"
													>
														{t('subTotal')}
													</Typography>
												</TableCell>
												<TableCell align="right">
													<Typography
														className="font-normal"
														variant="subtitle1"
														color="textSecondary"
													>
														{formatter.format(invoice.subtotal)}
													</Typography>
												</TableCell>
											</TableRow>
											<TableRow>
												<TableCell>
													<Typography
														className="font-normal"
														variant="subtitle1"
														color="textSecondary"
													>
														{t('vat')}
													</Typography>
												</TableCell>
												<TableCell align="right">
													<Typography
														className="font-normal"
														variant="subtitle1"
														color="textSecondary"
													>
														{formatter.format(invoice.tax)}
													</Typography>
												</TableCell>
											</TableRow>

											<TableRow>
												<TableCell>
													<Typography
														className="font-light"
														variant="h4"
														color="textSecondary"
													>
														{t('total')}
													</Typography>
												</TableCell>
												<TableCell align="right">
													<Typography
														className="font-light"
														variant="h4"
														color="textSecondary"
													>
														{formatter.format(invoice.total)}
													</Typography>
												</TableCell>
											</TableRow>
										</TableBody>
									</Table>
								</div>
							)}
							<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
								<div style={{ width: '65%', display: 'flex', justifyContent: 'flex-end' }}>
									<TextField
										label={t('creditCardNumber')}
										autoFocus
										type="password"
										id="creditCardNumber"
										variant="filled"
										fullWidth
										InputProps={{
											style: { fontSize: '16px' }
										}}
										InputLabelProps={{
											style: { fontSize: '16px', fontWeight: '500' }
										}}
									/>
								</div>
								<div
									style={{
										width: '35%',
										display: 'flex',
										justifyContent: 'flex-start',
										marginTop: '-20px',
										paddingLeft: '30px',
										height: '90px'
									}}
								>
									<img src="assets/images/aa.png" alt="mada" />
								</div>
							</div>
							<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
								<div style={{ width: '65%', display: 'flex', justifyContent: 'flex-end' }}>
									<TextField
										label={t('expDate')}
										autoFocus
										id="expDate"
										variant="filled"
										fullWidth
										InputProps={{
											style: { fontSize: '16px' }
										}}
										InputLabelProps={{
											style: { fontSize: '16px', fontWeight: '500' }
										}}
									/>
								</div>
								<div
									style={{
										width: '35%',
										display: 'flex',
										justifyContent: 'flex-start',
										marginTop: '-25px'
									}}
								/>
							</div>
							<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
								<div style={{ width: '65%', display: 'flex', justifyContent: 'flex-end' }}>
									<TextField
										label={t('cvv')}
										autoFocus
										id="cvv"
										type="password"
										variant="filled"
										fullWidth
										InputProps={{
											style: { fontSize: '16px' }
										}}
										InputLabelProps={{
											style: { fontSize: '16px', fontWeight: '500' }
										}}
									/>
								</div>
								<div
									style={{
										width: '35%',
										display: 'flex',
										justifyContent: 'flex-start',
										marginTop: '-25px'
									}}
								/>
							</div>
							<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
								<div style={{ width: '65%', display: 'flex', justifyContent: 'flex-end' }}>
									<TextField
										label={t('nameonCard')}
										autoFocus
										id="nameonCard"
										variant="filled"
										fullWidth
										InputProps={{
											style: { fontSize: '16px' }
										}}
										InputLabelProps={{
											style: { fontSize: '16px', fontWeight: '500' }
										}}
									/>
								</div>
								<div
									style={{
										width: '35%',
										display: 'flex',
										justifyContent: 'flex-start',
										marginTop: '-25px'
									}}
								/>
							</div>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									marginBottom: '20px',
									marginTop: '10px'
								}}
							>
								<div style={{ width: '65%', display: 'flex', justifyContent: 'flex-end' }}>
									<Button
										style={{ fontSize: '16px', height: '50px' }}
										color="secondary"
										onClick={() => setTabValue(3)}
									>
										{t('next')}
									</Button>
								</div>
								<div style={{ width: '35%', marginTop: '8px' }} />
							</div>
						</div>
						{/** -------------------------- tab 4 ------------------------------- */}

						<div className={tabValue !== 3 ? 'hidden' : ''}>
							<Controller
								name="uploadToIpfs"
								control={methods.control}
								render={({ field }) => (
									<>
										<>
											<TextField
												{...field}
												className="mt-8 mb-16"
												disabled
												label={t('ipfsId')}
												value={ipfsIdentifier}
												id="uploadToIpfs"
												variant="filled"
												fullWidth
												InputProps={{
													style: { fontSize: '16px' }
												}}
												InputLabelProps={{
													style: { fontSize: '16px', fontWeight: '500' }
												}}
												placeholder={t('privateKeyPlaceholder')}
											/>
											<Button
												{...field}
												className="mt-8 mb-16"
												style={{ fontSize: '16px', height: '50px' }}
												color="primary"
												variant="outlined"
												fullWidth
												disabled={loading || !keys}
												onClick={onUploadToIPFS}
											>
												{t('uploadEncToIpsf')}
											</Button>
											{loading && !ipfsIdentifier && (
												<CircularProgress size={24} className={classes.buttonProgress} />
											)}

											<Button
												{...field}
												className="mt-8 mb-16"
												style={{ fontSize: '16px', height: '50px' }}
												color="secondary"
												variant={!ethSuccess ? 'outlined' : 'contained'}
												disabled={!ipfsIdentifier}
												fullWidth
												onClick={!ethSuccess ? onAddToEthereum : () => null}
											>
												{!ethSuccess ? t('uploadtoEth') : t('uploadedtoEth')}
											</Button>
										</>
										{transaction && (
											<div
												style={{
													display: 'flex',
													justifyContent: 'center',
													margin: '30px',
													width: '948px',
													height: '1310px'
												}}
												id="capture"
											>
												<div className={clsx(classes.root)}>
													{true && (
														<motion.div
															initial={{ opacity: 0, y: 200 }}
															animate={{ opacity: 1, y: 0 }}
															transition={{ bounceDamping: 0 }}
														>
															<Card className="mx-auto w-xl print:w-full print:shadow-none rounded-none sm:rounded-20">
																<CardContent className="p-88 print:p-0">
																	<div className="flex">
																		<img
																			className="w-160 print:w-60"
																			src="assets/images/logos/alamahLogo.png"
																			alt="logo"
																		/>
																		<Typography
																			className="font-light p-20 mt-40"
																			variant="h4"
																		>
																			{t('invoicesubTitle')}
																		</Typography>
																		<Button color="primary" onClick={printDocument}>
																			<Icon>print</Icon>
																		</Button>
																	</div>
																	<div
																		style={{
																			display: 'flex',
																			justifyContent: 'space-between',
																			flexDirection: 'column'
																		}}
																	>
																		<table
																			style={{
																				margin: '40px'
																			}}
																		>
																			<tr>
																				<td
																					style={{
																						width: '110px',
																						height: '70px',
																						color: '#43B4C0',
																						padding: '3px',
																						fontWeight: '600',
																						fontFamily: 'DIN Next LT Arabic'
																					}}
																				>
																					{' '}
																					{t('signature')}
																				</td>
																				<td
																					style={{
																						width: '110px',
																						height: '70px'
																					}}
																				>
																					{signature}
																				</td>
																			</tr>
																			<tr>
																				<td
																					style={{
																						width: '110px',
																						height: '70px',
																						color: '#43B4C0',
																						padding: '3px',
																						fontWeight: '600',
																						fontFamily: 'DIN Next LT Arabic'
																					}}
																				>
																					{' '}
																					{t('id')}
																				</td>
																				<td
																					style={{
																						width: '110px',
																						height: '70px'
																					}}
																				>
																					{transaction.blockNumber - 16}
																				</td>
																			</tr>
																			<tr>
																				<td
																					style={{
																						width: '110px',
																						height: '70px',
																						color: '#43B4C0',
																						padding: '3px',
																						fontWeight: '600',
																						fontFamily: 'DIN Next LT Arabic'
																					}}
																				>
																					{' '}
																					{t('retriveFile')}
																				</td>
																				<td
																					style={{
																						width: '110px',
																						height: '70px'
																					}}
																				>
																					https://alamah.sa/tahakaq
																				</td>
																			</tr>
																			<tr>
																				<td
																					style={{
																						width: '110px',
																						height: '70px',
																						color: '#43B4C0',
																						padding: '3px',
																						fontWeight: '600',
																						fontFamily: 'DIN Next LT Arabic'
																					}}
																				>
																					{' '}
																					{t('privatekey')}
																				</td>
																				<td
																					style={{
																						width: '110px',
																						height: '70px'
																					}}
																				>
																					{keys.pr}
																				</td>
																			</tr>
																			<tr>
																				<td
																					style={{
																						width: '110px',
																						height: '70px',
																						color: '#43B4C0',
																						padding: '3px',
																						fontWeight: '600',
																						fontFamily: 'DIN Next LT Arabic'
																					}}
																				>
																					{' '}
																					{t('publicKey')}
																				</td>
																				<td
																					style={{
																						width: '110px',
																						height: '70px',
																						wordWrap: 'break-word'
																					}}
																				>
																					<span
																						style={{
																							width: '110px',
																							wordBreak: 'break-all'
																						}}
																					>
																						{keys.pb}
																					</span>
																				</td>
																			</tr>
																		</table>
																		<table
																			style={{
																				margin: '40px'
																			}}
																		>
																			<tr>
																				<td
																					style={{
																						width: '110px',
																						height: '70px',
																						color: '#43B4C0',
																						padding: '3px',
																						fontWeight: '600',
																						fontFamily: 'DIN Next LT Arabic'
																					}}
																				>
																					{' '}
																					{t('encUrl')}
																				</td>
																				<td
																					style={{
																						width: '110px',
																						height: '70px'
																					}}
																				>
																					https://ipfs.io/ipfs/
																					{ipfsIdentifier}
																				</td>
																			</tr>
																			<tr>
																				<td
																					style={{
																						width: '110px',
																						height: '70px',
																						color: '#43B4C0',
																						padding: '3px',
																						fontWeight: '600',
																						fontFamily: 'DIN Next LT Arabic'
																					}}
																				>
																					{' '}
																					{t('invoiceDate')}
																				</td>
																				<td
																					style={{
																						width: '110px',
																						height: '70px'
																					}}
																				>
																					aa
																				</td>
																			</tr>
																			<tr>
																				<td
																					style={{
																						width: '110px',
																						height: '70px',
																						color: '#43B4C0',
																						padding: '3px',
																						fontWeight: '600',
																						fontFamily: 'DIN Next LT Arabic'
																					}}
																				>
																					{' '}
																					{t('blockNumber')}
																				</td>
																				<td
																					style={{
																						width: '110px',
																						height: '70px'
																					}}
																				>
																					{transaction
																						? transaction.blockNumber
																						: ''}
																				</td>
																			</tr>
																			<tr>
																				<td
																					style={{
																						width: '110px',
																						height: '70px',
																						color: '#43B4C0',
																						padding: '3px',
																						fontWeight: '600',
																						fontFamily: 'DIN Next LT Arabic'
																					}}
																				>
																					{' '}
																					{t('blockHash')}
																				</td>
																				<td
																					style={{
																						width: '110px',
																						height: '70px'
																					}}
																				>
																					{transaction
																						? transaction.blockHash
																						: ''}
																				</td>
																			</tr>
																			<tr>
																				<td
																					style={{
																						width: '110px',
																						height: '70px',
																						color: '#43B4C0',
																						padding: '3px',
																						fontFamily:
																							'DIN Next LT Arabic',
																						fontWeight: '600'
																					}}
																				>
																					{' '}
																					{t('fileExtension')}
																				</td>
																				<td
																					style={{
																						width: '110px',
																						height: '70px'
																					}}
																				>
																					{file.name.split('.').pop()}
																				</td>
																			</tr>
																		</table>
																	</div>
																	<div className="mt-96 print:mt-0 print:px-16">
																		<div className="flex">
																			<div className="flex-shrink-0">
																				<img
																					className="w-32"
																					src="assets/images/logos/alamahLogo.png"
																					alt="logo"
																				/>
																			</div>

																			<Typography
																				className="font-normal mb-64 px-24"
																				variant="caption"
																				color="textSecondary"
																			>
																				{t('invoiceAlamah')}
																			</Typography>
																		</div>
																	</div>
																</CardContent>
															</Card>
														</motion.div>
													)}
												</div>
											</div>
										)}
									</>
								)}
							/>
						</div>
					</div>
				}
			/>
		</FormProvider>
	);
}

export default ProveEth;
