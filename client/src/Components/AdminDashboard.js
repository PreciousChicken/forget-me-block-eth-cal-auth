import React , { useState, useEffect  } from 'react';
import moment from 'moment';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Table from 'react-bootstrap/Table';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ethers } from "ethers";
import CalAuth from "../contracts/CalAuth.json";
// import CalAuthAddress from "../data/ContractAddress";
import Roles from "./Roles";
import SubmitButton from "./SubmitButton";
import TransferButton from "./TransferButton";
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
	const [pendingTransfer, setPendingTransfer] = useState(false);
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
			let newAddress = await contractCalAuth.getRoleMember(role, i);
			let accessWindow = await contractCalAuth.getAccessWindow(newAddress);
			let newValidFrom, newExpiresBy;
			if (accessWindow.validFrom.toString() === "0") {
				newValidFrom = "N/A";
			} else {
				newValidFrom = moment.unix(accessWindow.validFrom.toString()).format("D MMM YY");
			}
			if (accessWindow.expiresBy.toString() === "0") {
				newExpiresBy = "N/A";
			} else {
				newExpiresBy = moment.unix(accessWindow.expiresBy.toString()).format("D MMM YY");
			}
			let newMember = {
				address: newAddress,
				validFrom: newValidFrom,
				expiresBy: newExpiresBy
			}

			members.push(newMember);
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

	// Ensures no duplicated addresses
	// e.g. address has not already been authorised
	function verifyDuplicate(address) {
		let completeMembers = adminMembers.concat(writeMembers, readMembers);
		if (props.address === address) {
				return true;
		}
		for (const member of completeMembers){
			if (member.address === address) {
				return true;
			}
		}
		return false;
	}

	function windowToUnix(window) {
		if (window) {
			return moment(window).unix();
		}
		return 0;
	}

	function formSubmit(event) {
		setIsGranted(false); 
		setIsError(false); 
		setPendingBlockchain(true);
		const grantAccess = new FormData(event.target);
		const requesteeAddress = grantAccess.get('requestAddress');
		let requesteeLevel = grantAccess.get('requestLevel');
		let validFrom = windowToUnix(grantAccess.get('validFrom'));
		let expiresBy = windowToUnix(grantAccess.get('expiresBy'));
		requesteeLevel = roleToUTFToKeccak(requesteeLevel);
		if(verifyDuplicate(requesteeAddress)) {
			setErrorMsg("Duplicate address. Address already authorised.");
			setIsError(true); 
			setPendingBlockchain(false);
		} else {
			contractCalAuth.grantRoleAccess(
				requesteeLevel, 
				requesteeAddress, 
				validFrom, 
				expiresBy)
				.then(contractCalAuth.on("RoleGranted", (role, account,sender) => {
					setGrantedRole(keccakToRole(role));
					setGrantedAccount(account);
					setAlertHeading("Access granted");
					setIsGranted(true); 
					setPendingBlockchain(false);}))
				.catch(err => {
					setErrorMsg(err.message);
					if(typeof err.data !== 'undefined') {
						setErrorMsg(err.data.message);
					}
					setIsError(true); 
					setPendingBlockchain(false);
				})
		}
		event.preventDefault();
	}

	function transferSubmit(event) {
		setIsGranted(false); 
		setIsError(false); 
		setPendingTransfer(true);
		const grantAccess = new FormData(event.target);
		const requesteeAddress = grantAccess.get('requestAddress');
		//TODO: React needs to listen for deleting all Events, add a solidity event to this?
		contractCalAuth.transferCalAuth(
			requesteeAddress)
			.then(contractCalAuth.on("OwnershipTransferred", (previousOwner, newOwner) => {
				setGrantedRole("Owner");
				setGrantedAccount(props.address);
				setAlertHeading("All events deleted");
				setIsGranted(true); 
				setPendingTransfer(false);}))
			.catch(err => {
				setErrorMsg(err.message);
				if(typeof err.data !== 'undefined') {
					setErrorMsg(err.data.message);
				}
				setIsError(true); 
				setPendingTransfer(false);
			})
		event.preventDefault();
	}
	
	function deleteSubmit(event) {
		setIsGranted(false); 
		setIsError(false); 
		setPendingTransfer(true);
		const grantAccess = new FormData(event.target);
		const requesteeAddress = grantAccess.get('requestAddress');
		

		contractCalAuth.deleteEvents(
			requesteeAddress)
			.then(contractCalAuth.on("OwnershipTransferred", (previousOwner, newOwner) => {
				setGrantedRole("Owner");
				setGrantedAccount(newOwner);
				setAlertHeading("Ownership transferred");
				setIsGranted(true); 
				setPendingTransfer(false);}))
			.catch(err => {
				setErrorMsg(err.message);
				if(typeof err.data !== 'undefined') {
					setErrorMsg(err.data.message);
				}
				setIsError(true); 
				setPendingTransfer(false);
			})
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
		<span>Admin log on: {props.address}</span>
			</Alert>
		<h3>Users with access:</h3>
		{ writeMembers.length + readMembers.length + adminMembers.length > 0 ?  
		   <Table striped bordered hover>
      <thead>
      <tr>
      <th>Level</th>
      <th>Address</th>
      <th>Viewable from</th>
      <th>Viewable until</th>
      <th>Revoke</th>
      </tr>
      </thead>
      <tbody>
      {adminMembers.map(member => 
         <tr key={member.address}>
         <td>{Roles.ADMIN.HUMAN}</td>
         <td>{member.address.slice(0,6)}...{member.address.slice(38)}</td>
         <td>{member.validFrom}</td>
         <td>{member.expiresBy}</td>
				<td>
				<RevokeButton role={Roles.ADMIN.TXT} pending={pendingRevoke} 
				address={member.address} revokeAcc={revokeAccess}/>
				</td>
         </tr>
      )}
      {writeMembers.map(member => 
         <tr key={member.address}>
         <td>{Roles.USER_WRITE_ROLE.HUMAN}</td>
         <td>{member.address.slice(0,6)}...{member.address.slice(38)}</td>
         <td>{member.validFrom}</td>
         <td>{member.expiresBy}</td>
				<td>
				<RevokeButton role={Roles.USER_WRITE_ROLE.TXT} pending={pendingRevoke}
				address={member.address} revokeAcc={revokeAccess}/>
				</td>
				</tr>
			)}
		{readMembers.map(member => 
         <tr key={member.address}>
         <td>{Roles.USER_READ_ROLE.HUMAN}</td>
         <td>{member.address.slice(0,6)}...{member.address.slice(38)}</td>
         <td>{member.validFrom}</td>
         <td>{member.expiresBy}</td>
				<td>
				<RevokeButton role={Roles.USER_READ_ROLE.TXT} pending={pendingRevoke}
				address={member.address} revokeAcc={revokeAccess}/>
				</td>
         </tr>
      )}
      </tbody>
      </Table>
			: 
			<p>No users have access.</p> }

		<p>
		<h3>Grant access:</h3>
		<Container>
		<Form onSubmit={formSubmit}>
		<Form.Group controlId="formGroupAddress">
		<Form.Label>User address:</Form.Label>
		<Form.Control name="requestAddress" placeholder="Enter address 0x..." required  pattern="0x[a-zA-Z0-9]{40}" />
		</Form.Group>
		<Form.Group controlId="formGroupAccess">
		<Form.Label>Access level:</Form.Label>
		<Form.Control as="select" name="requestLevel">
		<option value={Roles.USER_READ_ROLE.TXT}>Read-only</option>
		<option value={Roles.USER_WRITE_ROLE.TXT}>Read-write</option>
		<option value={Roles.ADMIN.TXT}>Admin</option>
		</Form.Control>
		</Form.Group>
		<Form.Group controlId="accessWindow">
		<Row>
		<Col>
		<Form.Label>Viewable from:</Form.Label>
		<br/>
		<input type="date" id="validFrom" name="validFrom" style={{color: "#495057"}}/>
		</Col>
		<Col>
		<Form.Label>Viewable until:</Form.Label>
		<br/>
		<input type="date" id="expiresBy" name="expiresBy" style={{color: "#495057"}}/>
		</Col>
		</Row>
		</Form.Group>
		<SubmitButton pending={pendingBlockchain} />
		</Form>
		</Container>
		</p>


		<h2>Owner utilities:</h2>
		<Container>
		<Row>
		<Col>
		<p>
		<h3>Transfer ownership:</h3>
		<p>Warning: All access rights will cease on transfer.</p>
		<Container>
		<Form onSubmit={transferSubmit}>
		<Form.Group controlId="formGroupAddress">
		<Form.Label>User address:</Form.Label>
		<Form.Control name="requestAddress" placeholder="Enter address 0x..." required  pattern="0x[a-zA-Z0-9]{40}" />
		</Form.Group>
		<TransferButton pending={pendingTransfer} buttonText="Transfer" />
		</Form>
		</Container>
		<ErrorAlert />
		<GrantedAlert />
		</p>
		</Col>
		<Col>
		<p>
		<h3>Delete all events:</h3>
		<p>Warning: This will irrevocably delete all events previously saved.</p>
		<Container>
		<Form onSubmit={deleteSubmit}>
		<TransferButton buttonText="Delete" pending={pendingTransfer} />
		</Form>
		</Container>
		<ErrorAlert />
		<GrantedAlert />
		</p>
		</Col>
		</Row>
		</Container>
		</div>
	);
}

export default AdminDashboard;

// color: #495057;
