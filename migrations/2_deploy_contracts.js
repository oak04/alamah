/* eslint-disable no-undef */
const FootPrinter = artifacts.require('FootPrinter');

module.exports = function deploy(deployer) {
  deployer.deploy(FootPrinter);
};
