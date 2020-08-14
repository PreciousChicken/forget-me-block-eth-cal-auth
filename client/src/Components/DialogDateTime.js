import React from 'react';
import moment from 'moment';

function DialogDateTime(props) {

	if (props.eventAllDay && (props.eventStart.getTime() === props.eventEnd.getTime())) {
		return ( <span>{moment(props.eventStart).format("ddd D MMM YY")}<br/></span>);
	} else if (props.eventAllDay) {
		return ( 
			<span>
			{moment(props.eventStart).format("ddd D MMM YY")} - {moment(props.eventEnd).format("ddd D MMM YY")}
			<br/>
			</span>);
	} else {
		return (	
			<span>{moment(props.eventStart).format("ddd D MMM YY")} 
			<br/>
			{moment(props.eventStart).format("H:mm")} - {moment(props.eventEnd).format("H:mm")}
			<br/> 
			</span>
		);
	}
}

export default DialogDateTime;

