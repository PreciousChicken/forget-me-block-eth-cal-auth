// const { accounts, contract } = require('@openzeppelin/test-environment');
// const { expect } = require('chai');
const ethers = require('ethers');
const CalAuth = artifacts.require("CalAuth");
const truffleAssert = require('truffle-assertions');

// const CalAuth = contract.fromArtifact("CalAuth"); 
const USER_WRITE_ROLE = ethers.utils.keccak256(
	ethers.utils.toUtf8Bytes("USER_WRITE_ROLE"));
const USER_READ_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("USER_READ_ROLE"));

contract('CalAuth', async accounts => {

	beforeEach(async () => {
		instance = await CalAuth.new( {from: accounts[0]});
		// instance = await CalAuth.new();
	});

	afterEach(async () => {
		instance.close({from: accounts[0]});
	});

	it('should prove true is true', async () => {
		assert.equal(true, true, 'True is false.');
	});

	it('should not allow non authorised to getEvents', async () => {
		// instance = await CalAuth.deployed();
		await truffleAssert.reverts(
			instance.getEventsIcal(accounts[1]),
			"User not authorised"
		);
		await truffleAssert.reverts(
			instance.getEventsIcal(accounts[2]),
			"User not authorised"
		);
		await truffleAssert.reverts(
			instance.getEventsObj({from: accounts[1]}),
			"User not authorised"
		);
		await truffleAssert.reverts(
			instance.getEventsObj({from: accounts[2]}),
			"User not authorised"
		);
	});

	it('should allow authorised to blank getEventsIcal', async () => {
		// instance = await CalAuth.deployed();
		responseIcal = await instance.getEventsIcal(accounts[0]);
		blankIcal = 'BEGIN:VCALENDAR\n' +
			'VERSION:2.0\n' +
			'PRODID:-//preciouschicken.com//forget-me-block-eth-cal\n' +
			'CALSCALE:GREGORIAN\n' +
			'END:VCALENDAR\n';
		assert.equal(responseIcal, blankIcal, "Ical text string unexpected")
	});

	it('should allow authorised to blank getEventsObj', async () => {
		// instance = await CalAuth.deployed();
		responseObj = await instance.getEventsObj({from: accounts[0]});
		blankObj = [];
		assert.equal(responseObj.length, blankObj.length, "Event Obj unexpected")
	});
	
	it('should not allow read-write add when viewable window reversed', async () => {
		await truffleAssert.reverts(
			instance.grantRoleAccess(USER_WRITE_ROLE, accounts[1], 1, 0),
			"Viewable from later than viewable until"
		);
	});
	
	it('should not allow read-only to add events', async () => {
		instance.grantRoleAccess(USER_READ_ROLE, accounts[1], 0, 0);
		
		await truffleAssert.reverts(
			instance.storeEvent(1596455000, 1596456000, 1596459600, "Team Lunch", "General Hospital Canteen", false, "", "", {from: accounts[1]}),
			"User not authorised");
	});
	
	it('should not allow unauth to add events', async () => {
		
		await truffleAssert.reverts(
			instance.storeEvent(1596455000, 1596456000, 1596459600, "Team Lunch", "General Hospital Canteen", false, "", "", {from: accounts[3]}),
			"User not authorised");
	});

	it('should allow read-write to add events', async () => {
		instance.grantRoleAccess(USER_WRITE_ROLE, accounts[1], 0, 0);
		// Allows August Only
		instance.grantRoleAccess(USER_WRITE_ROLE, accounts[2], 1596236400, 1598828400);

		// Aug meeting from acct 2
		instance.storeEvent(1596455000, 1596456000, 1596459600, "Team Lunch", "General Hospital Canteen", false, "", "", {from: accounts[2]});

		// Sep meeting from acct 1
		instance.storeEvent(1596455000, 1599210000, 1599174000, "CBT Continuous Improvement", "Meeting Room 1", false, "", "", {from: accounts[1]});

	});
	
	it('????', async () => {
	// it('should not allow read-write to add events later than window', async () => {
		// Allows August Only
		instance.grantRoleAccess(USER_WRITE_ROLE, accounts[2], 1596236400, 1598828400);
		
			instance.storeEvent(1596455000, 1596456000, 1596459600, "Team Lunch", "General Hospital Canteen", false, "", "", {from: accounts[3]});
	});

});
