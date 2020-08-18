import React, { useState, useEffect  } from 'react';
import DialogDateTime from './DialogDateTime';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar, momentLocalizer } from 'react-big-calendar'
import { Button } from '@material-ui/core';
import { ethers } from "ethers";
import Alert from 'react-bootstrap/Alert';
import CalAuth from "../contracts/CalAuth.json";
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import Roles from "./Roles";

let provider;
let signer;
let contractCalAuth;

provider = new ethers.providers.Web3Provider(window.ethereum)
signer = provider.getSigner();
contractCalAuth = new ethers.Contract(
	process.env.REACT_APP_CALAUTH_ADDRESS, 
	CalAuth.abi, 
	signer);


function UserCalendar(props) {
	const localizer = momentLocalizer(moment);
	const [userSummary, setUserSummary] = useState("");
	const [userDesc, setUserDesc] = useState("");
	const [walAddress, setWalAddress] = useState('0x00');
	const [openAddDisplay, setOpenAddDisplay] = useState(false);
	const [openViewDisplay, setOpenViewDisplay] = useState(false);
	const [activeEventTitle, setActiveEventTitle] = useState("");
	const [activeEventDesc, setActiveEventDesc] = useState("");
	const [activeEventId, setActiveEventId] = useState(0);
	const [activeEventStart, setActiveEventStart] = useState(new Date());
	const [activeEventEnd, setActiveEventEnd] = useState(new Date());
	const [activeEventAllDay, setActiveEventAllDay] = useState(false);
	const [visibleEvents, setVisibleEvents] = useState([]);
	const [synchronisingEvents, setSyncEvents] = useState([]);
	const [isError, setIsError] = useState(false);
	const [errorMsg, setErrorMsg] = useState("Unknown");

	// Updates React with blockchain events and wallet address on page opening
	useEffect(() => {
		let updatedArray = [];
		signer.getAddress()
			.then(response => {
				setWalAddress(response);	
				contractCalAuth.getEventsObj()
					.then(blockEvents => {
						if (blockEvents[0]) {
							// Synchs events remaining in block only 
							for (let i = 0; i < blockEvents.length; i++) {
								let newEvent = new Event(
									blockEvents[i].isallday, 
									new Date(moment.unix(blockEvents[i].dtstart.toNumber())), 
									new Date(moment.unix(blockEvents[i].dtend.toNumber())), 
									blockEvents[i].summary, 
									blockEvents[i].description, 
									blockEvents[i].dtstamp.toNumber());
								newEvent.uid = blockEvents[i].uid;
								updatedArray.push(newEvent);
							}
							setSyncEvents(updatedArray);
						}
					})
			});
	}, []);


	// Copies events from synch to visible depending
	// isVisible flag
	useEffect(() => {
		let tempArray = [];
		for (let i = 0; i < synchronisingEvents.length; i++) {
			if (synchronisingEvents[i].isVisible === true) {
				tempArray.push(synchronisingEvents[i]);
			}
		}
		setVisibleEvents(tempArray);
	}, [synchronisingEvents]);

	// Object representing Event within React
	function Event(allDay, start, end, title, desc, id) {
		this.allDay = allDay;
		this.start = start;
		this.end = end;
		this.title = title;
		this.description = desc;
		this.id = id; // dtstamp in block, not uid
		this.uid = 0; // uid in block
		this.isVisible = true;
		this.isMine = true;
	}

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
	// Adds event when dropped on React calendar
	function addEvent() {
		// const title = window.prompt('New Event name');
		let unixStart = moment(activeEventStart).unix();
		let unixEnd = moment(activeEventEnd).unix();
		let allDay, allDayStartDate, allDayEndDate;
		if ((moment(activeEventStart).format("hhmm") === '1200') 
			&& (moment(activeEventEnd).format("hhmm") === '1200')) { 
			allDay = true;
			allDayStartDate = moment(activeEventStart).format("YYYYMMDD");
			allDayEndDate = moment(activeEventEnd).add(1, 'days').format("YYYYMMDD");
		} else {
			allDay = false;
			allDayStartDate = "";
			allDayEndDate = "";
		}

			let newEvent = new Event(
				allDay,
				activeEventStart, 
				activeEventEnd,
				userSummary,
				userDesc,
				moment().unix()
			);
			setSyncEvents([...synchronisingEvents, newEvent]);			
			contractCalAuth.storeEvent(
				newEvent.id, //saved as dtstamp
				unixStart, 
				unixEnd, 
				newEvent.title,
				newEvent.description,
				newEvent.allDay,
				allDayStartDate, // Required as unix time has UTC offset
				allDayEndDate // Required as unix time has UTC offset
			).catch(err => {
				setErrorMsg(err.data.message);
				setIsError(true);
				// alert("Error connecting to blockchain. " + err.message)
			});
	}

	// Deletes event when deleted on React calendar
	function deleteEvent() {
		setOpenViewDisplay(false);
		let deletionsArray = Array.from(synchronisingEvents);
		for (let i = 0; i < deletionsArray.length; i++) { 
			if (deletionsArray[i].id === activeEventId) { 
				deletionsArray[i].isVisible = false; 
			}
		}
		setSyncEvents(deletionsArray);
		contractCalAuth.removeEvent(activeEventId).catch(err => {
			setErrorMsg(err.message);
			setIsError(true);
			// alert("Error connecting to blockchain. " + err.message)
		});
	}

	// Closes Event display dialog
	function displayClose() {
		setIsError(false);
		setOpenAddDisplay(false);
		setOpenViewDisplay(false);
	}


	function displayAddEventOK() {
		setIsError(false);
		addEvent();
		setOpenAddDisplay(false);
		setOpenViewDisplay(false);
	}

	// Opens Event add display dialog
	function displayAddEvent(event) {
		setIsError(false);
		if (props.role !== Roles.USER_READ_ROLE.HUMAN) {
			setActiveEventStart(event.start);
			setActiveEventEnd(event.end);
			setOpenAddDisplay(true);
		}
	}

	// Opens Event view display dialog
	function displayViewEvent(event) {
		setIsError(false);
		setActiveEventId(event.id);
		setActiveEventTitle(event.title);
		setActiveEventDesc(event.description);
		setActiveEventStart(event.start);
		setActiveEventEnd(event.end);
		setActiveEventAllDay(event.allDay);
		setOpenViewDisplay(true);
	}



	return (
		<main>
		<p>
		<Calendar
		selectable
		defaultView="week"
		defaultDate={new Date()}
		localizer={localizer}
		events={visibleEvents}
		startAccessor="start"
		endAccessor="end"
		style={{ height: 500 }} 
		onSelectSlot={displayAddEvent}
		onSelectEvent={displayViewEvent}
		eventPropGetter={
			(event, start, end, isSelected) => {
				let newStyle = {
					backgroundColor: "lightgrey",
					color: 'black',
					borderRadius: "0px",
					border: "none"
				};

				if (event.isMine){
					newStyle.backgroundColor = "lightgreen"
				}

				return {
					className: "",
					style: newStyle
				};
			}
		}

		/>
		<ErrorAlert />
		</p>

		{walAddress === '0x00'
			?
			<p>You have not connected your Ethereum account to this application.  Please do so if you wish to add and read events.</p>
			:
			<>
			<h2>Subscribe to this calendar in your email application:</h2>
			<p>https://forget-me-block-eth-cal-auth.preciouschicken.com/api?address={walAddress}</p>
			<p>Instructions for <a href="https://support.microsoft.com/en-us/office/import-or-subscribe-to-a-calendar-in-outlook-com-cff1429c-5af6-41ec-a5b4-74f2c278e98c">Outlook</a> and <a href="https://support.mozilla.org/en-US/kb/creating-new-calendars#w_icalendar-ics">Thunderbird</a></p>
			</>
		}
		<div>
      <Dialog
        open={openViewDisplay}
        onClose={displayClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{activeEventTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">

		<DialogDateTime  eventEnd={activeEventEnd} eventStart={activeEventStart} eventAllDay={activeEventAllDay}/>

		Description: {activeEventDesc}<br/>
	All day: 
{activeEventAllDay ? <span>all day</span> :  <span>not all day</span> } 
	<br />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
	{   (props.role !== Roles.USER_READ_ROLE.HUMAN) && 
          <Button onClick={deleteEvent} color="primary">
            Delete 
          </Button>
	}
          <Button onClick={displayClose} color="primary" autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </div>

	<div>
	<form>
 <Dialog open={openAddDisplay} onClose={displayClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Add event</DialogTitle>
        <DialogContent>
          <DialogContentText>
{moment(activeEventStart).format("ddd D MMM YY")}<br/>
		{moment(activeEventStart).format("H:mm")} - {moment(activeEventEnd).format("H:mm")}<br/> 
          </DialogContentText>
	<TextField
margin="dense"
id="standard-basic"
label="Summary"
onChange={(e) => setUserSummary(e.target.value)}
fullWidth
autoFocus
	/>
	<TextField
margin="dense"
id="standard-basic"
label="Description"
onChange={(e) => setUserDesc(e.target.value)}
fullWidth
	/>
	</DialogContent>
	<DialogActions>
          <Button onClick={displayClose} color="primary">
            Cancel
          </Button>
          <Button onClick={displayAddEventOK} type="submit" color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
	</form>
	</div>



		</main>
	);
}

export default UserCalendar;



		// <DialogDateTime start={activeEventStart} end={activeEventEnd} allday={activeEventAllDay}/>
			// <p>actually for testing it is:</p>
			// <p>http://localhost:3305/listen?address={walAddress}</p>
