import React, { useState, useEffect  } from 'react';
import { ethers } from "ethers";
import CalAuth from "./contracts/CalAuth.json";
import './App.css';
// import 'bootstrap/dist/css/bootstrap.min.css';
import AdminDashboard from './Components/AdminDashboard';
import UserDashboard from './Components/UserDashboard';
import CalAuthAddress from "./data/ContractAddress";
import Roles from "./Components/Roles";

let provider;
let signer;
let contractCalAuth;
let noProviderAbort = true;

// Ensures metamask or similar installed
if (typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined')) {
	try{
		// Ethers.js set up, gets data from MetaMask and blockchain
		window.ethereum.enable().then(
			provider = new ethers.providers.Web3Provider(window.ethereum)
		);
		signer = provider.getSigner();
contractCalAuth = new ethers.Contract(CalAuthAddress, CalAuth.abi, signer);
		noProviderAbort = false;
	} catch(e) {
		noProviderAbort = true;
	}
}

function App() {

	const [walAddress, setWalAddress] = useState('0x00');
	const [userRole, setUserRole] = useState(Roles.NIL);

	// Gets wallet address then role of user from contract
	useEffect(() => {
		signer.getAddress()
			.then(response => {
				setWalAddress(response);
				// console.log(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hello world")));
				contractCalAuth.getUserRole().then(roleValue => setUserRole(roleValue));
			})
	}, []);

	// Aborts app if metamask etc not present
	if (noProviderAbort) {
		return (
			<div>
			<h1>Error</h1>
			<p><a href="https://metamask.io">Metamask</a> or equivalent required to access this page.</p>
			</div>
		);
	}

	function determineUser() {
		switch(userRole){
			case Roles.ADMIN:
				return (<AdminDashboard address={walAddress} />);
			case Roles.USER_READ_ROLE:
			case Roles.USER_WRITE_ROLE:
				return (<UserDashboard address={walAddress} />);
			default: 
				return (<span>You are not authorised to use this system.  Please contact admin@example.org if you believe this is a mistake.</span>);
		}
	}

  return (
		<div>
		<h1>Blankshire NHS Trust</h1> 
		<h2>Group Calendar Authentication</h2>
		<div>
	{ walAddress === '0x00'
			?
			<p>You have not connected your Ethereum account to this application.  This is necessary to use this DApp.</p>
			:
		determineUser() 
	}	
		</div>

		</div>
  );
}

export default App;
