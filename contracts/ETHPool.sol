//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ETHPool is Ownable {
  using SafeMath for uint256;

  /**
   * @dev Struct to save holder's deposit amount and their accumulated reward
   */
  struct DepositInfo {
    uint256 amount;
    uint256 rewardAccum;
    uint256 index;
  }

  // Name of this pool
  string public name;

  // Array of all holders
  address[] private _holders;

  // Mapping from holder's address to his/her deposit status
  mapping(address => DepositInfo) private _allDeposits;

  // keep track total sum of holder's deposit, not team's reward
  uint256 private _totalHolderDeposit;

  // keep track of the reward time to ensure reward not to deposit before a week
  uint256 private _lastRewardTime;

  constructor(string memory _name) {
    name = _name;
    _lastRewardTime = 0;
  }

  /**
   * @dev users can deposit their ether to the pool
   * deposit amount should be greater than zero.
   */
  function deposit() public payable {
    require(msg.value > 0, "Not enough ether amount");
    if (_allDeposits[msg.sender].index == 0) {
      _allDeposits[msg.sender].amount = msg.value;
      _allDeposits[msg.sender].rewardAccum = 0;
      _holders.push(msg.sender);
      _allDeposits[msg.sender].index = _holders.length;
    } else {
      _allDeposits[msg.sender].amount += msg.value;
    }
    _totalHolderDeposit += msg.value;
  }

  /**
   * @dev Owner can deposit reward manually every week
   */
  function depositReward() public payable onlyOwner {
    // stop running when the value is 0 to avoid unnecessary opcode consume
    require(msg.value > 0, "Not enough reward value");
    require(rewardable(), "Please wait a week");

    uint256 length = _holders.length;
    // accumulate reward status to holders
    for (uint256 i = 0; i < length; i++) {
      _allDeposits[_holders[i]].rewardAccum += (
        _allDeposits[_holders[i]].amount.mul(msg.value)
      ).div(_totalHolderDeposit);
    }
  }

  /**
   * @dev check if the team can deposit reward
   */
  function rewardable() public view returns (bool) {
    return
      _lastRewardTime == 0 || (block.timestamp - _lastRewardTime >= 1 weeks);
  }

  /**
   * @dev get holder's current balance in the pool
   */
  function balanceOf(address holder)
    public
    view
    onlyHolder(holder)
    returns (uint256)
  {
    return _allDeposits[holder].amount + _allDeposits[holder].rewardAccum;
  }

  /**
   * @dev get holder's pending reward status
   */
  function getPendingReward(address holder)
    public
    view
    onlyHolder(holder)
    returns (uint256)
  {
    return _allDeposits[holder].rewardAccum;
  }

  /**
   * @dev withdraw eth from the pool
   */
  function withdraw() public {
    require(_allDeposits[msg.sender].index > 0, "You are not a holder");
    uint256 withdrawAmount = _allDeposits[msg.sender].amount +
      _allDeposits[msg.sender].rewardAccum;

    require(_totalHolderDeposit > withdrawAmount, "Not enough ethers in pool");

    _totalHolderDeposit -= withdrawAmount;
    _removeHolder(_allDeposits[msg.sender].index);
    delete _allDeposits[msg.sender];
    require(payable(msg.sender).send(withdrawAmount), "Withdraw failed");
  }

  function _removeHolder(uint256 index) private {
    _holders[index - 1] = _holders[_holders.length - 1];
  }

  modifier onlyHolder(address holder) {
    require(_allDeposits[holder].index > 0, "No such a holder");
    _;
  }
}
