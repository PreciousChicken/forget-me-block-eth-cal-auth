const ethers = require('ethers')
const utils = ethers.utils

// const inBytes = utils.keccak256(utils.formatBytes32String("USER_READ_ROLE"));
// const inBytes = utils.formatBytes32String(utils.keccak256("USER_READ_ROLE"));
// const inBytes = utils.keccak256("USER_READ_ROLE");
// console.log(inBytes);

let message = "USER_READ_ROLE";
let messageBytes = utils.toUtf8Bytes(message);
let messageDigest = utils.keccak256(messageBytes);
console.log(messageDigest);
