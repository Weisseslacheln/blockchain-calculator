// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Calculator {

    struct Operation {
        string input;
        int256 result;
        uint256 timestamp;
    }

    Operation[] public history;
    address public owner;

    event Calculated(int256 num1, string operator, int256 num2, int256 result);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function calculate(int256 num1, string memory operator, int256 num2) public returns (int256) {
        int256 result;
        if (keccak256(abi.encodePacked(operator)) == keccak256(abi.encodePacked("+"))) {
            result = num1 + num2;
        } else if (keccak256(abi.encodePacked(operator)) == keccak256(abi.encodePacked("-"))) {
            result = num1 - num2;
        } else if (keccak256(abi.encodePacked(operator)) == keccak256(abi.encodePacked("*"))) {
            result = (num1 * num2);
        } else if (keccak256(abi.encodePacked(operator)) == keccak256(abi.encodePacked("/"))) {
            require(num2 != 0, "Division by zero");
            result = (num1) / num2;
        } else {
            revert("Invalid operator");
        }
        
        emit Calculated(num1, operator, num2, result);
        return result;
    }

    function getHistory() public view returns (Operation[] memory) {
        return history;
    }

    function setHistory(string memory input, int256 result) public {
        history.push(Operation(input, result, block.timestamp));
    }


    function clearHistory() public onlyOwner {
        delete history;
    }
}