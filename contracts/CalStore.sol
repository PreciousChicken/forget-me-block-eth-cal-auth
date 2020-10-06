// SPDX-License-Identifier: MIT
pragma solidity ^0.6.1;
pragma experimental ABIEncoderV2;

import "./BokkyPooBahsDateTimeLibrary.sol";
import "./VEventLibrary.sol";

contract CalStore  {
    using BokkyPooBahsDateTimeLibrary for uint;
    using VEventLibrary for VEventLibrary.VEvent;

    mapping(address => VEventLibrary.VEvent[]) private store;
    mapping(address => uint) private count;

    function storeEvent(
        uint _dtstamp, 
        uint _dtstart, 
        uint _dtend,
        string memory _summary, 
        string memory _description,
        bool _isallday, 
        string memory _alldaystartdate,
        string memory _alldayenddate)
        public {
        count[msg.sender]++;
        uint nextId = count[msg.sender];
        VEventLibrary.VEvent memory newEvent = VEventLibrary.VEvent(
            _dtstamp,
            _dtstart,
            _dtend,
            _summary,
            _description,
            _isallday,
            _alldaystartdate,
            _alldayenddate,
            nextId);
        store[msg.sender].push(newEvent);
    }

    /// @notice Deletes all events for user calender 
    function deleteUserCalendar() public {
        delete store[msg.sender];
    }

    /// @notice Returns iCal string of message senders previously stored data
    /// @param _user address of user or contract requesting events
    /// @return string iCalendar string iaw RFC 5545
    function removeEvent(uint _dtstamp) public {
        uint storeLen = store[msg.sender].length;
        for (uint i = 0; i < storeLen; i++) {
            if (store[msg.sender][i].dtstamp == _dtstamp) {
                // Move the last element into the place to delete
                store[msg.sender][i] = store[msg.sender][storeLen - 1];
                // Remove the last element
                store[msg.sender].pop();
                break;
            }
        }
    }

    /// @notice Returns iCal string of message senders previously stored data
    /// @param _user address of user or contract requesting events
    /// @return string iCalendar string iaw RFC 5545
    function getEventsIcal(address _user) public view returns (string memory) {
        string memory outputString = "";
        VEventLibrary.VEvent[] memory ownerEvent = store[_user];
        string memory ownerStr = addressToStr(_user);

        for (uint i = 0; i < ownerEvent.length; i++) {
            outputString = constructVEvent(ownerEvent[i], ownerStr, outputString);
        }
        return appendVCalHeader(outputString);
    }

    /// @notice Returns iCal string of message senders previously stored data
    /// @return string iCalendar string iaw RFC 5545
    function getEventsIcal(address _user, uint _validFrom) 
    public 
    view 
    returns (string memory) {
        string memory outputString = "";
        VEventLibrary.VEvent[] memory ownerEvent = store[_user];
        string memory ownerStr = addressToStr(_user);
        for (uint i = 0; i < ownerEvent.length; i++) {
            if (_validFrom <= ownerEvent[i].dtend) {
                outputString = constructVEvent(ownerEvent[i], ownerStr, outputString);
            }
        }
        return appendVCalHeader(outputString);
    }

    /// @notice Returns iCal string of message senders previously stored data
    /// @return string iCalendar string iaw RFC 5545
    function getEventsIcal(
        address _user, 
        uint _validFrom, 
        uint _expiresBy) public view returns (string memory) {
        string memory outputString = "";
        VEventLibrary.VEvent[] memory ownerEvent = store[_user];
        string memory ownerStr = addressToStr(_user);
        for (uint i = 0; i < ownerEvent.length; i++) {
            if ((_validFrom <= ownerEvent[i].dtend) && 
                (_expiresBy >= ownerEvent[i].dtstart)) {
                outputString = constructVEvent(ownerEvent[i], ownerStr, outputString);
            }
        }
        return appendVCalHeader(outputString);
    }

    function appendVCalHeader(string memory _events) 
    private 
    pure 
    returns (string memory) 
    {
        string memory vCalBegin = "BEGIN:VCALENDAR\nVERSION:2.0\n";
        string memory vCalProdID = "PRODID:-//preciouschicken.com//forget-me-block-eth-cal\n";
        string memory vCalCalScale = "CALSCALE:GREGORIAN\n";
        string memory vCalFooter = "END:VCALENDAR\n";
        return string(abi.encodePacked(
            vCalBegin, 
            vCalProdID, 
            vCalCalScale, 
            _events, 
            vCalFooter));
    }

    function constructVEvent(
        VEventLibrary.VEvent memory ownerEvent, 
        string memory ownerStr, 
        string memory outputString) 
        private pure returns (string memory) {
            string memory dtstamp = unixTimeToStr(ownerEvent.dtstamp);
            string memory uid = uintToStr(ownerEvent.uid);
            string memory summary = ownerEvent.summary;
            string memory description = ownerEvent.description;
            string memory allday;
            string memory dtstart;
            string memory dtend;
            string memory utcmark;
            if (ownerEvent.isallday) {
                allday = ";VALUE=DATE:";
                dtstart = ownerEvent.alldaystartdate;
                dtend = ownerEvent.alldayenddate;
                utcmark = "";
            } else {
                allday = ":";
                dtstart = unixTimeToStr(ownerEvent.dtstart);
                dtend = unixTimeToStr(ownerEvent.dtend);
                utcmark = "Z";
            }
            return outputString = string(
                abi.encodePacked(outputString,"BEGIN:VEVENT\n",
                                 "DTSTAMP:", dtstamp, "\n",
                                 "UID:", uid, "@", ownerStr, "\n",
                                 "DTSTART", allday, dtstart, utcmark, "\n",
                                 "DTEND", allday, dtend, utcmark, "\n",
                                 "SUMMARY:", summary, "\n",
                                 "DESCRIPTION:", description, "\n",
                                 "END:VEVENT\n"
                                )
            );
    }

    function unixTimeToStr(uint _unixTime) private pure returns (string memory) {
        return string(
            abi.encodePacked(
                leadingZeroAdd(BokkyPooBahsDateTimeLibrary.getYear(_unixTime)),
                leadingZeroAdd(BokkyPooBahsDateTimeLibrary.getMonth(_unixTime)),
                leadingZeroAdd(BokkyPooBahsDateTimeLibrary.getDay(_unixTime)),
                "T",
                leadingZeroAdd(BokkyPooBahsDateTimeLibrary.getHour(_unixTime)),
                leadingZeroAdd(BokkyPooBahsDateTimeLibrary.getMinute(_unixTime)),
                leadingZeroAdd(BokkyPooBahsDateTimeLibrary.getSecond(_unixTime))
        )
        );
    }

    function leadingZeroAdd(uint _timePoint) private pure returns (string memory) {
        string memory timeStr;
        uint requiresZero = 9; // Time points less than 9 require leading zero
        if (_timePoint > requiresZero ) {
            timeStr = uintToStr(_timePoint);
        } else {
            timeStr = string(abi.encodePacked("0", uintToStr(_timePoint)));
        }
        return timeStr;
    }

    // Returns all msg for msg.sender, regardless of time
    function getEventsObj() public view returns (VEventLibrary.VEvent[] memory) {
        VEventLibrary.VEvent[] memory tempData = store[msg.sender];
        return tempData;
    }
    

    function getEventsObj(uint _validFrom) 
    public 
    view 
    returns (VEventLibrary.VEvent[] memory) {
        VEventLibrary.VEvent[] memory tempData = store[msg.sender];
        VEventLibrary.VEvent[] memory filteredData = 
            new VEventLibrary.VEvent[](tempData.length);
        for (uint i = 0; i < tempData.length; i++) {
            if (_validFrom <= tempData[i].dtend) {
                filteredData[i] = tempData[i];
            }
        }
        return filteredData;
    }

    function getEventsObj(uint _validFrom, uint _expiresBy) 
    public 
    view 
    returns (VEventLibrary.VEvent[] memory) {
        VEventLibrary.VEvent[] memory tempData = store[msg.sender];
        VEventLibrary.VEvent[] memory filteredData = 
            new VEventLibrary.VEvent[](tempData.length);
        for (uint i = 0; i < tempData.length; i++) {
            if ((_validFrom <= tempData[i].dtend) && 
                (_expiresBy >= tempData[i].dtstart)) {
                filteredData[i] = tempData[i];
            }
        }
        return filteredData;
    }

    /// @notice converts number to string
    /// @dev source: https://github.com/provable-things/ethereum-api/blob/master/oraclizeAPI_0.5.sol#L1045
    /// @param _i integer to convert
    /// @return _uintAsString string
    function uintToStr(uint _i) internal pure returns (string memory _uintAsString) {
        uint number = _i;
        if (number == 0) {
            return "0";
        }
        uint j = number;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len - 1;
        while (number != 0) {
            bstr[k--] = byte(uint8(48 + number % 10));
            number /= 10;
        }
        return string(bstr);
    }

    /// @notice converts address to string
    /// @dev source: https://ethereum.stackexchange.com/a/8447/61217
    /// @param _add address
    /// @return string
    function addressToStr(address _add) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            byte b = byte(uint8(uint(_add) / (2**(8*(19 - i)))));
            byte hi = byte(uint8(b) / 16);
            byte lo = byte(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);
        }
        return string(s);
    }

    /// @notice character conversion for addressToStr
    /// @dev source: https://ethereum.stackexchange.com/a/8447/61217
    /// @param _b byte
    /// @return c byte
    function char(byte _b) internal pure returns (byte c) {
        if (uint8(_b) < 10) {
            return byte(uint8(_b) + 0x30);
        } else {
            return byte(uint8(_b) + 0x57);
        }
    }
}

