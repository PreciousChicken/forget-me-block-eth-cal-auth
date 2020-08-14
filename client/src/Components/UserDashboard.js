import React from 'react';
import Alert from 'react-bootstrap/Alert';
import UserCalendar from "./UserCalendar";

function UserDashboard(props) {

	return (	
		<div>
		<h2>HealthPsy Group Eth-Cal</h2>
			<Alert variant="success" 
			style={{position: 'relative'}}>
		<span>{props.role} log on: {props.address}</span>
			</Alert>
		<UserCalendar />
		</div>
	);
}

export default UserDashboard;

