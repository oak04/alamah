import React from 'react';
import ipfsClient from 'ipfs-http-client';

const IPFSContext = React.createContext({
	accounts: [],
	currentAccount: undefined,
	ipfsClient: undefined
});

function IPFSProvider(props) {
	const [accounts, setAccounts] = React.useState([]);
	const [currentAccount, setCurrentAccount] = React.useState(undefined);
	const [ipfs, setIpfs] = React.useState(undefined);

	React.useEffect(() => {
		if (typeof window.ethereum !== 'undefined') {
			window.ethereum.enable().then(accounts2 => {
				setAccounts(accounts2);
				setCurrentAccount(accounts2[0]);
			});

			window.ethereum.on('accountsChanged', function a(accounts3) {
				setAccounts(accounts3);
				setCurrentAccount(accounts3[0]);
			});
		}

		const ipfs2 = ipfsClient({
			host: 'ipfs.infura.io',
			port: 5001,
			protocol: 'https'
		});

		setIpfs(ipfs2);
	}, []);

	const contextValue = {
		accounts,
		currentAccount,
		ipfsClient: ipfs
	};

	return <IPFSContext.Provider value={contextValue}>{props.children}</IPFSContext.Provider>;
}

export { IPFSContext, IPFSProvider };
