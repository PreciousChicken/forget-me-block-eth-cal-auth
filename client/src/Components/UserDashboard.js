import React from 'react';
import UserCalendar from "./UserCalendar";
import AccessLevel from "./AccessLevel";

function UserDashboard(props) {

	return (	
		<div>
		<h2>HealthPsy Group Eth-Cal</h2>
		<AccessLevel address={props.address} role={props.role}/>
		<UserCalendar role={props.role}/>
		</div>
	);
}

export default UserDashboard;



