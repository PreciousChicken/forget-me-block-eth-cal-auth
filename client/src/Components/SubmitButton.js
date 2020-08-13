import React from 'react';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

function SubmitButton(props) {
	if (props.pending) {
		return (
			<Button variant="primary" type="submit" disabled >
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
			<Button variant="primary" type="submit" >
			Submit
			</Button> 
		)
	}
}

export default SubmitButton;
