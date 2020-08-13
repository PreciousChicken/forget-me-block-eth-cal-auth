import React from 'react';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Roles from "./Roles";

function RevokeButton(props) {
	if (props.pending === props.address) {
		return (
			<Button variant="danger" disabled>
			<Spinner
			as="span"
			animation="border"
			size="sm"
			role="status"
			aria-hidden="true"
			/>
			<span className="sr-only">Loading...</span>
			</Button>
		)
	} else {
		return (
			<Button variant="danger" 
			onClick={() => {props.revokeAcc(props.address, props.role);}}>
			Revoke
			</Button> 
		)
	}
}

export default RevokeButton;
