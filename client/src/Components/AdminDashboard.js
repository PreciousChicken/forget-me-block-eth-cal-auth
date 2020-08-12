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


function AdminDashboard(props) {
	const [isError, setIsError] = useState(false);
	const [errorMsg, setErrorMsg] = useState("Unknown");
	const [isGranted, setIsGranted] = useState(false);
	const [grantedRole, setGrantedRole] = useState("Nil");
	const [grantedAccount, setGrantedAccount] = useState("0x00");

	function formSubmit(event) {
		const grantAccess = new FormData(event.target);
		const requesteeAddress = grantAccess.get('requestAddress');
		let requesteeLevel = grantAccess.get('requestLevel');
		requesteeLevel = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(requesteeLevel));
		contractCalAuth.grantRole(requesteeLevel, requesteeAddress)
			.then(contractCalAuth.on("RoleGranted", (role, account,sender) => {
				setGrantedRole(role); //TODO: Keccak?  Byte32
				setGrantedAccount(account);
				setIsGranted(true); })) 
			.catch(err => {
				setErrorMsg("Error: " + err.message);
				setIsError(true); 
			})
		event.preventDefault();
	}


	// Notification to user that transaction sent to blockchain
	const GrantedAlert = () => {
		if (!isGranted) return null;
		return (
			<Alert key="pending" variant="info" 
			style={{position: 'absolute', top: 0}}>
			Account {grantedAccount} 
			has been granted {grantedRole} 
			</Alert>
		);
	};

	// // Notification to user of blockchain error
	const ErrorAlert = () => {
		if (!isError) return null;
		return (
			<Alert key="error" variant="danger" 
			style={{position: 'absolute', top: 0}}>
			{errorMsg}
			</Alert>
		);
	};
	
	return (
		<div>
		<ErrorAlert />
		<GrantedAlert />


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
		</Form>
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
