import React , { useState, useEffect  } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ethers } from "ethers";
import CalAuth from "../contracts/CalAuth.json";
import CalAuthAddress from "../data/ContractAddress";
import Roles from "./Roles";

let provider;
let signer;
let contractCalAuth;

provider = new ethers.providers.Web3Provider(window.ethereum)
signer = provider.getSigner();
contractCalAuth = new ethers.Contract(CalAuthAddress, CalAuth.abi, signer);

// Used by keccakToRole function
const keccakADMIN = roleToUTFToKeccak(Roles.ADMIN);
const keccakWRITE = roleToUTFToKeccak(Roles.USER_WRITE_ROLE);
const keccakREAD = roleToUTFToKeccak(Roles.USER_READ_ROLE);

function roleToUTFToKeccak(role) {
	return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(role));
}

function AdminDashboard(props) {
	const [isError, setIsError] = useState(false);
	const [errorMsg, setErrorMsg] = useState("Unknown");
	const [isGranted, setIsGranted] = useState(false);
	const [grantedRole, setGrantedRole] = useState();
	const [grantedAccount, setGrantedAccount] = useState("0x00");
	const [pendingBlockchain, setPendingBlockahin] = useState(false);


	// Required as solidity Event returned as keccak hash of byte32
	function keccakToRole(keccakRole) {
		switch (keccakRole) {
			case keccakADMIN:
				return "Admin";
			case keccakWRITE:
				return "Read-write";
			case keccakREAD:
				return "Read only";
			default:
				return "Nil";
		}
	}

	function formSubmit(event) {
		setIsGranted(false); 
		setIsError(false); 
		setPendingBlockahin(true);
		const grantAccess = new FormData(event.target);
		const requesteeAddress = grantAccess.get('requestAddress');
		let requesteeLevel = grantAccess.get('requestLevel');
		requesteeLevel = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(requesteeLevel));
		contractCalAuth.grantRole(requesteeLevel, requesteeAddress)
			.then(contractCalAuth.on("RoleGranted", (role, account,sender) => {
				setGrantedRole(keccakToRole(role));
				setGrantedAccount(account);
				setIsGranted(true); 
				setPendingBlockahin(false);}))
			.catch(err => {
				setErrorMsg(err.message);
				setIsError(true); 
				setPendingBlockahin(false);
			})
		event.preventDefault();
	}


	// Notification to user that transaction sent to blockchain
	const GrantedAlert = () => {
		if (!isGranted) return null;
		return (
			<Alert key="pending" variant="info" 
			style={{position: 'relative', top: 5}}>
			Access Granted:<br/>
			Role: {grantedRole}<br/>
			Account: {grantedAccount}<br/>
			</Alert>
		);
	};

	// // Notification to user of blockchain error
	const ErrorAlert = () => {
		if (!isError) return null;
		return (
			<Alert key="error" variant="danger" 
			style={{position: 'relative', top: 5}}>
			Error: {errorMsg}
			</Alert>
		);
			 // style={{position: "absolute", right: "500px", bottom: "100px"}}
	};
	
	return (
		<div>


		<h2>Admin Dashboard</h2>
		<span>logged on as: {props.address}</span>
		<h3>Users with admin access:</h3>
		<h3>Users with read-write access:</h3>
		<h3>Users with read-only access:</h3>

		<h3>Grant access:</h3>
		<div>
		<Form onSubmit={formSubmit}>
		<Form.Group controlId="formGroupAddress">
		<Form.Label>User address</Form.Label>
		<Form.Control name="requestAddress" placeholder="Enter address 0x..." required  pattern="0x[a-zA-Z0-9]{40}" />
		</Form.Group>
		<Form.Group controlId="formGroupAccess">
		<Form.Label>Access level:</Form.Label>
		<Form.Control as="select" name="requestLevel">
		<option value={Roles.USER_READ_ROLE}>Read-only</option>
		<option value={Roles.USER_WRITE_ROLE}>Read-write</option>
		<option value={Roles.ADMIN}>Admin</option>
		</Form.Control>
		</Form.Group>
		<Button variant="primary" type="submit" >
		Submit
		</Button> 
		{ pendingBlockchain &&
		<img id="loader" width="40px" src="Rolling-1s-200px.svg" alt="Waiting for blockchain"/> }
		</Form>
		<ErrorAlert />
		<GrantedAlert />
		</div>
		</div>
	);
}

export default AdminDashboard;



		// <div>

		// <span>Hello Admin! Your address: {props.address}</span> 
		// <form>
		// <p><label>Customer name: <input /></label></p>
		// <fieldset>
		// <legend> Pizza Size </legend>
		// <p><label> <input type="radio" name="size" /> Small </label></p>
		// <p><label> <input type="radio" name="size" /> Medium </label></p>
		// <p><label> <input type="radio" name="size" /> Large </label></p>
		// </fieldset>
		// </form>
		// </div>
