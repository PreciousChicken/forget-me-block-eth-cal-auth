// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CalStore.sol";

contract CalAuth is Ownable, AccessControl {

    bytes32 public constant USER_READ_ROLE = keccak256("USER_READ_ROLE");
    bytes32 public constant USER_WRITE_ROLE = keccak256("USER_WRITE_ROLE");
    CalStore calStore;

    constructor(address _addr) public {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        calStore = CalStore(_addr);
    }

    function storeEvent(
        uint _dtstamp,
        uint _dtstart,
        uint _dtend,
        string memory _summary,
        string memory _description,
        bool _isallday,
        string memory _alldaystartdate,
        string memory _alldayenddate)
        public
        {
        calStore.storeEvent(
            _dtstamp, _dtstart, _dtend,
            _summary, _description,
            _isallday, _alldaystartdate,
            _alldayenddate);
    }

    /// @notice Returns role of msg.sender
    /// @dev Returns in hierarchial order, e.g. ADMIN more important than READ etc
    /// @return string user role
    function getUserRole() public view returns (string memory) {
        if (hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            return "ADMIN";
        } else if (hasRole(USER_WRITE_ROLE, msg.sender)) {
            return "USER_WRITE_ROLE";
        } else if (hasRole(USER_READ_ROLE, msg.sender)) {
            return "USER_READ_ROLE";
        }
        return "NIL";
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

    function userReadWelcomeString() public view returns (string memory) {
        require(hasRole(USER_READ_ROLE, msg.sender), "Sorry you are not a READ user");
        return "Welcome read only user";
    }

    function ownerWelcomeString() public onlyOwner view returns (string memory) {
        return "Welcome owner";
    }

    function justSayHiCalAuth() public pure returns (string memory) {
        return "Hi from CalAuth";
    }
}

// CalAuth.deployed().then(function(instance) {app = instance})
// let accounts = await web3.eth.getAccounts()
// app.ownerWelcomeString()
// app.addRead("0x918FD928864B6c0fFf58829Ccd7f92B0020Ae68B", {from: accounts[1]});
// app.addRead(accounts[1]);
// app.userReadWelcomeString({from: accounts[1]});
// app.hasRole("USER_READ_ROLE",accounts[1]);



// hashed = await web3.utils.keccak256("USER_READ_ROLE")
// undefined
// app.hasRole(hashed,accounts[1]);
// true
// app.getRoleMemberCount(hashed);
// BN { negative: 0, words: [ 1, <1 empty item> ], length: 1, red: null }

// app.getRoleMember(hashed, 0)
