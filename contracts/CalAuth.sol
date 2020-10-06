// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CalStore.sol";
import "./VEventLibrary.sol";

/// @title Forget-me-block: Ethereum Calendar Authentication
/// @author PreciousChicken
/// @notice preciouschicken.com/blog/posts/forget-me-block-eth-cal/
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
        _setRoleAdmin(USER_READ_ROLE, ADMIN);
        _setRoleAdmin(USER_WRITE_ROLE, ADMIN);
        grantRole(ADMIN, msg.sender);
        calStore = CalStore(_addr);
    }

    modifier onlyRole(bytes32 _role) {
        if (_role == ADMIN) {
            require(
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
                hasRole(ADMIN, msg.sender),
                "User not authorised");
        } else if (_role == USER_WRITE_ROLE) {
            require(
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
                hasRole(ADMIN, msg.sender) ||
                hasRole(USER_WRITE_ROLE, msg.sender),
                "User not authorised");
        } else {
            require(
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
                hasRole(ADMIN, msg.sender) ||
                hasRole(USER_WRITE_ROLE, msg.sender) ||
                hasRole(USER_READ_ROLE, msg.sender),
                "User not authorised");
        }
        _;
    }
    
    modifier onlyRoleIcal(address _user) {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _user) ||
            hasRole(ADMIN, msg.sender) ||
            hasRole(USER_WRITE_ROLE, _user) ||
            hasRole(USER_READ_ROLE, _user),
            "User not authorised");
        _;
    }

    /// @notice Passes event to CalStore to store 
    /// @dev Validation performed on dates 
    /// @param _dtstamp unix timestamp RFC5545 definition 
    /// @param _dtstart unix timestamp RFC5545 definition 
    /// @param _dtend unix timestamp RFC5545 definition 
    /// @param _summary unix timestamp RFC5545 definition 
    /// @param _description unix timestamp RFC5545 definition 
    /// @param _isallday boolean for all day event 
    /// @param _alldaystartdate string of start date for all-day e.g. 19971102
    /// @param _alldayenddate string of end date for all-day e.g. 19971103
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
        require(
            (requestWindow.expiresBy >= _dtstart) || 
            (requestWindow.expiresBy == 0), 
            "Later than viewable period");
        calStore.storeEvent(
            _dtstamp, _dtstart, _dtend,
            _summary, _description,
            _isallday, _alldaystartdate,
            _alldayenddate);
    }

    /// @notice Passes event to CalStore to remove 
    /// @dev Assumes user cannot have more than one event with same dtstamp 
    /// @dev Further testing of this assumption required
    /// @param _dtstamp unix timestamp RFC5545 definition 
    function removeEvent(uint _dtstamp) public onlyRole(USER_WRITE_ROLE) {
        // Require not required due to onlyRole?  TODO Test this assumption.
        // Remove when tested.
        // require(
        //     hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
        //     hasRole(USER_WRITE_ROLE, msg.sender),
        //     "User not authorised");
        calStore.removeEvent(_dtstamp);
    }

    function deleteEvents() public onlyOwner {
        calStore.deleteEvents();
    }

    /// @notice Returnes events from CalStore as string 
    /// @dev Called by API, used in Email clients, not react-calendar
    /// @param _user address of user, required as called by Outlook/Thunderbird 
    /// @return string user role
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


    /// @notice Returnes events from CalStore as object
    /// @dev Called by web react-calendar
    /// @return VEventLibrary.VEvent[] array of events
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

    /// @notice Grants access to role 
    /// @dev Validation performed on dates 
    /// @param _role role to be granted 
    /// @param _userAddress address for new role
    /// @param _validFrom unix date
    /// @param _expiresBy unix date
    function grantRoleAccess(
        bytes32 _role, 
        address _userAddress, 
        uint _validFrom, 
        uint _expiresBy) 
        public onlyRole(ADMIN) {
            require((_validFrom < _expiresBy) ||
                    (_expiresBy == 0), 
            "Viewable from later than viewable until");
            grantRole(_role, _userAddress);
            accessList[_userAddress] = AccessWindow(_validFrom, _expiresBy);
    }

    /// @notice Shows viewable dates for selected user 
    /// @dev Dates are viewFrom and expiresBy
    /// @param _userAddress selected user
    /// @return AccessWindow viewable date struct
    function getAccessWindow(address _userAddress) 
    view
    public 
    returns (AccessWindow memory) {
	return accessList[_userAddress];
    }

    /// @notice Transfers CalAuth ownership and access management 
    /// @dev current owner is revoked ownership and admin
    /// @param _newOwner address of new owner
    function transferCalAuth(address _newOwner) public onlyOwner {
        grantRole(DEFAULT_ADMIN_ROLE, _newOwner);
        grantRole(ADMIN, _newOwner);
        revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
        revokeRole(ADMIN, msg.sender);
        transferOwnership(_newOwner);
    }

}

