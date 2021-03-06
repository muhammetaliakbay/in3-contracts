const fs = require('fs')
const Web3 = require("web3")

const deployBlockHashRegistry = async (web3, privateKey) => {

    //const web3 = new Web3(url ? url : "http://localhost:8545")

    const ethAcc = await web3.eth.accounts.privateKeyToAccount(privateKey ? privateKey : "0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7");

    const bin = JSON.parse(fs.readFileSync('build/contracts/BlockhashRegistry.json', 'utf8'))

    const nonce = await web3.eth.getTransactionCount(ethAcc.address)

    const gasPrice = await web3.eth.getGasPrice()

    const transactionParams = {
        from: ethAcc.address,
        data: bin.bytecode,
        gas: 7000000,
        nonce: nonce,
        gasPrice: gasPrice,
        to: ''
    }

    const signedTx = await web3.eth.accounts.signTransaction(transactionParams, ethAcc.privateKey);
    const tx = await (web3.eth.sendSignedTransaction(signedTx.rawTransaction));

    // console.log("------------------")
    // console.log("blockhashRegistry")
    // console.log("deployed by:", ethAcc.address)
    // console.log("gasUsed:", tx.gasUsed)
    // console.log("costs", web3.utils.toBN(tx.gasUsed).mul(web3.utils.toBN(gasPrice)).div(web3.utils.toBN('1000000000000000000')).toString('hex') + " ether")
    // console.log("blockhashRegistry-address: " + tx.contractAddress)
    // console.log("------------------")
    return tx
}

const deployNodeRegistryLogic = async (web3, blockHashRegistryAddress, nodeRegistryDataAddress, privateKey, minDeposit) => {

    const ethAcc = await web3.eth.accounts.privateKeyToAccount(privateKey ? privateKey : "0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7");

    const bin = JSON.parse(fs.readFileSync('build/contracts/NodeRegistryLogic.json', 'utf8'))

    const bhAddress = blockHashRegistryAddress ? blockHashRegistryAddress : (await deployBlockHashRegistry(web3, ethAcc.privateKey)).contractAddress

    const blockBefore = await web3.eth.getBlock('latest')

    const nonce = await web3.eth.getTransactionCount(ethAcc.address)
    const gasPrice = await web3.eth.getGasPrice()

    const transactionParams = {
        from: ethAcc.address,
        data: bin.bytecode + web3.eth.abi.encodeParameters(['address', 'address', 'uint'], [bhAddress, nodeRegistryDataAddress, minDeposit || "10000000000000000"]).substr(2),
        gas: blockBefore.gasLimit,
        nonce: nonce,
        gasPrice: gasPrice,
        to: ''

    }

    const signedTx = await web3.eth.accounts.signTransaction(transactionParams, ethAcc.privateKey);

    const tx = await (web3.eth.sendSignedTransaction(signedTx.rawTransaction));

    // console.log("nodeRegistryLogic")
    // console.log("------------------")
    // console.log("deployed by:", ethAcc.address)
    // console.log("gasUsed:", tx.gasUsed)
    // console.log("costs", web3.utils.toBN(tx.gasUsed).mul(web3.utils.toBN(gasPrice)).div(web3.utils.toBN('1000000000000000000')).toString('hex') + " ether")
    // console.log("nodeRegistry-address: " + tx.contractAddress)
    // console.log("------------------")
    return tx

}

const deployNodeRegistryData = async (web3, privateKey) => {


    const ethAcc = await web3.eth.accounts.privateKeyToAccount(privateKey ? privateKey : "0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7");

    const bin = JSON.parse(fs.readFileSync('build/contracts/NodeRegistryData.json', 'utf8'))

    const nonce = await web3.eth.getTransactionCount(ethAcc.address)

    const gasPrice = await web3.eth.getGasPrice()

    const transactionParams = {
        from: ethAcc.address,
        data: bin.bytecode,
        gas: 7000000,
        nonce: nonce,
        gasPrice: gasPrice,
        to: ''
    }

    const signedTx = await web3.eth.accounts.signTransaction(transactionParams, ethAcc.privateKey);
    const tx = await (web3.eth.sendSignedTransaction(signedTx.rawTransaction));
    //  console.log("------------------")
    //  console.log("nodeRegistryData")
    //  console.log("deployed by:", ethAcc.address)
    //  console.log("gasUsed:", tx.gasUsed)
    //  console.log("costs", web3.utils.toBN(tx.gasUsed).mul(web3.utils.toBN(gasPrice)).div(web3.utils.toBN('1000000000000000000')).toString('hex') + " ether")
    //  console.log("nodeRegistry-address: " + tx.contractAddress)
    //  console.log("------------------")
    return tx
}

