pragma solidity 0.4.24;

import "./Owned.sol";
import "./SafeMath.sol";

contract Synapse {
    function vestingTransfer(address, uint256) external returns (bool);
}

/**
 * @title TokenVesting
 * @dev A token holder contract that can release its token balance gradually like a
 * typical vesting scheme, with a cliff and vesting period. Optionally revocable by the
 * owner.
 */
contract TokenVesting is Owned {
    using SafeMath for uint256;

    Synapse public _token;
    uint256 public teamTokensSent = 0;
    uint256 public reserveTokensSent = 0;
    uint256 public otherTokensSent = 0;    
    
    uint256 public tokensAvailableForVesting = 227700000 * 1 ether;//23% of total Supply will be freeze(10% team, 8% reserve and 5% others)

    uint256 public tokensAvailableForTeam = 99000000 * 1 ether;
    uint256 public tokensAvailableForReserve = 79200000 * 1 ether;    
    uint256 public tokensAvailableForOthers = 49500000 * 1 ether;

    event TeamTokenVested(address _beneficiary,uint256 tokens);
    event ReserveTokenVested(address _beneficiary,uint256 tokens);
    event OtherssTokenVested(address _beneficiary,uint256 tokens);
    
    struct beneficiary {
        address beneficiaryAddress;
        uint256 tokens;
        uint8 tokenType;// 1 for Team , 2 for Reserve , 3 for Others
    }

    mapping(address => beneficiary) public beneficiaryDetails;
    
    constructor(Synapse token,address _owner) Owned(_owner) public {
      _token = token;
    }
    
    /**
    * @dev Creates a vesting contract that vests its balance of any ERC20 token to the
    * _beneficiary, gradually in a linear fashion until _start  By then all
    * of the balance will have vested.
    * @param _beneficiary address of the beneficiary to whom vested tokens are transferred
    */
    function vestTeamTokens(address _beneficiary, uint256 _tokens) public onlyOwner {    

      require(_beneficiary != address(0),'beneficiary address is zero');
      require(beneficiaryDetails[_beneficiary].beneficiaryAddress == (0x0),'beneficiary address is already exits');
      uint256 tokens = _tokens * 1 ether;
      beneficiaryDetails[_beneficiary].beneficiaryAddress  = _beneficiary;
      beneficiaryDetails[_beneficiary].tokens = _tokens * 1 ether;
      beneficiaryDetails[_beneficiary].tokenType = 1;
      teamTokensSent = teamTokensSent.add(tokens);
      require(teamTokensSent <= tokensAvailableForTeam,'team tokens not available');
      require(_token.vestingTransfer(_beneficiary, tokens));
      emit TeamTokenVested(_beneficiary,tokens);    
}

    /**
    * @dev Creates a vesting contract that vests its balance of any ERC20 token to the
    * _beneficiary, gradually in a linear fashion until _start  By then all
    * of the balance will have vested.
    * @param _beneficiary address of the beneficiary to whom vested tokens are transferred
    */
    function vestReserveTokens(address _beneficiary, uint256 _tokens) public onlyOwner {    

      require(_beneficiary != address(0));
      require(beneficiaryDetails[_beneficiary].beneficiaryAddress == (0x0));
      uint256 tokens = _tokens * 1 ether;
      beneficiaryDetails[_beneficiary].beneficiaryAddress  = _beneficiary;
      beneficiaryDetails[_beneficiary].tokens = _tokens * 1 ether;
      beneficiaryDetails[_beneficiary].tokenType = 2;
      reserveTokensSent = reserveTokensSent.add(tokens);
      require(reserveTokensSent <= tokensAvailableForReserve);
      _token.vestingTransfer(_beneficiary, tokens);
      emit ReserveTokenVested(_beneficiary,tokens);
    
}

    /**
    * @dev Creates a vesting contract that vests its balance of any ERC20 token to the
    * _beneficiary, gradually in a linear fashion until _start  By then all
    * of the balance will have vested.
    * @param _beneficiary address of the beneficiary to whom vested tokens are transferred
    */
    function vestOthersTokens(address _beneficiary, uint256 _tokens) public onlyOwner {    

      require(_beneficiary != address(0));
      require(beneficiaryDetails[_beneficiary].beneficiaryAddress == (0x0));
      uint256 tokens = _tokens * 1 ether;
      beneficiaryDetails[_beneficiary].beneficiaryAddress  = _beneficiary;
      beneficiaryDetails[_beneficiary].tokens = _tokens * 1 ether;
      beneficiaryDetails[_beneficiary].tokenType = 3;      
      otherTokensSent = otherTokensSent.add(tokens);
      require(otherTokensSent <= tokensAvailableForOthers);
      _token.vestingTransfer(_beneficiary, tokens);
      emit ReserveTokenVested(_beneficiary,tokens);    
}

    
}