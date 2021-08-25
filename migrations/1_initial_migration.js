/* eslint-disable no-undef */
var Migrations = artifacts.require('Migrations');

module.exports = function deploy(deployer) {
  deployer.deploy(Migrations);
};
