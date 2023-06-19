//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
// import "hardhat/console.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Use openzeppelin to inherit battle-tested implementations (ERC20, ERC721, etc)
// import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * A smart contract that allows changing a state variable of the contract and tracking the changes
 * It also allows the owner to withdraw the Ether in the contract
 * @author BuidlGuidl
 */
contract TokenWill is ReentrancyGuard {
  mapping(bytes32 => uint256) public wills;
  mapping(bytes32 => uint256) public totalAllocations;
  mapping(address => uint256) public deadline;

  // Events: a way to emit log statements from smart contract that can be listened to by external parties
  event WillAdded(address indexed from, address indexed to, address token, uint256 percentage);
  event ProofUpdated(address indexed from, uint256 proofDeadline);
  event WillWithdrawn(address indexed from, address indexed to, address token, uint256 percentage);

  // constructor() {}

  function registerProof(uint256 _deadline) public {
    deadline[msg.sender] = _deadline;

    emit ProofUpdated(msg.sender, _deadline);
  }

  function willToken(address to, IERC20 token, uint256 percentage) public {
    bytes32 allocationKey = keccak256(abi.encode(msg.sender, address(token)));
    bytes32 willKey = keccak256(abi.encode(msg.sender, to, address(token)));

    uint256 currentWill = wills[willKey];
    uint256 newAllocation = totalAllocations[allocationKey] - currentWill + percentage;

    require(newAllocation <= 100, "Allocation exceeded");

    wills[willKey] = percentage;
    totalAllocations[allocationKey] = newAllocation;

    emit WillAdded(msg.sender, to, address(token), percentage);
  }

  function withdraw(address from, IERC20 token) public nonReentrant {
    bytes32 willKey = keccak256(abi.encode(from, msg.sender, address(token)));
    uint256 myPercentage = wills[willKey];
    uint256 allocationsDeadline = deadline[from];

    require(allocationsDeadline >= block.timestamp, "This allocation is not unlocked yet");
    require(myPercentage > 0, "This allocation is empty");

    wills[willKey] = 0;

    uint256 allocationAmount = token.balanceOf(from) * (myPercentage / 100);

    token.transferFrom(from, msg.sender, allocationAmount);

    emit WillWithdrawn(from, msg.sender, address(token), myPercentage);
  }

  function getTotalAllocation(address from, IERC20 token) public view returns (uint256) {
    // console.log(block.timestamp, deadline[from]);
    return totalAllocations[keccak256(abi.encode(from, address(token)))];
  }

  /**
   * Function that allows the contract to receive ETH
   */
  receive() external payable {}
}
