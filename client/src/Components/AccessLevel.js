import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Roles from "./Roles";

function AccessLevel(props) {

	if (props.role === Roles.USER_READ_ROLE.HUMAN) {
		return (<Alert variant="dark"
			style={{position: 'relative'}}>
			<span>{props.role} log on: {props.address}</span>
			</Alert>);
	} else {
		return (<Alert variant="success"
			style={{position: 'relative'}}>
			<span>{props.role} log on: {props.address}</span>
			</Alert>);
	}
}

export default AccessLevel;



