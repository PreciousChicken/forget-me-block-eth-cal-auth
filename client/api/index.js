var ethers = require('ethers');
var CalStore = require('../src/contracts/CalAuth.json');

// Ropsten details
const network = "ropsten";
const provider = ethers.getDefaultProvider(network, {
    infura: process.env.INFURA_PROJECT_ID
});

const contractAddress = process.env.REACT_APP_CALAUTH_ADDRESS;

// Connect to the network
// We connect to the Contract using a Provider, so we will only
// have read-only access to the Contract
let contract = new ethers.Contract(contractAddress, CalStore.abi, provider);


// Allows CORS requests when using Vercel deployment
// IAW https://vercel.com/knowledge/how-to-enable-cors
const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  // another option
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  return await fn(req, res)
}

async function getIcalEvent(userAddress) {
	let outputString = "";
	outputString = await contract.getEventsIcal(userAddress);
	return outputString;
}

const handler = (req, res) => {
	const { address } = req.query;
	getIcalEvent(address).then(cal => {return res.end(cal)});
}

module.exports = allowCors(handler)
