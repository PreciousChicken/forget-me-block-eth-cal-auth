// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CalAuth is Ownable, AccessControl {

    bytes32 public constant USER_WRITE_ROLE = keccak256("USER_WRITE_ROLE");
    bytes32 public constant USER_READ_ROLE = keccak256("USER_READ_ROLE");

    constructor() public {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function addRead(address userAddress) public onlyOwner {
        grantRole(USER_READ_ROLE, userAddress);
    }

    function addWrite(address userAddress) public onlyOwner {
        grantRole(USER_WRITE_ROLE, userAddress);
    }

    function revokeRead(address userAddress) public onlyOwner {
        revokeRole(USER_READ_ROLE, userAddress);
    }

    function revokeWrite(address userAddress) public onlyOwner {
        revokeRole(USER_WRITE_ROLE, userAddress);
    }

    function userWelcomeString() public view returns (string memory) {
        require(hasRole(USER_ROLE, msg.sender), "Sorry you are not a user");
        return "Welcome user";
    }

    function ownerWelcomeString() public onlyOwner view returns (string memory) {
        return "Welcome owner";
    }
}

// CalAuth.deployed().then(function(instance) {app = instance})
// let accounts = await web3.eth.getAccounts()
// app.addUser("0x918FD928864B6c0fFf58829Ccd7f92B0020Ae68B", {from: accounts[1]});
// app.addUser("0x918FD928864B6c0fFf58829Ccd7f92B0020Ae68B");
// app.userString({from: accounts[1]});


// get all accounts: web3.eth.getAccounts().then(console.log)
