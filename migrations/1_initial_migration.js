const deployment = require('../src/utils/deployment')
const Web3 = require("web3")

module.exports = async (deployer) => {

  await deployment.deployNodeRegistry(new Web3(web3.currentProvider))

};
