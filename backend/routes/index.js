/* eslint-disable no-undef */
/* eslint-disable max-len */
/* eslint-disable new-cap */
/* eslint-disable no-unused-vars */
import { Router } from 'express';
var Contract = require('web3-eth-contract');
const router = Router();
var Web3 = require('web3');
import { Web3Storage, File } from 'web3.storage';


router.get('/CreatefootPrint', async(req, res) => {
  Contract.setProvider('ws://localhost:7545');
  const web3 = new Web3();
  const account = web3.eth.accounts.privateKeyToAccount('4ec9ca2007da3113c7799bbfc7c5e170cec724e06797a89e98edc2d7382ffeec', [ true ]);


  const contract = new Contract([
    {
      'anonymous': false,
      'inputs': [
        {
          'indexed': false,
          'internalType': 'uint256',
          'name': 'footPrintId',
          'type': 'uint256'
        },
        {
          'indexed': false,
          'internalType': 'string',
          'name': 'signature',
          'type': 'string'
        }
      ],
      'name': 'NewFootPrint',
      'type': 'event'
    },
    {
      'constant': true,
      'inputs': [
        {
          'internalType': 'uint256',
          'name': '',
          'type': 'uint256'
        }
      ],
      'name': 'footPrints',
      'outputs': [
        {
          'internalType': 'uint256',
          'name': 'footPrint',
          'type': 'uint256'
        },
        {
          'internalType': 'string',
          'name': 'cid',
          'type': 'string'
        },
        {
          'internalType': 'string',
          'name': 'signature',
          'type': 'string'
        }
      ],
      'payable': false,
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'constant': true,
      'inputs': [
        {
          'internalType': 'uint256',
          'name': '',
          'type': 'uint256'
        }
      ],
      'name': 'footPrintsToOwner',
      'outputs': [
        {
          'internalType': 'address',
          'name': '',
          'type': 'address'
        }
      ],
      'payable': false,
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'constant': true,
      'inputs': [
        {
          'internalType': 'uint256',
          'name': '',
          'type': 'uint256'
        }
      ],
      'name': 'footPrintsToSignature',
      'outputs': [
        {
          'internalType': 'string',
          'name': '',
          'type': 'string'
        }
      ],
      'payable': false,
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'constant': false,
      'inputs': [
        {
          'internalType': 'string',
          'name': '_cid',
          'type': 'string'
        },
        {
          'internalType': 'string',
          'name': '_signature',
          'type': 'string'
        }
      ],
      'name': 'createFootPrint',
      'outputs': [],
      'payable': false,
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'constant': true,
      'inputs': [
        {
          'internalType': 'string',
          'name': '_signature',
          'type': 'string'
        }
      ],
      'name': 'getFootPrintsBySignature',
      'outputs': [
        {
          'internalType': 'uint256[]',
          'name': '',
          'type': 'uint256[]'
        }
      ],
      'payable': false,
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'constant': true,
      'inputs': [],
      'name': 'getFootPrintsCount',
      'outputs': [
        {
          'internalType': 'uint256',
          'name': 'count',
          'type': 'uint256'
        }
      ],
      'payable': false,
      'stateMutability': 'view',
      'type': 'function'
    }
  ], '0xe7c70C4825857c036722b552e4b5fbafBc2E8E77');
  console.log(req.query);
  let response;
  await contract.methods.createFootPrint(req.query.ipfs, req.query.signature).send({ from: account.address, gas: 500000 })
    .on('receipt', e => {
      console.log(e);
      response = e;
    });
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
console.log(response)
  res.json({ transactionHash: response.transactionHash, blockHash: response.blockHash, blockNumber: response .blockNumber });
});


router.post('/IPFS', async(req, res) => {
  const storage = new Web3Storage({ token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweENkRTgyMzk3MzlhNzJDMWMwN0M1MUVFYmFlYjJCMkI3MzdDMjZDQ2YiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2Mjc5Nzk1NTUwNTQsIm5hbWUiOiJvYWsifQ.lpKdmMFfXrF6y4pNCT9NtwzrjuQXeZUfcMlFIExExpo' });
  console.log(req.body);

  const buffer = Buffer.from(JSON.stringify(req.body.file));

  const files = [
    new File([ 'contents-of-file-1' ], 'plain-utf8.txt'),
    new File([ buffer ], 'hello.json')
  ];

  const cid = await storage.put(files);
  console.log(`cid ${cid}`);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

  res.json({ ipfs: cid });
});

export default {
  router
};
