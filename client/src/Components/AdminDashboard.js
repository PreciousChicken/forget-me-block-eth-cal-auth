import React , { useState, useEffect  } from 'react';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Table from 'react-bootstrap/Table';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ethers } from "ethers";
import CalAuth from "../contracts/CalAuth.json";
// import CalAuthAddress from "../data/ContractAddress";
import Roles from "./Roles";
import SubmitButton from "./SubmitButton";
import RevokeButton from "./RevokeButton";
import 'bootstrap/dist/css/bootstrap.min.css';

let provider;
let signer;
let contractCalAuth;

provider = new ethers.providers.Web3Provider(window.ethereum)
signer = provider.getSigner();
		contractCalAuth = new ethers.Contract(
			process.env.REACT_APP_CALAUTH_ADDRESS, 
			CalAuth.abi, 
			signer);

// Used by keccakToRole function
const keccakADMIN = roleToUTFToKeccak(Roles.ADMIN.TXT);
const keccakWRITE = roleToUTFToKeccak(Roles.USER_WRITE_ROLE.TXT);
const keccakREAD = roleToUTFToKeccak(Roles.USER_READ_ROLE.TXT);

function roleToUTFToKeccak(role) {
	return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(role));
}

function AdminDashboard(props) {
	const [isError, setIsError] = useState(false);
	const [errorMsg, setErrorMsg] = useState("Unknown");
	const [isGranted, setIsGranted] = useState(false);
	const [grantedRole, setGrantedRole] = useState();
	const [grantedAccount, setGrantedAccount] = useState("0x00");
	const [pendingBlockchain, setPendingBlockchain] = useState(false);
	const [adminMembers, setAdminMembers] = useState([]);
	const [writeMembers, setWriteMembers] = useState([]);
	const [readMembers, setReadMembers] = useState([]);
	const [alertHeading, setAlertHeading] = useState("");
	const [pendingRevoke, setPendingRevoke] = useState("0x00");

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

	async function getRoleMembership(role) {
		const roleCount = await contractCalAuth.getRoleMemberCount(role);
		const members = [];
		for (let i = 0; i < roleCount; ++i) {
			members.push(await contractCalAuth.getRoleMember(role, i));
		}
		return members;
	}

	// Gets all members from blockchain on page load / reload
	useEffect(() => {
		getRoleMembership(keccakADMIN).then(members => setAdminMembers(members));
		getRoleMembership(keccakWRITE).then(members => setWriteMembers(members));
		getRoleMembership(keccakREAD).then(members => setReadMembers(members));
		}, []);
	
	// Gets all members from blockchain on page load / reload
	useEffect(() => {
		getRoleMembership(keccakADMIN).then(members => setAdminMembers(members));
		getRoleMembership(keccakWRITE).then(members => setWriteMembers(members));
		getRoleMembership(keccakREAD).then(members => setReadMembers(members));
		}, [pendingBlockchain, pendingRevoke]);

	// Ensures address has not already been authorised
	function verifyDuplicate(address) {
		for (const member of adminMembers){
			if (member === address) {
				return true;
			}
		}
		for (const member of writeMembers){
			if (member === address) {
				return true;
			}
		}
		for (const member of readMembers){
			if (member === address) {
				return true;
			}
		}
		return false;
	}

	function formSubmit(event) {
		setIsGranted(false); 
		setIsError(false); 
		setPendingBlockchain(true);
		const grantAccess = new FormData(event.target);
		const requesteeAddress = grantAccess.get('requestAddress');
		let requesteeLevel = grantAccess.get('requestLevel');
		requesteeLevel = roleToUTFToKeccak(requesteeLevel);
		if(verifyDuplicate(requesteeAddress)) {
				setErrorMsg("Duplicate address. Address already authorised.");
				setIsError(true); 
				setPendingBlockchain(false);
		} else {
		contractCalAuth.grantRole(requesteeLevel, requesteeAddress)
			.then(contractCalAuth.on("RoleGranted", (role, account,sender) => {
				setGrantedRole(keccakToRole(role));
				setGrantedAccount(account);
				setAlertHeading("Access granted");
				setIsGranted(true); 
				setPendingBlockchain(false);}))
		.catch(err => {
				setErrorMsg(err.message);
				setIsError(true); 
				setPendingBlockchain(false);
			})
		}
		event.preventDefault();
	}

	function revokeAccess(address, role) {
		setPendingRevoke(address);
		setIsGranted(false); 
		setIsError(false); 
		contractCalAuth.revokeRole(roleToUTFToKeccak(role), address)
			.then(contractCalAuth.on("RoleRevoked", (role, account,sender) => {
				setGrantedRole(keccakToRole(role));
				setGrantedAccount(account);
				setAlertHeading("Access revoked");
				setIsGranted(true); 
				setPendingBlockchain(false);
				setPendingRevoke("0x00");
			}))
			.catch(err => {
				setErrorMsg(err.message);
				setIsError(true); 
				setPendingBlockchain(false);
				setPendingRevoke("0x00");
			})
	}


	// Notification to user that transaction sent to blockchain
	const GrantedAlert = () => {
		if (!isGranted) return null;
		return (
			<Alert key="pending" variant="info" 
			style={{position: 'relative', top: 5}}>
			<Alert.Heading>{alertHeading}</Alert.Heading>
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
		<h2>HealthPsy Group Eth-Cal Dashboard</h2>
			<Alert variant="success" 
			style={{position: 'relative'}}>
		<span>Admin log on: {props.address}, </span>
			</Alert>
		<h3>Users with access:</h3>
		{ writeMembers.length + readMembers.length + adminMembers.length > 0 ?  
		   <Table striped bordered hover>
      <thead>
      <tr>
      <th>Level</th>
      <th>Address</th>
      <th>Revoke</th>
      </tr>
      </thead>
      <tbody>
      {adminMembers.map(member => 
         <tr key={member}>
         <td>{Roles.ADMIN.HUMAN}</td>
         <td>{member}</td>
				<td>
				<RevokeButton role={Roles.ADMIN.TXT} pending={pendingRevoke} 
				address={member} revokeAcc={revokeAccess}/>
				</td>
         </tr>
      )}
      {writeMembers.map(member => 
         <tr key={member}>
         <td>{Roles.USER_WRITE_ROLE.HUMAN}</td>
				<td>{member}</td>
				<td>
				<RevokeButton role={Roles.USER_WRITE_ROLE.TXT} pending={pendingRevoke}
				address={member} revokeAcc={revokeAccess}/>
				</td>
				</tr>
			)}
		{readMembers.map(member => 
         <tr key={member}>
         <td>{Roles.USER_READ_ROLE.HUMAN}</td>
         <td>{member}</td>
				<td>
				<RevokeButton role={Roles.USER_READ_ROLE.TXT} pending={pendingRevoke}
				address={member} revokeAcc={revokeAccess}/>
				</td>
         </tr>
      )}
      </tbody>
      </Table>
			: 
			<p>No users have access.</p> }

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
		<option value={Roles.USER_READ_ROLE.TXT}>Read-only</option>
		<option value={Roles.USER_WRITE_ROLE.TXT}>Read-write</option>
		</Form.Control>
		</Form.Group>
		<SubmitButton pending={pendingBlockchain} />
		</Form>
		<ErrorAlert />
		<GrantedAlert />
		</div>
		</div>
	);
}

export default AdminDashboard;

