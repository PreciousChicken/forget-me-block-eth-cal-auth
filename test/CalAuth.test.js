// const { accounts, contract } = require('@openzeppelin/test-environment');
// const { expect } = require('chai');

const CalAuth = artifacts.require("CalAuth");
const truffleAssert = require('truffle-assertions');

// const CalAuth = contract.fromArtifact("CalAuth");

contract('CalAuth', async accounts => {

	it('should prove true is true', async () => {
		assert.equal(true, true, 'True is false.');
	});

	it('should not allow non authorised to getEvents', async () => {
		instance = await CalAuth.deployed();
		await truffleAssert.reverts(
			instance.getEventsIcal({from: accounts[1]}),
			"User not authorised"
		);
		await truffleAssert.reverts(
			instance.getEventsIcal({from: accounts[2]}),
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
		instance = await CalAuth.deployed();
		responseIcal = await instance.getEventsIcal({from: accounts[0]});
		blankIcal = 'BEGIN:VCALENDAR\n' +
			'VERSION:2.0\n' +
			'PRODID:-//preciouschicken.com//forget-me-block-eth-cal\n' +
			'CALSCALE:GREGORIAN\n' +
			'END:VCALENDAR\n';
		assert.equal(responseIcal, blankIcal, "Ical text string unexpected")
	});

	it('should allow authorised to blank getEventsObj', async () => {
		instance = await CalAuth.deployed();
		responseObj = await instance.getEventsObj({from: accounts[0]});
		blankObj = [];
		assert.equal(responseObj.length, blankObj.length, "Event Obj unexpected")
	});
});
