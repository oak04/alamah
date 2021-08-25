import FusePageCarded from '@fuse/core/FusePageCarded';
import { makeStyles } from '@material-ui/core/styles';
import { useTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';
import { useCallback, useState, useContext } from 'react';
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

import { IPFSContext } from '../../IPFSContext';

const useStyles = makeStyles({
	layoutRoot: {}
});

function Prove() {
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
				id: 2,
				title: t('ethTran'),
				unit: 'ETH',
				quantity: '0.001844',
				unitPrice: '12500',
				total: '22.2'
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
		const subtotal = 62.2;
		const tax = 9.3;
		const total = 71.53;
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
	const [tabValue, setTabValue] = useState(3);
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

	const getEncryptedContent = useCallback(async () => {
		const content = Base64.btoa(new Uint8Array(file));

		// see https://github.com/pubkey/eth-crypto#encryptwithpublickey
		const encryptedContentObject = await EthCrypto.encryptWithPublicKey(keys.pb, content);

		const encryptedContentString = EthCrypto.cipher.stringify(encryptedContentObject);

		return encryptedContentString;
	}, [keys, file]);
	const { currentAccount, ipfsClient } = useContext(IPFSContext);

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

	const onAddToEthereum = useCallback(() => {
		drizzle.contracts.TimestampFactory.methods.createTimestamp.cacheSend(signature, ipfsIdentifier, signature, {
			gas: 500000
		});
		console.log('yes')
	}, [drizzle.contracts.TimestampFactory.methods, ipfsIdentifier, signature]);
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
					>
						<Button
							style={{ fontSize: '18px', height: '70px' }}
							color="secondary"
							variant="contained"
							onClick={() => history.push('/')}
						>
							{t('useYourWallet')}
						</Button>
					</div>
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
											color="secondary"
											variant="outlined"
											disabled={!ipfsIdentifier}
											fullWidth
											onClick={onAddToEthereum}
										>
											Create timestamp
										</Button>
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

export default Prove;
