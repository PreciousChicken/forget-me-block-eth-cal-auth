const CalStore = artifacts.require("CalStore");
const CalAuth = artifacts.require("CalAuth");

module.exports = function(deployer) {
	deployer.deploy(CalStore).then(function() {
		return deployer.deploy(CalAuth, CalStore.address);
	})
};

// // var One = artifacts.require("./One.sol");
// // var Two = artifacts.require("./Two.sol");

// // module.exports = (deployer, network) => {
//   deployer.deploy(One).then(function() {
//     return deployer.deploy(Two, One.address)
//   });
// };



// module.exports = function(deployer) {
//   // Arguments are: contract
//   deployer.deploy(CalStore);
// };
