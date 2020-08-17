// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CalStore.sol";
import "./VEventLibrary.sol";

contract CalAuth is Ownable, AccessControl {
    using VEventLibrary for VEventLibrary.VEvent;

    bytes32 public constant USER_READ_ROLE = keccak256("USER_READ_ROLE");
    bytes32 public constant USER_WRITE_ROLE = keccak256("USER_WRITE_ROLE");
    bytes32 public constant ADMIN = keccak256("ADMIN");
    CalStore private calStore;

    constructor(address _addr) public {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        calStore = CalStore(_addr);
    }

    modifier onlyRole(bytes32 _role) {
        if (_role == USER_WRITE_ROLE) {
            require(
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
                hasRole(USER_WRITE_ROLE, msg.sender),
                "User not authorised");
        } else {
            require(
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
                hasRole(USER_WRITE_ROLE, msg.sender) ||
                hasRole(USER_READ_ROLE, msg.sender),
                "User not authorised");
        }
        _;
    }
    
    modifier onlyRoleIcal(address _user) {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _user) ||
            hasRole(USER_WRITE_ROLE, _user) ||
            hasRole(USER_READ_ROLE, _user),
            "User not authorised");
        _;
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
        public onlyRole(USER_WRITE_ROLE)
        {
        calStore.storeEvent(
            _dtstamp, _dtstart, _dtend,
            _summary, _description,
            _isallday, _alldaystartdate,
            _alldayenddate);
    }

    function removeEvent(uint _dtstamp) public onlyRole(USER_WRITE_ROLE) {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
            hasRole(USER_WRITE_ROLE, msg.sender),
            "User not authorised");
        calStore.removeEvent(_dtstamp);
    }

    function getEventsIcal(address _user) public view onlyRoleIcal(_user) returns (
        string memory) {
        return calStore.getEventsIcal(address(this));
    }

    function getEventsIcal(address _user, uint _validFrom) public view onlyRoleIcal(_user) returns (
        string memory) {
        return calStore.getEventsIcal(address(this), _validFrom);
    }


    function getEventsIcal(address _user, uint _validFrom, 
        uint _expiresBy) public view onlyRoleIcal(_user) returns (
        string memory) {
        return calStore.getEventsIcal(address(this), _validFrom, _expiresBy);
    }

    function getEventsObj() public view onlyRole(USER_READ_ROLE) returns (
        VEventLibrary.VEvent[] memory) {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
            hasRole(USER_WRITE_ROLE, msg.sender) ||
            hasRole(USER_READ_ROLE, msg.sender),
            "User not authorised");
        return calStore.getEventsObj();
    }
    
    function getEventsObj(uint _validFrom) public view onlyRole(USER_READ_ROLE) returns (
        VEventLibrary.VEvent[] memory) {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
            hasRole(USER_WRITE_ROLE, msg.sender) ||
            hasRole(USER_READ_ROLE, msg.sender),
            "User not authorised");
        return calStore.getEventsObj(_validFrom);
    }

    function getEventsObj(uint _validFrom, uint _expiresBy) public view onlyRole(USER_READ_ROLE) returns (
        VEventLibrary.VEvent[] memory) {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
            hasRole(USER_WRITE_ROLE, msg.sender) ||
            hasRole(USER_READ_ROLE, msg.sender),
            "User not authorised");
        return calStore.getEventsObj(_validFrom, _expiresBy);
    }

    /// @notice Returns role of msg.sender
    /// @dev Returns in hierarchial order, e.g. ADMIN more important than READ etc
    /// @return string user role
    function getUserRole() public view returns (string memory) {
        if (hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            return "ADMIN";
        } else if (hasRole(ADMIN, msg.sender)) {
            return "ADMIN";
        } else if (hasRole(USER_WRITE_ROLE, msg.sender)) {
            return "USER_WRITE_ROLE";
        } else if (hasRole(USER_READ_ROLE, msg.sender)) {
            return "USER_READ_ROLE";
        }
        return "NIL";
    }

    //TODO: Delete, not used
    function addRead(address userAddress) public onlyOwner {
        grantRole(USER_READ_ROLE, userAddress);
    }

    //TODO: Delete, not used
    function addWrite(address userAddress) public onlyOwner {
        grantRole(USER_WRITE_ROLE, userAddress);
    }

    //TODO: Delete, not used
    function revokeRead(address userAddress) public onlyOwner {
        revokeRole(USER_READ_ROLE, userAddress);
    }

    //TODO: Delete, not used
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
    function authHi() public pure returns (string memory) {
        return "CalAuth Says Hi.  Correct.";
    }
}

