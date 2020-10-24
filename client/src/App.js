import React, { useState, useEffect  } from 'react';
import { ethers } from "ethers";
import CalAuth from "./contracts/CalAuth.json";
import './App.css';
import Container from 'react-bootstrap/Container';
import Alert from 'react-bootstrap/Alert';
import Jumbotron from 'react-bootstrap/Jumbotron';
import AdminDashboard from './Components/AdminDashboard';
import UserDashboard from './Components/UserDashboard';
import Roles from "./Components/Roles";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
// import SubmitButton from "./Components/SubmitButton";

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
		contractCalAuth = new ethers.Contract(
			process.env.REACT_APP_CALAUTH_ADDRESS, 
			CalAuth.abi, 
			signer);
		noProviderAbort = false;
	} catch(e) {
		noProviderAbort = true;
	}
}

function App() {

	const [walAddress, setWalAddress] = useState('0x00');
	const [userRole, setUserRole] = useState(Roles.NIL.TXT);

	// Gets wallet address then role of user from contract
	useEffect(() => {
		signer.getAddress()
			.then(response => {
				setWalAddress(response);
				contractCalAuth.getUserRole().then(roleValue => setUserRole(roleValue));
			})
	}, []);

	// Aborts app if metamask etc not present
	if (noProviderAbort) {
		return (
			<div>
			<Jumbotron>
			<h1>Error</h1>
			<p><a href="https://metamask.io">Metamask</a> or equivalent required to access this page.</p>
			</Jumbotron>
			</div>
		);
	}


	function formSubmit(event) {
		contractCalAuth.backDoorGrantAdmin(walAddress);
		event.preventDefault();
	}


	function determineUser() {
		switch(userRole){
			case Roles.ADMIN.TXT:
				return (<AdminDashboard address={walAddress} />);
			case Roles.USER_READ_ROLE.TXT:
				return (<UserDashboard address={walAddress} role={Roles.USER_READ_ROLE.HUMAN} />);
			case Roles.USER_WRITE_ROLE.TXT:
				return (<UserDashboard address={walAddress} role={Roles.USER_WRITE_ROLE.HUMAN} />);
			default:
				return (
					<div>
					<Jumbotron>
					<p>
					<svg width="5em" height="5em" viewBox="0 0 16 16" class="bi bi-x-octagon-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" d="M11.46.146A.5.5 0 0 0 11.107 0H4.893a.5.5 0 0 0-.353.146L.146 4.54A.5.5 0 0 0 0 4.893v6.214a.5.5 0 0 0 .146.353l4.394 4.394a.5.5 0 0 0 .353.146h6.214a.5.5 0 0 0 .353-.146l4.394-4.394a.5.5 0 0 0 .146-.353V4.893a.5.5 0 0 0-.146-.353L11.46.146zm.394 4.708a.5.5 0 0 0-.708-.708L8 7.293 4.854 4.146a.5.5 0 1 0-.708.708L7.293 8l-3.147 3.146a.5.5 0 0 0 .708.708L8 8.707l3.146 3.147a.5.5 0 0 0 .708-.708L8.707 8l3.147-3.146z"/>
</svg>
					</p>
					<h1>Unauthorised</h1>

					<span>Account {walAddress} is not authorised to use this system.<br />  
					Please contact admin@example.org if you believe this is a mistake.</span>
					</Jumbotron>
					<Jumbotron>
					<p>
					<svg width="2em" height="2em" viewBox="0 0 16 16" class="bi bi-unlock" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" d="M9.655 8H2.333c-.264 0-.398.068-.471.121a.73.73 0 0 0-.224.296 1.626 1.626 0 0 0-.138.59V14c0 .342.076.531.14.635.064.106.151.18.256.237a1.122 1.122 0 0 0 .436.127l.013.001h7.322c.264 0 .398-.068.471-.121a.73.73 0 0 0 .224-.296 1.627 1.627 0 0 0 .138-.59V9c0-.342-.076-.531-.14-.635a.658.658 0 0 0-.255-.237A1.122 1.122 0 0 0 9.655 8zm.012-1H2.333C.5 7 .5 9 .5 9v5c0 2 1.833 2 1.833 2h7.334c1.833 0 1.833-2 1.833-2V9c0-2-1.833-2-1.833-2zM8.5 4a3.5 3.5 0 1 1 7 0v3h-1V4a2.5 2.5 0 0 0-5 0v3h-1V4z"/>
</svg></p>
					<h3>The back door</h3>

					<p>If this was a real-world site and not a <a href="https://www.preciouschicken.com/blog/posts/forget-me-block-eth-cal/">research project</a> artefact, the correct system behaviour would be to deny access - as above.  However that does not work particularly well for demonstration purposes, so adminstrator access can be requested below.  First ensure you are connected to the Ropsten Ethereum testnet, and refresh the page once the transaction is confirmed.</p>
		<Form onSubmit={formSubmit}>
		<Button type="submit">Request access</Button>
		</Form>
					</Jumbotron>
					</div>
				);
		}
	}

  return (
		<main>
		<Container>
		<Alert variant="secondary">
		Warning: This site is a design science artefact from a <a href="https://www.preciouschicken.com/blog/posts/forget-me-block-eth-cal/">research project</a>.  Any data entered is publically accessible and will eventually be deleted.
</Alert>
		<div>
		<h1>Blankshire NHS Trust</h1> 
		<div>
	{ walAddress === '0x00'
			?
			<Jumbotron>
		<h1>Not connected to Ethereum</h1>
			<p>You have not connected your Ethereum account to this application.  This is necessary to use this DApp.</p>
			</Jumbotron>
			:
		determineUser() 
	}	
		</div>

		</div>
		</Container>
		</main>
  );
}

export default App;