const deployContracts = async (web3, privateKey) => {

    const pk = privateKey || "0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7"
    const ethAcc = await web3.eth.accounts.privateKeyToAccount(pk);

    const blockHashRegistryDeployTx = await deployBlockHashRegistry(web3, pk)
    const blockHashRegistryAddress = blockHashRegistryDeployTx.contractAddress

    const nodeRegistryDataDeployTx = await deployNodeRegistryData(web3, pk)
    const nodeRegistryDataAddress = nodeRegistryDataDeployTx.contractAddress

    const nodeRegistryLogicDeployTx = await deployNodeRegistryLogic(web3, blockHashRegistryAddress, nodeRegistryDataAddress, pk)
    const nodeRegistryLogicAddress = nodeRegistryLogicDeployTx.contractAddress

    const ERC20TokenDeployTx = await deployERC20Wrapper(web3, pk)
    const ERC20TokenAddress = ERC20TokenDeployTx.contractAddress

    const bin = JSON.parse(fs.readFileSync('build/contracts/NodeRegistryData.json', 'utf8'))

    const nodeRegistryData = new web3.eth.Contract(bin.abi, nodeRegistryDataAddress)

    nonce = await web3.eth.getTransactionCount(ethAcc.address)
    gasPrice = await web3.eth.getGasPrice()
    const txParamsSetERC20Token = {
        from: ethAcc.address,
        data: nodeRegistryData.methods.adminSetSupportedToken(ERC20TokenAddress).encodeABI(),
        gas: 7000000,
        nonce: nonce,
        gasPrice: gasPrice,
        to: nodeRegistryDataAddress
    }

    const signedSetToken = await web3.eth.accounts.signTransaction(txParamsSetERC20Token, ethAcc.privateKey);
    await (web3.eth.sendSignedTransaction(signedSetToken.rawTransaction));

    nonce = await web3.eth.getTransactionCount(ethAcc.address)
    gasPrice = await web3.eth.getGasPrice()
    const txParamsSetLogic = {
        from: ethAcc.address,
        data: nodeRegistryData.methods.adminSetLogic(nodeRegistryLogicAddress).encodeABI(),
        gas: 7000000,
        nonce: nonce,
        gasPrice: gasPrice,
        to: nodeRegistryDataAddress
    }

    const signedSetLogic = await web3.eth.accounts.signTransaction(txParamsSetLogic, ethAcc.privateKey);
    await (web3.eth.sendSignedTransaction(signedSetLogic.rawTransaction));

    return {
        blockhashRegistry: blockHashRegistryAddress,
        nodeRegistryLogic: nodeRegistryLogicAddress,
        nodeRegistryData: nodeRegistryDataAddress,
        ERC20Token: ERC20TokenAddress
    }

}

const deployERC20Wrapper = async (web3, privateKey) => {
    const pk = privateKey || "0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7"
    const ethAcc = await web3.eth.accounts.privateKeyToAccount(pk);
    const bin = JSON.parse(fs.readFileSync('build/contracts/ERC20Wrapper.json', 'utf8'))
    const nonce = await web3.eth.getTransactionCount(ethAcc.address)
    const gasPrice = await web3.eth.getGasPrice()
    const transactionParams = {
        from: ethAcc.address,
        data: bin.bytecode,
        gas: 7000000,
        nonce: nonce,
        gasPrice: gasPrice,
        to: ''
    }

    const signedTx = await web3.eth.accounts.signTransaction(transactionParams, ethAcc.privateKey);
    return web3.eth.sendSignedTransaction(signedTx.rawTransaction);

}

const deployWhiteListContract = async (web3, nodeRegistryDataAddress, privateKey) => {
    const pk = privateKey || "0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7"
    const ethAcc = await web3.eth.accounts.privateKeyToAccount(pk);
    const bin = JSON.parse(fs.readFileSync('build/contracts/IN3WhiteList.json', 'utf8'))
    const nonce = await web3.eth.getTransactionCount(ethAcc.address)
    const gasPrice = await web3.eth.getGasPrice()
    const transactionParams = {
        from: ethAcc.address,
        data: bin.bytecode + web3.eth.abi.encodeParameters(['address'], [ nodeRegistryDataAddress]).substr(2),
        gas: 7000000,
        nonce: nonce,
        gasPrice: gasPrice,
        to: ''
    }

    const signedTx = await web3.eth.accounts.signTransaction(transactionParams, ethAcc.privateKey);
    return web3.eth.sendSignedTransaction(signedTx.rawTransaction);

}

module.exports = { deployNodeRegistryLogic, deployBlockHashRegistry, deployNodeRegistryData, deployContracts, deployERC20Wrapper, deployWhiteListContract }