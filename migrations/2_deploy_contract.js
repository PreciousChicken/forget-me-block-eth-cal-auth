var CalAuth = artifacts.require("CalAuth");
var CalStore = artifacts.require("CalStore");

module.exports = function(deployer) {
  deployer.deploy(CalAuth).then(function() {
		return deployer.deploy(CalStore, CalAuth.address);
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
