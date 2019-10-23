pragma solidity  0.4.24;
import "./SafeMath.sol";
import "./Owned.sol";
import "./Oraclize.sol";
import "./StandardToken.sol";

contract Synapse {

    function saleTransfer(address,uint256) external returns (bool);
    function finalize() external returns (bool);
}

contract Crowdsale is Owned, usingOraclize { 
  
  using SafeMath for uint256;
  uint256 public ethPrice; // 1 Ether price in USD cents.
  uint256 constant CUSTOM_GASLIMIT = 150000;
  uint256 public updateTime = 0;
  // end oraclize variables

  //Oraclize events
  event LogConstructorInitiated(string nextStep);
  event newOraclizeQuery(string description);
  event newPriceTicker(bytes32 myid, string price, bytes proof);
  // End oraclize events

  // The token being sold
  Synapse public token;

  uint256 public hardCap = 1800000000;//18 million USD in cents 
  uint256 public softCap = 300000000; //3 million USD in cents. 

  uint256 public tokensForSale = 495000000 * 1 ether;//495 million tokens

  uint256 public privateSaletokenSold = 0;
  uint256 public preSaleTokenSold = 0;
  uint256 public publicSaleTokenSold = 0;  
  uint256 public directInvestorsTokenSold = 0;

  //tokens per dollar  
  uint256 public tokensPerDollarInPrivateSale = 40000000000000000000 ;  
  uint256 public tokensPerDollarInPublicSale = 20000000000000000000 ;
  uint256 public tokensPerDollarInPreSale = 28571400000000000000;
  // Address where funds are collected
  address public wallet;

  //Sale minimum maximum values
  uint256 public minimumUsdCentsInPrivateSale = 500000;
  uint256 public MaximumUsdCentsInPrivateSale = 200000000;
  uint256 public minimumUsdCentsInPreSale =500000;
  uint256 public MaximumUsdCentsInPreSale = 200000000;
  uint256 public minimumUsdCentsInPublicSale = 5000;
  uint256 public MaximumUsdCentsInPublicSale = 200000000;

  uint256 public discountInPrivateSale = 50;
  uint256 public discountInPreSale = 30;
  uint256 public discountInPublicSale = 0;
  
  bool public crowdSaleStarted = false;

  // Amount of USD raised in cents
  uint256 public totalRaisedInCents;
  
  enum Stages {CrowdSaleNotStarted, Pause, PrivateSaleStart,PrivateSaleEnd,PreSaleStart,PreSaleEnd,PublicSaleStart,PublicSaleEnd}
  Stages currentStage;
  Stages previousStage;
  bool public Paused;


   modifier CrowdsaleStarted(){
      require(crowdSaleStarted);
      _;
   }
 
    /**
    * Event for token purchase logging
    * @param purchaser who paid for the tokens
    * @param beneficiary who got the tokens
    * @param value weis paid for purchase
    * @param amount amount of tokens purchased
    */
    event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

    /**
    *@dev initializes the crowdsale contract 
    * @param _newOwner Address who has special power to change the ether price in cents according to the market price
    * @param _wallet Address where collected funds will be forwarded to
    * @param _token Address of the token being sold
    *  @param _ethPriceInCents ether price in cents
    */
    constructor(address _newOwner, address _wallet, Synapse _token,uint256 _ethPriceInCents) Owned(_newOwner) public {
        require(_wallet != address(0));
        require(_token != address(0));
        require(_ethPriceInCents > 0);
        wallet = _wallet;
        owner = _newOwner;
        token = _token;
        ethPrice = _ethPriceInCents; //ethPrice in cents
        currentStage = Stages.CrowdSaleNotStarted;
        // oraclize_setProof(proofType_TLSNotary | proofStorage_IPFS);
        // LogConstructorInitiated("Constructor was initiated. Call 'update()' to send the Oraclize Query.");
    }
    
    /**
    * @dev fallback function ***DO NOT OVERRIDE***
    */
    function () external payable {
    
     if(msg.sender != owner){
        buyTokens(msg.sender); 
     }
     else{
     revert();
     }
     
    }

    // Begin : oraclize related functions 
    function __callback(bytes32 myid, string result, bytes proof) public {
        if (msg.sender != oraclize_cbAddress()) revert();
        ethPrice = parseInt(result, 2);
        emit newPriceTicker(myid, result, proof); //event
        if (updateTime > 0) updateAfter(updateTime);
    }

    function update() public onlyOwner {
        if (updateTime > 0) updateTime = 0;
        if (oraclize_getPrice("URL", CUSTOM_GASLIMIT) > this.balance) {
            emit newOraclizeQuery("Oraclize query was NOT sent, please add some ETH to cover for the query fee"); //event
        } else {
            emit newOraclizeQuery("Oraclize query was sent, standing by for the answer.."); //event
            oraclize_query("URL", "json(https://api.kraken.com/0/public/Ticker?pair=ETHUSD).result.XETHZUSD.c.0", CUSTOM_GASLIMIT);
        }
    }

    function updatePeriodically(uint256 _updateTime) public onlyOwner {
        updateTime = _updateTime;
        if (oraclize_getPrice("URL", CUSTOM_GASLIMIT) > this.balance) {
            emit newOraclizeQuery("Oraclize query was NOT sent, please add some ETH to cover for the query fee");
        } else {
            emit newOraclizeQuery("Oraclize query was sent, standing by for the answer..");
            oraclize_query("URL", "json(https://api.kraken.com/0/public/Ticker?pair=ETHUSD).result.XETHZUSD.c.0", CUSTOM_GASLIMIT);
        }
    }

    function updateAfter(uint256 _updateTime) internal {
        if (oraclize_getPrice("URL", CUSTOM_GASLIMIT) > this.balance) {
            emit newOraclizeQuery("Oraclize query was NOT sent, please add some ETH to cover for the query fee");
        } else {
            emit newOraclizeQuery("Oraclize query was sent, standing by for the answer..");
            oraclize_query(_updateTime, "URL", "json(https://api.kraken.com/0/public/Ticker?pair=ETHUSD).result.XETHZUSD.c.0", CUSTOM_GASLIMIT);
        }
    }

    // END : oraclize related functions 

    /**
    * @dev calling this function will pause the sale
    */
    
    function pause() public onlyOwner {
      require(Paused == false);
      require(crowdSaleStarted == true);
      previousStage=currentStage;
      currentStage=Stages.Pause;
      Paused = true;
    }
  
    function restartSale() public onlyOwner {
      require(currentStage == Stages.Pause);
      currentStage=previousStage;
      Paused = false;
    }

    function startPrivateSale() public onlyOwner {
      require(!crowdSaleStarted);
      crowdSaleStarted = true;
      currentStage = Stages.PrivateSaleStart;
    }

    function endPrivateSale() public onlyOwner {

      require(currentStage == Stages.PrivateSaleStart);
      currentStage = Stages.PrivateSaleEnd;

    }

    function startPreSale() public onlyOwner {

    require(currentStage == Stages.PrivateSaleEnd);
    currentStage = Stages.PreSaleStart;
   
    }

    function endPreSale() public onlyOwner {

    require(currentStage == Stages.PreSaleStart);
    currentStage = Stages.PreSaleEnd;
   
    }

    function startPublicSale() public onlyOwner {
    require(currentStage == Stages.PreSaleEnd);
    currentStage = Stages.PublicSaleStart;
    }

    function endPublicSale() public onlyOwner {
    require(currentStage == Stages.PublicSaleStart);
    currentStage = Stages.PublicSaleEnd;
    }

    function getStage() public view returns (string) {
    if (currentStage == Stages.PrivateSaleStart) return 'Private Sale Start';
    else if (currentStage == Stages.PrivateSaleEnd) return 'Private Sale End';
    else if (currentStage == Stages.PreSaleStart) return 'Pre Sale Start';
    else if (currentStage == Stages.PreSaleEnd) return 'Pre Sale End';
    else if (currentStage == Stages.PublicSaleStart) return 'Public Sale Start';    
    else if (currentStage == Stages.PublicSaleEnd) return 'Public Sale End';   
    else if (currentStage == Stages.Pause) return 'paused';
    else if (currentStage == Stages.CrowdSaleNotStarted) return 'CrowdSale Not Started';    
    }
    
    function sendDirectInvestorTokens(address _beneficiary,uint256 _noOfTokens,uint256 _usdCents)  CrowdsaleStarted onlyOwner public{

     require(_beneficiary != address(0));
     require(Paused != true);
     totalRaisedInCents = totalRaisedInCents.add(_usdCents);
     require(totalRaisedInCents <= hardCap);
     uint256 tokens;
     tokens =  _noOfTokens * 1 ether;
     directInvestorsTokenSold = directInvestorsTokenSold.add(tokens);
     require (directInvestorsTokenSold.add(privateSaletokenSold).add(preSaleTokenSold).add(publicSaleTokenSold) <= tokensForSale);
     require(token.saleTransfer(_beneficiary, tokens),'transfer fail'); 

   }    

   /**
   * @dev sets the value of ether price in cents.Can be called only by the owner account.
   * @param _ethPriceInCents price in cents .
   */
   function setEthPriceInCents(uint _ethPriceInCents) onlyOwner public returns(bool) {
        ethPrice = _ethPriceInCents;
        return true;
    }

   /**
   * @param _beneficiary Address performing the token purchase
   */
   function buyTokens(address _beneficiary) CrowdsaleStarted public payable {

    require(Paused != true);
    uint256 weiAmount = msg.value;
    require(weiAmount > 0);    
    uint256 usdCents = weiAmount.mul(ethPrice).div(1 ether); 
    _preValidatePurchase(usdCents);
    // calculate token amount to be created
    uint256 tokens = _getTokenAmount(usdCents);
    _validateCapLimits(usdCents);
    _processPurchase(_beneficiary,tokens);
    wallet.transfer(msg.value);
    emit TokenPurchase(msg.sender, _beneficiary, weiAmount, tokens);
   }
  
   /**
   * @dev Validation of an incoming purchase. Use require statemens to revert state when conditions are not met. Use super to concatenate validations.
   * @param _usdCents Value in usdincents involved in the purchase
   */
   function _preValidatePurchase(uint256 _usdCents) internal view { 

      if (currentStage == Stages.PrivateSaleStart) {

        require(_usdCents >= minimumUsdCentsInPrivateSale && _usdCents <= MaximumUsdCentsInPrivateSale); 

      }
      else if (currentStage == Stages.PreSaleStart) {

        require(_usdCents >= minimumUsdCentsInPreSale && _usdCents <= MaximumUsdCentsInPreSale); 

      }
      else if (currentStage == Stages.PublicSaleStart) {

        require(_usdCents >= minimumUsdCentsInPublicSale && _usdCents <= MaximumUsdCentsInPublicSale); 

      }

    }
    
    /**
    * @dev Validation of the capped restrictions.
    * @param _cents cents amount
    */

    function _validateCapLimits(uint256 _cents) internal {
     
      totalRaisedInCents = totalRaisedInCents.add(_cents);
      require(totalRaisedInCents <= hardCap);
   }
   
   /**
   * @dev Source of tokens. Override this method to modify the way in which the crowdsale ultimately gets and sends its tokens.
   * @param _beneficiary Address performing the token purchase
   * @param _tokenAmount Number of tokens to be emitted
   */
   function _deliverTokens(address _beneficiary, uint256 _tokenAmount) internal {
    
    require(token.saleTransfer(_beneficiary, _tokenAmount));    

   }

   /**
   * @dev Executed when a purchase has been validated and is ready to be executed. Not necessarily emits/sends tokens.
   * @param _beneficiary Address receiving the tokens
   * @param _tokenAmount Number of tokens to be purchased
   */
   function _processPurchase(address _beneficiary, uint256 _tokenAmount) internal {
    _deliverTokens(_beneficiary, _tokenAmount);
   }
  
    /**
    * @param _usdCents Value in usd cents to be converted into tokens
    * @return Number of tokens that can be purchased with the specified _usdCents
    */
    function _getTokenAmount(uint256 _usdCents) CrowdsaleStarted internal view returns (uint256) {
    uint256 tokens;

      if (currentStage == Stages.PrivateSaleStart) {

         tokens = _usdCents.div(100).mul(tokensPerDollarInPrivateSale);

      }
      else if (currentStage == Stages.PreSaleStart) {

         tokens = _usdCents.div(100).mul(tokensPerDollarInPreSale);

      }
      else if (currentStage == Stages.PublicSaleStart) {

         tokens = _usdCents.div(100).mul(tokensPerDollarInPublicSale);

      }      
            return tokens;
    }
    

    function discountInCurrentSale() public view returns (uint256)
    {

    if (currentStage == Stages.PrivateSaleStart) 
    return discountInPrivateSale;
    
    else if (currentStage == Stages.PreSaleStart) 
    return discountInPreSale;
    
    else if (currentStage == Stages.PublicSaleStart)
    return discountInPublicSale;
    }
    
    function tokenAmount(uint256 _usdCents) CrowdsaleStarted public view returns (uint256) {

    uint256 tokens;
 
      if (currentStage == Stages.PrivateSaleStart) {

         tokens = _usdCents.div(100).mul(tokensPerDollarInPrivateSale);

      }
      else if (currentStage == Stages.PreSaleStart) {

         tokens = _usdCents.div(100).mul(tokensPerDollarInPreSale);

      }
      else if (currentStage == Stages.PublicSaleStart) {

         tokens = _usdCents.div(100).mul(tokensPerDollarInPublicSale);

      }      
            return tokens;
}
    /**
    * @dev burn the unsold tokens.
    */
    function burnTokens() public onlyOwner {
        require(currentStage == Stages.PublicSaleEnd);
    StandardToken tokens = StandardToken(token);
    require(tokens.approve(address(this),0));
    }

        
    /**
    * @dev finalize the crowdsale.After finalizing ,tokens transfer can be done.
    */
    function finalizeSale() public  onlyOwner {
        require(currentStage == Stages.PublicSaleEnd);
        require(token.finalize());
        
    }

    function isSoftCapReached() public view returns(bool){
        if(totalRaisedInCents >= softCap){
            return true;
        }
        else {
            return false;
        }
    }

    //Usd
    function minimumInvestmentInCurrentSale() public view returns(uint256)
    {   
    if (currentStage == Stages.PrivateSaleStart) 
    return minimumUsdCentsInPrivateSale;
    
    else if (currentStage == Stages.PreSaleStart) 
    return minimumUsdCentsInPreSale;
    
    else if (currentStage == Stages.PublicSaleStart)
    return minimumUsdCentsInPublicSale;
    
   }
   
    function setPriceforAllPhases(uint256 _privateSale,uint256 _preSale, uint256 _publicSale) public onlyOwner {
    
       tokensPerDollarInPrivateSale = _privateSale * 1 ether;
       tokensPerDollarInPreSale = _preSale * 1 ether;
       tokensPerDollarInPublicSale = _publicSale * 1 ether;

    }   
   
   
   function maximumInvestmentInCurrentSale() public view returns(uint256)
    {   
    if (currentStage == Stages.PrivateSaleStart) 
    return MaximumUsdCentsInPrivateSale;
    
    else if (currentStage == Stages.PreSaleStart) 
    return MaximumUsdCentsInPreSale;
    
    else if (currentStage == Stages.PublicSaleStart)
    return MaximumUsdCentsInPublicSale;
    
}

}
