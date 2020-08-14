// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

library VEventLibrary {
    struct VEvent {
        uint dtstamp;
        uint dtstart;
        uint dtend;
        string summary;
        string description;
        bool isallday;
        string alldaystartdate;
        string alldayenddate;
        uint uid; // This should by dtstart, plus an id, plus msg.owner Change to string eventually
    }
}
