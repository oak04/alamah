// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.0 <0.7.0;

contract FootPrinter {
    event NewFootPrint(uint256 footPrintId, string signature);

    struct FootPrint {
        uint256 footPrint;
        string cid;
        string signature;
    }

    mapping(uint256 => string) public footPrintsToSignature;
    mapping(string => uint256) signatureFootPrintsCount;

    mapping(uint256 => address) public footPrintsToOwner;
    mapping(address => uint256) ownerFootprintsCount;

    FootPrint[] public footPrints;

    function createFootPrint(
        string memory _cid,
        string memory _signature
    ) public {
        FootPrint memory newFootPrint = FootPrint(
            now,
            _cid,
            _signature
        );
        footPrints.push(newFootPrint);
        uint256 id = footPrints.length - 1;
        footPrintsToOwner[id] = msg.sender;
        ownerFootprintsCount[msg.sender]++;
        emit NewFootPrint(id, _signature);
    }

    function getFootPrintsBySignature(string calldata _signature)
        external
        view
        returns (uint256[] memory)
    {
        uint256[] memory result = new uint256[](signatureFootPrintsCount[_signature]);
        uint256 counter = 0;
        for (uint256 i = 0; i < footPrints.length; i++) {
            if (keccak256(abi.encodePacked(footPrintsToSignature[i])) == keccak256(abi.encodePacked(_signature))) {
                result[counter] = i;
                counter++;
            }
        }
        return result;
    }

    function getFootPrintsCount() external view returns (uint256 count) {
        return footPrints.length;
    }
}
