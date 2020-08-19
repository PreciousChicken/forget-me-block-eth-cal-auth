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

    struct AccessWindow {
        uint validFrom;
        uint expiresBy;
    }
    
    mapping(address => AccessWindow) private accessList;

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
        AccessWindow memory requestWindow = accessList[msg.sender];
        require(requestWindow.validFrom <= _dtend, "Earlier than viewable period");
        require((requestWindow.expiresBy >= _dtstart) && 
        (requestWindow.expiresBy != 0), 
        "Later than viewable period");
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
        AccessWindow memory requestWindow = accessList[_user];
        if ((requestWindow.validFrom + requestWindow.expiresBy) == 0) {
            return calStore.getEventsIcal(address(this));
        } else if (requestWindow.expiresBy == 0) {
            return calStore.getEventsIcal(address(this), requestWindow.validFrom);
        } else {
            return calStore.getEventsIcal(address(this), requestWindow.validFrom, requestWindow.expiresBy);
        }
    }


    function getEventsObj() public view onlyRole(USER_READ_ROLE) returns (
        VEventLibrary.VEvent[] memory) {
            AccessWindow memory requestWindow = accessList[msg.sender];
            if ((requestWindow.validFrom + requestWindow.expiresBy) == 0) {
                return calStore.getEventsObj();
            } else if (requestWindow.expiresBy == 0) {
                return calStore.getEventsObj(requestWindow.validFrom);
            } else {
                return calStore.getEventsObj(
                    requestWindow.validFrom, 
                    requestWindow.expiresBy);
            }
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

    function grantRoleAccess(
        bytes32 _role, 
        address _userAddress, 
        uint _validFrom, 
        uint _expiresBy) 
        public onlyOwner {
            require((_validFrom < _expiresBy) ||
                    ((_validFrom + _expiresBy) == 0), 
            "Viewable from later than viewable until");
            grantRole(_role, _userAddress);
            accessList[_userAddress] = AccessWindow(_validFrom, _expiresBy);

        }

    function getAccessWindow(address _userAddress) 
    view
    public 
    returns (AccessWindow memory) {
	return accessList[_userAddress];
    }

    //TODO: Delete, not used
    function revokeRead(address userAddress) public onlyOwner {
        revokeRole(USER_READ_ROLE, userAddress);
    }

    //TODO: Delete, not used
    function revokeWrite(address userAddress) public onlyOwner {
        revokeRole(USER_WRITE_ROLE, userAddress);
    }

    function authHi() public pure returns (string memory) {
        return "CalAuth Says Hi.  Correct.";
    }

    function close() public onlyOwner { //onlyOwner is custom modifier
        selfdestruct(msg.sender); 
    }// `owner` is the owners address
}

