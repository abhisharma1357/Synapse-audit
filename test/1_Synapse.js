const Synapse = artifacts.require('Synapse.sol');
const Crowdsale = artifacts.require('Crowdsale.sol');
const TokenVesting = artifacts.require('TokenVesting.sol');
const { increaseTimeTo, duration } = require('openzeppelin-solidity/test/helpers/increaseTime');
const { latestTime } = require('openzeppelin-solidity/test/helpers/latestTime');
var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

//account 0 Token Owner
//account 1 Crowdsale Owner
//account 2 Vesting Owner 

//account 3 wallet Address for Crowdsale

//account 4 Direct Investor
//account 5 Private Sale  
//account 6 pre sale
//account 7 Public sale
//account 8 
//account 9 

contract('Synapse Contract', async (accounts) => {

  it('Should correctly initialize constructor values of Pexo Token Contract', async () => {
    
    this.tokenhold = await Synapse.new(accounts[0],accounts[1],accounts[2], { gas: 600000000 });
    let totalSupply = await this.tokenhold.totalSupply.call();
    let name = await this.tokenhold.name.call();
    let symbol = await this.tokenhold.symbol.call();
    let owner = await this.tokenhold.owner.call();
    let decimal = await this.tokenhold.decimals.call();
    assert.equal(totalSupply.toNumber()/10**18,990000000);
    assert.equal(name,'Synapsecoin');
    assert.equal(symbol,'SYP');
    assert.equal(decimal.toNumber(),18);
    assert.equal(owner, accounts[0]);
  
  });

  it('Should check Owner of Token contract', async () => {
    
    let tokenOwner = await this.tokenhold.tokenOwner.call();
    let Owner = await this.tokenhold.owner.call();
    assert.equal(tokenOwner,accounts[0]);
    assert.equal(Owner,accounts[0]);  
  });

  it('Should check balance of Token contract Owner', async () => {
    
    var balanceOfTokenOwner = await this.tokenhold.balanceOf.call(accounts[0]);
    assert.equal(balanceOfTokenOwner.toNumber()/10**18,267300000);//All management tokens 27% total Supply(12% Marketing, 9% Expansion, 3% Bounty, 3% Advisor)
  });

  it('Should check Owner of Crowdsale contract', async () => {
    
    let crowdSaleOwner = await this.tokenhold.crowdSaleOwner.call();
    assert.equal(crowdSaleOwner,accounts[1]);  
  });

  it('Should check balance of Crowdsale contract Owner', async () => {
    
    var balanceOfCrowdsaleOwner = await this.tokenhold.balanceOf.call(accounts[1]);
    assert.equal(balanceOfCrowdsaleOwner.toNumber()/10**18,495000000);// token for Sale
  });

  it('Should check Owner of Vesting contract', async () => {
    
    let vestingOwner = await this.tokenhold.vestingOwner.call();
    assert.equal(vestingOwner,accounts[2]);  
  });

  it('Should check balance of Vesting contract Owner', async () => {
    
    var balanceOfVestingOwner = await this.tokenhold.balanceOf.call(accounts[2]);
    assert.equal(balanceOfVestingOwner.toNumber()/10**18,227700000);//23% of total Supply will be freeze(10% team, 8% reserve and 5% others) 
  });

  it('Should check ICO start time before Ico starts', async () => {
    
    var icoStartTime = await this.tokenhold.icoStartTime.call();
    assert.equal(icoStartTime.toNumber(),0);
  });

  it('Should check ICO Finalize time before Ico starts', async () => {
    
    var icoFinalizedTime = await this.tokenhold.icoFinalizedTime.call();
    assert.equal(icoFinalizedTime.toNumber(),0);
  });

  it("Should Deploy Crowdsale Contract", async () => {

    this.crowdhold = await Crowdsale.new(accounts[1], accounts[3], this.tokenhold.address, 100000, { gas: 60000000 });
    let owner = await this.crowdhold.owner.call();
    let wallet = await this.crowdhold.wallet.call();
    let stage = await this.crowdhold.getStage();
    let etherprice = await this.crowdhold.ethPrice.call();
    assert.equal(owner,accounts[1]);
    assert.equal(wallet,accounts[3]);
    assert.equal(stage,'CrowdSale Not Started');
    assert.equal(etherprice.toNumber(),100000);
  });

  it("Should Deploy Vesting Contract", async () => {

    this.vesthold = await TokenVesting.new(this.tokenhold.address, accounts[2], { gas: 6000000 });
    let owner = await this.vesthold.owner.call();
    let PexoTokenAddess = await this.vesthold._token.call();
    assert.equal(owner,accounts[2]);
    assert.equal(PexoTokenAddess,this.tokenhold.address);
  });

  it("Should Not Activate Sale contract by account other than crowdsale Owner", async () => {

try{
   await this.tokenhold.activateSaleContract(this.crowdhold.address, { gas: 500000000, from : accounts[2] });
  }catch(error){
  var error_ = 'VM Exception while processing transaction: revert';
  assert.equal(error.message, error_, 'Reverted ');
}

  });

  it("Should Activate Sale contract by Crowdsale Owner only", async () => {

    await this.tokenhold.activateSaleContract(this.crowdhold.address, { gas: 500000000, from : accounts[1] });
    let saleContract = await this.tokenhold.saleContract.call();
    assert.equal(saleContract,this.crowdhold.address);
  });

  it("should Approve CrowdSale address to spend specific token ", async () => {

    let allowanceBefore = await this.tokenhold.allowance.call(accounts[1],this.crowdhold.address);
    assert.equal(allowanceBefore.toNumber(),0, "allowance is wrong when approve");
    var balanceOfCrowdsaleOwner = await this.tokenhold.balanceOf.call(accounts[1]);
    assert.equal(balanceOfCrowdsaleOwner.toNumber()/10**18,495000000);
    this.tokenhold.approve(this.crowdhold.address,495000000*10**18 , { from: accounts[1] });
    let allowance = await this.tokenhold.allowance.call(accounts[1],this.crowdhold.address);
    assert.equal(allowance.toNumber()/10**18, 495000000, "allowance is wrong when approve");

  });

  it("Should Not set Vesting Contract Address to Synapse token Contract by accounts other than vesting owner", async () => {
    try{
      await this.tokenhold.activateVestingContract(this.vesthold.address, { gas: 600000000, from: accounts[1]});
     }catch(error){
     var error_ = 'VM Exception while processing transaction: revert';
     assert.equal(error.message, error_, 'Reverted ');
   }

  });

  it("Should set Vesting Contract Address to Synapse token Contract by Vesting Owner Only", async () => {

    await this.tokenhold.activateVestingContract(this.vesthold.address, { gas: 600000000, from: accounts[2]});
    let vestingContract = await this.tokenhold.vestingContract.call();
    assert.equal(vestingContract,this.vesthold.address);
  });

  it("should Approve vesting contract address to spend specific token by Vesting Owner", async () => {

    let allowanceBefore = await this.tokenhold.allowance.call(accounts[2],this.vesthold.address);
    assert.equal(allowanceBefore.toNumber(),0, "allowance is wrong when approve");
    var balanceOfCrowdsaleOwner = await this.tokenhold.balanceOf.call(accounts[2]);
    assert.equal(balanceOfCrowdsaleOwner.toNumber()/10**18,227700000);
    this.tokenhold.approve(this.vesthold.address,227700000*10**18 , { from: accounts[2] });
    let allowance = await this.tokenhold.allowance.call(accounts[2],this.vesthold.address);
    assert.equal(allowance.toNumber()/10**18, 227700000, "allowance is wrong when approve");

  });

  it("Should Not be able to pause Token contract from Non Owner accounts", async () => {

  try{
  var pauseStatusBefore = await this.tokenhold.paused.call();
  assert.equal(pauseStatusBefore,false);
  await this.tokenhold.pause({from : accounts[1]});
  }catch(error){
  var error_ = 'VM Exception while processing transaction: revert';
  assert.equal(error.message, error_, 'Reverted ');
}

  });

  it("Should be able to pause Token contract", async () => {

    var pauseStatusBefore = await this.tokenhold.paused.call();
    assert.equal(pauseStatusBefore,false);
    await this.tokenhold.pause({from : accounts[0]});
    var pauseStatusAfter = await this.tokenhold.paused.call();
    assert.equal(pauseStatusAfter,true);
  });

  it("Should Not be able unPause Token contract from Non Owner Accounts", async () => {
try{
  var pauseStatusBefore = await this.tokenhold.paused.call();
  assert.equal(pauseStatusBefore,true);
  await this.tokenhold.unpause({from : accounts[1]});
}catch(error){
  var error_ = 'VM Exception while processing transaction: revert';
  assert.equal(error.message, error_, 'Reverted ');
}

  });

  it("Should be able unPause Token contract", async () => {
    var pauseStatusBefore = await this.tokenhold.paused.call();
    assert.equal(pauseStatusBefore,true);
    await this.tokenhold.unpause({from : accounts[0]});
    var pauseStatusAfter = await this.tokenhold.paused.call();
    assert.equal(pauseStatusAfter,false);
  });

  it("Should Not be able to freeze account from Non Owner Account", async () => {

try{
   let freezedaccount1 = await this.tokenhold.frozenAccounts.call(accounts[8]);
   assert.equal(freezedaccount1,false);
   await this.tokenhold.freezeAccount(accounts[8],true,{from : accounts[1]});
  }catch(error){
   var error_ = 'VM Exception while processing transaction: revert';
   assert.equal(error.message, error_, 'Reverted ');
}
  });

  it("Should be able to freeze account", async () => {

    let freezedaccount1 = await this.tokenhold.frozenAccounts.call(accounts[8]);
    assert.equal(freezedaccount1,false);
    await this.tokenhold.freezeAccount(accounts[8],true,{from : accounts[0]});
    let freezedaccount = await this.tokenhold.frozenAccounts.call(accounts[8]);
    assert.equal(freezedaccount,true);

  });

  it("Should be able to check tokens for Management Tokens ", async () => {

    let managementTokens = await this.tokenhold.managementTokens.call();
    assert.equal(managementTokens.toNumber()/10**18,267300000);
  });

  it("Should be able to check tokens for Bounty ", async () => {

    let bountyTokens = await this.tokenhold.bountyTokens.call();
    assert.equal(bountyTokens.toNumber()/10**18,29700000);
  });

  it("Should be able to check tokens for Marketing ", async () => {

    let marketingTokens = await this.tokenhold.marketingTokens.call();
    assert.equal(marketingTokens.toNumber()/10**18,118800000);
  });

  it("Should be able to check tokens for Expansion ", async () => {

    let expansionTokens = await this.tokenhold.expansionTokens.call();
    assert.equal(expansionTokens.toNumber()/10**18,89100000);
  });

  it("Should Not be able to Unfreeze account from Non Owner Account", async () => {

try{
  let freezedaccount1 = await this.tokenhold.frozenAccounts.call(accounts[8]);
  assert.equal(freezedaccount1,true);
  await this.tokenhold.freezeAccount(accounts[8],false,{from : accounts[1]});
}catch(error){
  var error_ = 'VM Exception while processing transaction: revert';
  assert.equal(error.message, error_, 'Reverted ');
}
});

  it("Should be able to Unfreeze account", async () => {

    let freezedaccount1 = await this.tokenhold.frozenAccounts.call(accounts[8]);
    assert.equal(freezedaccount1,true);
    await this.tokenhold.freezeAccount(accounts[8],false,{from : accounts[0]});
    let freezedaccount = await this.tokenhold.frozenAccounts.call(accounts[8]);
    assert.equal(freezedaccount,false);

  });

  it("Should be able to check tokens for Advisors ", async () => {

    let advisorTokens = await this.tokenhold.advisorTokens.call();
    assert.equal(advisorTokens.toNumber()/10**18,29700000);
  });

  it("Should be able to check Hardcap of Crowdsale Contract ", async () => {

    let hardCap = await this.crowdhold.hardCap.call();
    assert.equal(hardCap.toNumber()/100000000,18);//18 million
  });

  it("Should be able to check SoftCap of Crowdsale Contract ", async () => {

    let softCap = await this.crowdhold.softCap.call();
    assert.equal(softCap.toNumber()/100000000,3);//3 million
  });

  it("Should be able to check tokens For Sale of Crowdsale Contract ", async () => {

    let tokensForSale = await this.crowdhold.tokensForSale.call();
    assert.equal(tokensForSale.toNumber()/10**18,495000000);
  });

  it("Should be able to check Private sale token sold before sale start ", async () => {

    let privateSaletokenSold = await this.crowdhold.privateSaletokenSold.call();
    assert.equal(privateSaletokenSold.toNumber(),0);
  });

  it("Should be able to check PreSale sale token sold before sale start ", async () => {

    let preSaleTokenSold = await this.crowdhold.preSaleTokenSold.call();
    assert.equal(preSaleTokenSold.toNumber(),0);
  });

  it("Should be able to check Public sale token sold before sale start ", async () => {

    let publicSaleTokenSold = await this.crowdhold.publicSaleTokenSold.call();
    assert.equal(publicSaleTokenSold.toNumber(),0);
  });

  it("Should be able to check tokens Recived per dollar in Private Sale", async () => {

    let tokensPerDollarInPrivateSale = await this.crowdhold.tokensPerDollarInPrivateSale.call();
    assert.equal(tokensPerDollarInPrivateSale.toNumber()/10**18,40); 
   });

  it("Should be able to check stage of a crowdsale contract ", async () => {

    var getTheStagebefore = await this.crowdhold.getStage.call();
    var stageBefore = 'CrowdSale Not Started';
    assert.equal(getTheStagebefore, stageBefore);
  });

  it("Should Not be able to Start CrowdSale from Non Owner accounts", async () => {

try{    var getTheStagebefore = await this.crowdhold.getStage.call();
  var stageBefore = 'CrowdSale Not Started';
  assert.equal(getTheStagebefore, stageBefore);
  await this.crowdhold.startPrivateSale({ from: accounts[2], gas: 500000000 });
}catch(error){
  var error_ = 'VM Exception while processing transaction: revert';
  assert.equal(error.message, error_, 'Reverted ');
}
  });

  it("Should be able to Start CrowdSale ", async () => {

    var getTheStagebefore = await this.crowdhold.getStage.call();
    var stageBefore = 'CrowdSale Not Started';
    assert.equal(getTheStagebefore, stageBefore);
    await this.crowdhold.startPrivateSale({ from: accounts[1], gas: 500000000 });
    var getTheStage = await this.crowdhold.getStage.call();
    var _presale = 'Private Sale Start';
    assert.equal(getTheStage, _presale);

  });

  it("Should be able to check stage of a crowdsale contract after Sale Started", async () => {

    var getTheStage = await this.crowdhold.getStage.call();
    var privateSale = 'Private Sale Start';
    assert.equal(getTheStage, privateSale); 
   });

   it("Should Not be able to pause Crowdsale contract from Non Owner Acoount", async () => {

try{
  var getTheStagebefore1 = await this.crowdhold.getStage.call();
  var stageBefore1 = 'Private Sale Start';
  assert.equal(getTheStagebefore1, stageBefore1);
  var pauseStautsBefore = await this.crowdhold.Paused.call();
  assert.equal(pauseStautsBefore, false, 'Unpaused');
  await this.crowdhold.pause({from : accounts[2]});
}catch(error){
  var error_ = 'VM Exception while processing transaction: revert';
  assert.equal(error.message, error_, 'Reverted ');
}

});

   it("Should be able to pause Crowdsale contract", async () => {

    var getTheStagebefore1 = await this.crowdhold.getStage.call();
    var stageBefore1 = 'Private Sale Start';
    assert.equal(getTheStagebefore1, stageBefore1);
    var pauseStautsBefore = await this.crowdhold.Paused.call();
    assert.equal(pauseStautsBefore, false, 'Unpaused');
    await this.crowdhold.pause({from : accounts[1]});
    var pauseStautsAfter = await this.crowdhold.Paused.call();
    assert.equal(pauseStautsAfter, true, 'Unpaused');
  });

  it("Should Not be able unPause Crowdsale contract from Non Owner Accounts", async () => {

 try{   
  var pauseStatusAfter1 = await this.crowdhold.Paused.call();
  assert.equal(pauseStatusAfter1, true);
  await this.crowdhold.restartSale({from : accounts[2]});}
  catch(error){
    var error_ = 'VM Exception while processing transaction: revert';
    assert.equal(error.message, error_, 'Reverted ');
  }
  });

  it("Should be able unPause Crowdsale contract", async () => {

    var pauseStatusAfter1 = await this.crowdhold.Paused.call();
    assert.equal(pauseStatusAfter1, true);
    await this.crowdhold.restartSale({from : accounts[1]});
    var pauseStatusAfter12 = await this.crowdhold.Paused.call();
    assert.equal(pauseStatusAfter12, false);
  });

  it("Should be able to Send tokens to Direct Investors ", async () => {
 
    try{
      var balanceDirectInvestor = await this.tokenhold.balanceOf.call(accounts[4]);
      assert.equal(balanceDirectInvestor.toNumber()/10**18,0);
      await this.crowdhold.sendDirectInvestorTokens(accounts[4],10000,20000,{from : accounts[2]});
    }catch(error){
      var error_ = 'VM Exception while processing transaction: revert';
      assert.equal(error.message, error_, 'Reverted ');
    }

  });

  it("Should be able to Send tokens to Direct Investors ", async () => {

    var balanceOfCrowdsaleOwner = await this.tokenhold.balanceOf.call(accounts[1]);
    assert.equal(balanceOfCrowdsaleOwner.toNumber()/10**18,495000000);
    var balanceDirectInvestor = await this.tokenhold.balanceOf.call(accounts[4]);
    assert.equal(balanceDirectInvestor.toNumber()/10**18,0);
    await this.crowdhold.sendDirectInvestorTokens(accounts[4],10000,20000,{from : accounts[1]});
    var balanceDirectInvestorLater = await this.tokenhold.balanceOf.call(accounts[4]);
    assert.equal(balanceDirectInvestorLater.toNumber()/10**18,10000,'balance is wrong');
    var balanceOfCrowdsaleOwnerLater = await this.tokenhold.balanceOf.call(accounts[1]);
    assert.equal(balanceOfCrowdsaleOwnerLater.toNumber()/10**18,494990000);
    var totalRaisedInCents = await this.crowdhold.totalRaisedInCents.call();
    assert.equal(totalRaisedInCents.toNumber(),20000);   
  });

  it("Should be able to check Discount in Private Sale ", async () => {

    var discount = await this.crowdhold.discountInCurrentSale();
    assert.equal(discount.toNumber(),50);

  });

  it("Should be able to get correct token amount during Private Sale round one", async () => {

    let tokens = await this.crowdhold.tokenAmount(100);
    assert.equal(tokens.toNumber()/10**18,40);

  });

  it("Should Not be able to buy Tokens when usd in cents are send less than required", async () => {

  try{
  var minimumUsdCentsInPrivateSale = await this.crowdhold.minimumUsdCentsInPrivateSale();
  assert.equal(minimumUsdCentsInPrivateSale.toNumber(),500000);
  await this.crowdhold.buyTokens(accounts[5], { from: accounts[5], value: web3.toWei("2", "ether") });
  }catch(error){
  var error_ = 'VM Exception while processing transaction: revert';
  assert.equal(error.message, error_, 'Reverted ');
}
  
});

  it("Should be able to buy Tokens  according to Private Sale", async () => {

    var balanceOfCrowdsaleOwner = await this.tokenhold.balanceOf.call(accounts[1]);
    assert.equal(balanceOfCrowdsaleOwner.toNumber()/10**18,494990000);
    var balancePrivateSaleInvestor = await this.tokenhold.balanceOf.call(accounts[5]);
    assert.equal(balancePrivateSaleInvestor.toNumber()/10**18,0);
    let etherprice1 = await this.crowdhold.ethPrice.call();
    assert.equal(etherprice1.toNumber(),100000);    
    await this.crowdhold.buyTokens(accounts[5], { from: accounts[5], value: web3.toWei("6", "ether") });
    var tokens = 240000;
    var balancePrivateSaleInvestorLater = await this.tokenhold.balanceOf.call(accounts[5]);
    assert.equal(balancePrivateSaleInvestorLater.toNumber()/10**18,tokens);
    var balanceOfCrowdsaleOwnerLater = await this.tokenhold.balanceOf.call(accounts[1]);
    assert.equal(balanceOfCrowdsaleOwnerLater.toNumber()/10**18,494750000);
  });

  it("Should Not be able to End private sale from Non Owner Account", async () => {

  try{
  var getTheStagebefore = await this.crowdhold.getStage.call();
  var stageBefore = 'Private Sale Start';
  assert.equal(getTheStagebefore, stageBefore);
  await this.crowdhold.endPrivateSale({ from: accounts[2]});
  }catch(error){
  var error_ = 'VM Exception while processing transaction: revert';
  assert.equal(error.message, error_, 'Reverted ');
}


  });

  it("Should End private sale ", async () => {

    var getTheStagebefore = await this.crowdhold.getStage.call();
    var stageBefore = 'Private Sale Start';
    assert.equal(getTheStagebefore, stageBefore);
    await this.crowdhold.endPrivateSale({ from: accounts[1]});
    var getTheStage = await this.crowdhold.getStage.call();
    var _presale = 'Private Sale End';
    assert.equal(getTheStage, _presale);

  });

  it("Should be able to check stage of a crowdsale contract after Private Sale is Ended", async () => {

    var getTheStage = await this.crowdhold.getStage.call();
    var privateSaleEnd = 'Private Sale End';
    assert.equal(getTheStage, privateSaleEnd);
   });

   it("Should Not be able Start Pre sale from Non Owner Account ", async () => {

  try{
  var getTheStage = await this.crowdhold.getStage.call();
  var _presale = 'Private Sale End';
  assert.equal(getTheStage, _presale);    
  await this.crowdhold.startPreSale({ from: accounts[2]});
  }catch(error){
  var error_ = 'VM Exception while processing transaction: revert';
  assert.equal(error.message, error_, 'Reverted ');
 }

});

  it("Should Start Pre sale ", async () => {

    var getTheStage = await this.crowdhold.getStage.call();
    var _presale = 'Private Sale End';
    assert.equal(getTheStage, _presale);    
    await this.crowdhold.startPreSale({ from: accounts[1]});
    var getTheStage = await this.crowdhold.getStage.call();
    var _presale = 'Pre Sale Start';
    assert.equal(getTheStage, _presale);

  });

  it("Should be able to check stage of a crowdsale contract after Pre Sale is Started", async () => {

    var getTheStage = await this.crowdhold.getStage.call();
    var _presale = 'Pre Sale Start';
    assert.equal(getTheStage, _presale);   
  });

  it("Should be able to check Discount in Pre Sale ", async () => {

    var discount = await this.crowdhold.discountInCurrentSale();
    assert.equal(discount.toNumber(),30);

  });

  it("Should be able to get correct token amount during Pre Sale", async () => {

    let tokens = await this.crowdhold.tokenAmount(100);
    assert.equal(tokens.toNumber()/10**18,28.5714);

  });

  it("Should Not be able to buy Tokens when usd in cents are send less than required in Pre Sale", async () => {

    try{
      var minimumUsdCentsInPreSale = await this.crowdhold.minimumUsdCentsInPreSale();
      assert.equal(minimumUsdCentsInPreSale.toNumber(),500000);
      await this.crowdhold.buyTokens(accounts[6], { from: accounts[6], value: web3.toWei("1", "ether") });
    }catch(error){
      var error_ = 'VM Exception while processing transaction: revert';
        assert.equal(error.message, error_, 'Reverted ');
    }
    });
    
    it("Should be able to buy Tokens  according to PreSale", async () => {

      var balanceOfCrowdsaleOwner = await this.tokenhold.balanceOf.call(accounts[1]);
      assert.equal(balanceOfCrowdsaleOwner.toNumber()/10**18,494750000);
      var balancePreSaleInvestor = await this.tokenhold.balanceOf.call(accounts[6]);
      assert.equal(balancePreSaleInvestor.toNumber()/10**18,0);
      let etherprice1 = await this.crowdhold.ethPrice.call();
      assert.equal(etherprice1.toNumber(),100000);    
      await this.crowdhold.buyTokens(accounts[6],{ from: accounts[6], value: web3.toWei("6", "ether") });
      var tokens = 171428.4;
      var balancePrivateSaleInvestorLater = await this.tokenhold.balanceOf.call(accounts[6]);
      assert.equal(balancePrivateSaleInvestorLater.toNumber()/10**18,tokens);
      
    });

    it("Should Not be able to End pre sale from Non Owner Account", async () => {

  try{
    var getTheStage = await this.crowdhold.getStage.call();
    var _presale = 'Pre Sale Start';
    assert.equal(getTheStage, _presale);
    await this.crowdhold.endPreSale({from: accounts[2]});
    }catch(error){
    var error_ = 'VM Exception while processing transaction: revert';
    assert.equal(error.message, error_, 'Reverted ');
  }

 });

    it("Should End pre sale ", async () => {

      var getTheStage = await this.crowdhold.getStage.call();
      var _presale = 'Pre Sale Start';
      assert.equal(getTheStage, _presale);
      await this.crowdhold.endPreSale({from: accounts[1]});
      var getTheStageLater = await this.crowdhold.getStage.call();
      var _presaleStage = 'Pre Sale End';
      assert.equal(getTheStageLater, _presaleStage);
  
    });
  
    it("Should be able to check stage of a crowdsale contract after Pre Sale is end", async () => {
 
      var getTheStageLater = await this.crowdhold.getStage.call();
      var _presaleStage = 'Pre Sale End';
      assert.equal(getTheStageLater, _presaleStage);    
     });

     it("Should Not be able to Start Public Sale from Non Owner Account ", async () => {
  
  try{
  var getTheStageLater = await this.crowdhold.getStage.call();
  var _presaleStage = 'Pre Sale End';
  assert.equal(getTheStageLater, _presaleStage); 
  await this.crowdhold.startPublicSale({ from: accounts[2]});
  }catch(error){
  var error_ = 'VM Exception while processing transaction: revert';
  assert.equal(error.message, error_, 'Reverted ');
}
  
});     
  
    it("Should Start Public Sale ", async () => {
  
      var getTheStageLater = await this.crowdhold.getStage.call();
      var _presaleStage = 'Pre Sale End';
      assert.equal(getTheStageLater, _presaleStage); 
      await this.crowdhold.startPublicSale({ from: accounts[1]});
      var getTheStage = await this.crowdhold.getStage.call();
      var publicSale = 'Public Sale Start';
      assert.equal(getTheStage, publicSale);
  
    });
  
    it("Should be able to check stage of a crowdsale contract after Pre Sale is Started", async () => {
  
      var getTheStage = await this.crowdhold.getStage.call();
      var publicSale = 'Public Sale Start';
      assert.equal(getTheStage, publicSale);   
    });
  
    it("Should be able to check Discount in Public Sale ", async () => {
  
      var discount = await this.crowdhold.discountInCurrentSale();
      assert.equal(discount.toNumber(),0);
  
    });
  
    it("Should be able to get correct token amount during Public Sale", async () => {
  
      let tokens = await this.crowdhold.tokenAmount(100);
      assert.equal(tokens.toNumber()/10**18,20);
    });

  it("Should be able to buy Tokens according to Public Sale", async () => {
    
    var balancePublicSaleInvestor = await this.tokenhold.balanceOf.call(accounts[7]);
    assert.equal(balancePublicSaleInvestor.toNumber()/10**18,0);
    let etherprice1 = await this.crowdhold.ethPrice.call();
    assert.equal(etherprice1.toNumber(),100000);    
    await this.crowdhold.buyTokens(accounts[7],{ from: accounts[7], value: web3.toWei("6", "ether") });
    var tokens = 120000;
    var balancePrivateSaleInvestorLater = await this.tokenhold.balanceOf.call(accounts[7]);
    assert.equal(balancePrivateSaleInvestorLater.toNumber()/10**18,tokens);
      
 });

 it("Should Not be able to End public Sale from Non Owner Account", async () => {

  try{
    var getTheStage = await this.crowdhold.getStage.call();
    var publicSaleStart = 'Public Sale Start';
    assert.equal(getTheStage, publicSaleStart);
    await this.crowdhold.endPublicSale({from: accounts[2]});
  }catch(error){
    var error_ = 'VM Exception while processing transaction: revert';
    assert.equal(error.message, error_, 'Reverted ');
}
});

 it("Should End public Sale", async () => {

  var getTheStage = await this.crowdhold.getStage.call();
  var publicSaleStart = 'Public Sale Start';
  assert.equal(getTheStage, publicSaleStart);
  await this.crowdhold.endPublicSale({from: accounts[1]});
  var getTheStageLater = await this.crowdhold.getStage.call();
  var publicSaleEnd = 'Public Sale End';
  assert.equal(getTheStageLater, publicSaleEnd);

});

it("Should be able to check stage of a crowdsale contract after Public Sale is end", async () => {

  var getTheStageLater = await this.crowdhold.getStage.call();
  var publicSaleEnd = 'Public Sale End';
  assert.equal(getTheStageLater, publicSaleEnd);    
 });

 it("Should Not be able to set ether price from Non Owner Account", async () => {

   try{
    var currentEthprice = 100000;
    var ethpricebefore = await this.crowdhold.ethPrice.call();
    assert.equal(ethpricebefore.toNumber(), currentEthprice, 'ether price before');
    await this.crowdhold.setEthPriceInCents(50000, { from: accounts[2] });
   }catch(error){
    var error_ = 'VM Exception while processing transaction: revert';
    assert.equal(error.message, error_, 'Reverted ');
   }


});

 it("Should be able to set ether price ", async () => {

  var currentEthprice = 100000;
  var toBeEthprice = 50000;
  var ethpricebefore = await this.crowdhold.ethPrice.call();
  assert.equal(ethpricebefore.toNumber(), currentEthprice, 'ether price before');
  await this.crowdhold.setEthPriceInCents(50000, { from: accounts[1] });
  var ethpricenow = await this.crowdhold.ethPrice.call();
  assert.equal(ethpricenow.toNumber(), toBeEthprice, 'ether price After');

});

it("Should be able to check if softCap reached", async () => {

  var softCap = await this.crowdhold.isSoftCapReached();
  assert.equal(softCap,false);

});

it("Should Not be able to Burn Crowdsale Contract Tokens After Sale is Over from Non Owner Account", async () => {

  try{  let stage = await this.crowdhold.getStage();
    assert.equal(stage, "Public Sale End", "Stage is wrong");
    await this.crowdhold.burnTokens({from: accounts[2]});
  }catch(error){
    var error_ = 'VM Exception while processing transaction: revert';
    assert.equal(error.message, error_, 'Reverted ');
  }

});

it("Should be able to Burn Crowdsale Contract Tokens After Sale is Over", async () => {

  let stage = await this.crowdhold.getStage();
  assert.equal(stage, "Public Sale End", "Stage is wrong");
  await this.crowdhold.burnTokens({from: accounts[1]});
});

it("Should Not be able to send Bounty Tokens from Non owner account ", async () => {

  try{
    let bountyTokens = await this.tokenhold.bountyTokens.call();
    assert.equal(bountyTokens.toNumber()/10**18,29700000);
    var tokens = 240000;
    var balancePrivateSaleInvestorLater = await this.tokenhold.balanceOf.call(accounts[5]);
    assert.equal(balancePrivateSaleInvestorLater.toNumber()/10**18,tokens);
    var bountyTokensToSend = 10**18;
    await this.tokenhold.sendBounty(accounts[5],bountyTokensToSend, {from:accounts[1], gas: 5000000 });
  }catch(error){
    var error_ = 'VM Exception while processing transaction: revert';
    assert.equal(error.message, error_, 'Reverted ');
  }
});

it("Should be able to send Bounty Tokens  ", async () => {

  let bountyTokens = await this.tokenhold.bountyTokens.call();
  assert.equal(bountyTokens.toNumber()/10**18,29700000);
  var tokens = 240000;
  var balancePrivateSaleInvestorLater = await this.tokenhold.balanceOf.call(accounts[5]);
  assert.equal(balancePrivateSaleInvestorLater.toNumber()/10**18,tokens);
  var bountyTokensToSend = 10**18;
  await this.tokenhold.sendBounty(accounts[5],bountyTokensToSend, { gas: 5000000 });
  var balanceOfbountyBeneficiary = await this.tokenhold.balanceOf.call(accounts[5]);
  assert.equal(balanceOfbountyBeneficiary.toNumber()/10**18,240001);
  let bountyTokensLeft = await this.tokenhold.bountyTokens.call();
  assert.equal(bountyTokensLeft.toNumber()/ 10 ** 18,29699999,'Wrong bounty sent');

});

it("Should Not be able to send Marketing Tokens from Non Owner Accounts  ", async () => {

  try{
    let marketingTokens = await this.tokenhold.marketingTokens.call();
    assert.equal(marketingTokens.toNumber()/10**18,118800000);
    var tokens = 240001;
    var balancePrivateSaleInvestorLater = await this.tokenhold.balanceOf.call(accounts[5]);
    assert.equal(balancePrivateSaleInvestorLater.toNumber()/10**18,tokens);
    var marketingTokensToSend = 10**18;
    await this.tokenhold.sendMarketingTokens(accounts[5],marketingTokensToSend, { from : accounts[1],gas: 5000000 });
  }catch(error){
    var error_ = 'VM Exception while processing transaction: revert';
    assert.equal(error.message, error_, 'Reverted ');
  }

});

it("Should be able to send Marketing Tokens  ", async () => {

  let marketingTokens = await this.tokenhold.marketingTokens.call();
  assert.equal(marketingTokens.toNumber()/10**18,118800000);
  var tokens = 240001;
  var balancePrivateSaleInvestorLater = await this.tokenhold.balanceOf.call(accounts[5]);
  assert.equal(balancePrivateSaleInvestorLater.toNumber()/10**18,tokens);
  var marketingTokensToSend = 10**18;
  await this.tokenhold.sendMarketingTokens(accounts[5],marketingTokensToSend, { gas: 5000000 });
  var balanceOfbountyBeneficiary = await this.tokenhold.balanceOf.call(accounts[5]);
  assert.equal(balanceOfbountyBeneficiary.toNumber()/10**18,240002);
  let marketingTokensLeft = await this.tokenhold.marketingTokens.call();
  assert.equal(marketingTokensLeft.toNumber()/ 10 ** 18,118799999,'Wrong marketing tokens sent');

});

it("Should Not be able to send expansion Tokens from non Owner Account  ", async () => {

  try{
    let expansionTokens = await this.tokenhold.expansionTokens.call();
    assert.equal(expansionTokens.toNumber()/10**18,89100000);
    var tokens = 240002;
    var balancePrivateSaleInvestorLater = await this.tokenhold.balanceOf.call(accounts[5]);
    assert.equal(balancePrivateSaleInvestorLater.toNumber()/10**18,tokens);
    var expansionTokensToSend = 10**18;
    await this.tokenhold.sendExpansionTokens(accounts[5],expansionTokensToSend, {from: accounts[1], gas: 5000000 });
  }catch(error){
    var error_ = 'VM Exception while processing transaction: revert';
    assert.equal(error.message, error_, 'Reverted ');
  }


});

it("Should be able to send expansion Tokens  ", async () => {

  let expansionTokens = await this.tokenhold.expansionTokens.call();
  assert.equal(expansionTokens.toNumber()/10**18,89100000);
  var tokens = 240002;
  var balancePrivateSaleInvestorLater = await this.tokenhold.balanceOf.call(accounts[5]);
  assert.equal(balancePrivateSaleInvestorLater.toNumber()/10**18,tokens);
  var expansionTokensToSend = 10**18;
  await this.tokenhold.sendExpansionTokens(accounts[5],expansionTokensToSend, { gas: 5000000 });
  var balanceOfexpansionBeneficiary = await this.tokenhold.balanceOf.call(accounts[5]);
  assert.equal(balanceOfexpansionBeneficiary.toNumber()/10**18,240003);
  let expansionTokensLeft = await this.tokenhold.expansionTokens.call();
  assert.equal(expansionTokensLeft.toNumber()/ 10 ** 18,89099999,'Wrong expansion tokens sent');

});

it("Should be able to send advisors Tokens  ", async () => {

  try{
    let advisorTokens = await this.tokenhold.advisorTokens.call();
    assert.equal(advisorTokens.toNumber()/10**18,29700000);
    var tokens = 240003;
    var balancePrivateSaleInvestorLater = await this.tokenhold.balanceOf.call(accounts[5]);
    assert.equal(balancePrivateSaleInvestorLater.toNumber()/10**18,tokens);
    var advisorTokensToSend = 10**18;
    await this.tokenhold.sendAdvisorTokens(accounts[5],advisorTokensToSend, {from: accounts[1], gas: 5000000 });
  }catch(error){
    var error_ = 'VM Exception while processing transaction: revert';
    assert.equal(error.message, error_, 'Reverted ');
  }
});

it("Should be able to send advisors Tokens  ", async () => {

  let advisorTokens = await this.tokenhold.advisorTokens.call();
  assert.equal(advisorTokens.toNumber()/10**18,29700000);
  var tokens = 240003;
  var balancePrivateSaleInvestorLater = await this.tokenhold.balanceOf.call(accounts[5]);
  assert.equal(balancePrivateSaleInvestorLater.toNumber()/10**18,tokens);
  var advisorTokensToSend = 10**18;
  await this.tokenhold.sendAdvisorTokens(accounts[5],advisorTokensToSend, { gas: 5000000 });
  var balanceOfexpansionBeneficiary = await this.tokenhold.balanceOf.call(accounts[5]);
  assert.equal(balanceOfexpansionBeneficiary.toNumber()/10**18,240004);
  let expansionTokensLeft = await this.tokenhold.advisorTokens.call();
  assert.equal(expansionTokensLeft.toNumber()/ 10 ** 18,29699999,'Wrong marketing tokens sent');

});

it("Should be able to check tokens available for Vesting", async () => {

  let tokensAvailableForVesting = await this.vesthold.tokensAvailableForVesting.call();
  assert.equal(tokensAvailableForVesting.toNumber()/10**18,227700000);
});

it("Should be able to check tokens for Team vesting ", async () => {

  let tokensAvailableForTeam = await this.vesthold.tokensAvailableForTeam.call();
  assert.equal(tokensAvailableForTeam.toNumber()/10**18,99000000);
});

it("Should be able to check tokens for Reserve Vesting", async () => {

  let tokensAvailableForReserve = await this.vesthold.tokensAvailableForReserve.call();
  assert.equal(tokensAvailableForReserve.toNumber()/10**18,79200000);
});

it("Should be able to check tokens for others vesting ", async () => {

  let tokensAvailableForOthers = await this.vesthold.tokensAvailableForOthers.call();
  assert.equal(tokensAvailableForOthers.toNumber()/10**18,49500000);
});

it("Should Not be able to transfer Tokens when sale is not finalized", async () => {
  try{
    var balanceOfAccountFive = await this.tokenhold.balanceOf.call(accounts[5]);
    assert.equal(balanceOfAccountFive.toNumber()/10**18,240004);
    await this.tokenhold.transfer(accounts[6], 10**18, { from: accounts[5], gas: 5000000 });
  }catch(error){
  var error_ = 'VM Exception while processing transaction: revert';
  assert.equal(error.message, error_, 'Reverted ');
  }
  });

it("Should Not be able to finalize Sale after sale is Over from Non Owner Account", async () => {

  try{
    let stage = await this.crowdhold.getStage();
    assert.equal(stage, "Public Sale End", "Stage is wrong");
    await this.crowdhold.burnTokens({from: accounts[1]});
    let fundRaisingbefore = await this.tokenhold.fundraising.call();
    assert.equal(fundRaisingbefore, true, "FundRaising is true");
    await this.crowdhold.finalizeSale({from : accounts[2]});
  }catch(error){
    var error_ = 'VM Exception while processing transaction: revert';
    assert.equal(error.message, error_, 'Reverted ');
  }

});

it("Should be able to vest Team Tokens  ", async () => {

  let tokensAvailableForTeam = await this.vesthold.tokensAvailableForTeam.call();
  assert.equal(tokensAvailableForTeam.toNumber()/10**18,99000000);
  var balanceTeamMember = await this.tokenhold.balanceOf.call(accounts[8]);
  assert.equal(balanceTeamMember.toNumber(),0);
  await this.vesthold.vestTeamTokens(accounts[8],100,{from : accounts[2], gas: 5000000 });
  var balanceOfTeamBeneficiary = await this.tokenhold.balanceOf.call(accounts[8]);
  assert.equal(balanceOfTeamBeneficiary.toNumber()/10**18,100);

});

it("Should be able to check address is a vested address  ", async () => {

  var investorIsVested = await this.tokenhold.investorIsVested.call(accounts[8]);
  assert.equal(investorIsVested,true);

});

it("Should be able to vest Reserve Tokens  ", async () => {

  let tokensAvailableForReserve = await this.vesthold.tokensAvailableForReserve.call();
  assert.equal(tokensAvailableForReserve.toNumber()/10**18,79200000);
  var balanceReserveMembers = await this.tokenhold.balanceOf.call(accounts[9]);
  assert.equal(balanceReserveMembers.toNumber()/10**18,0);
  await this.vesthold.vestReserveTokens(accounts[9],100,{from : accounts[2], gas: 5000000 });
  var balanceOfReserveBeneficiary = await this.tokenhold.balanceOf.call(accounts[9]);
  assert.equal(balanceOfReserveBeneficiary.toNumber()/10**18,100);

});

it("Should be able to check address is a vested address  ", async () => {

  var investorIsVested = await this.tokenhold.investorIsVested.call(accounts[9]);
  assert.equal(investorIsVested,true);

});

it("Should be able to check address is Not vested address before vesting ", async () => {

  var investorIsVested = await this.tokenhold.investorIsVested.call(accounts[7]);
  assert.equal(investorIsVested,false);

});

it("Should be able to vest others Tokens  ", async () => {

  let tokensAvailableForOthers = await this.vesthold.tokensAvailableForOthers.call();
  assert.equal(tokensAvailableForOthers.toNumber()/10**18,49500000);
  var balanceOthersMembers = await this.tokenhold.balanceOf.call(accounts[7]);
  assert.equal(balanceOthersMembers.toNumber()/10**18,120000);
  await this.vesthold.vestOthersTokens(accounts[7],100,{from : accounts[2], gas: 5000000 });
  var balanceOfOthersBeneficiary = await this.tokenhold.balanceOf.call(accounts[7]);
  assert.equal(balanceOfOthersBeneficiary.toNumber()/10**18,120100);

});

it("Should be able to check address is a vested address  ", async () => {

  var investorIsVested = await this.tokenhold.investorIsVested.call(accounts[7]);
  assert.equal(investorIsVested,true);

});

it("Should be able to finalize Sale after sale is Over", async () => {

  let stage = await this.crowdhold.getStage();
  assert.equal(stage, "Public Sale End", "Stage is wrong");
  await this.crowdhold.burnTokens({from: accounts[1]});
  let fundRaisingbefore = await this.tokenhold.fundraising.call();
  assert.equal(fundRaisingbefore, true, "FundRaising is true");
  await this.crowdhold.finalizeSale({from : accounts[1]});
  let fundRaising = await this.tokenhold.fundraising.call();
  assert.equal(fundRaising, false, "FundRaising is false");

});

it("Should be able to transfer Tokens after sale is finalise", async () => {

  let balanceRecieverBefore = await this.tokenhold.balanceOf.call(accounts[9]);
  assert.equal(balanceRecieverBefore.toNumber()/10**18, 100, 'balance of beneficery(reciever)');
  await this.tokenhold.transfer(accounts[9], 10*10**18, { from: accounts[5], gas: 5000000 });
  let balanceRecieverAfter = await this.tokenhold.balanceOf.call(accounts[9]);
  assert.equal(balanceRecieverAfter.toNumber()/10**18, 110, 'balance of beneficery(reciever)');    
});

it("Should Not be able to transfer Tokens after sale is finalise of Vested tokens", async () => {

try{
  var investorIsVested = await this.tokenhold.investorIsVested.call(accounts[7]);
  assert.equal(investorIsVested,true);
  await this.tokenhold.transfer(accounts[9], 10*10**18, { from: accounts[7], gas: 5000000 });
}catch(error){
  var error_ = 'VM Exception while processing transaction: revert';
  assert.equal(error.message, error_, 'Reverted ');
}
});

it("should Approve address to spend specific token ", async () => {

  this.tokenhold.approve(accounts[9],100*10**18, { from: accounts[5] });
  let allowance = await this.tokenhold.allowance.call(accounts[5], accounts[9]);
  assert.equal(allowance,100*10**18, "allowance is wrong when approve");

});

it("should change Approval ", async () => {

  let allowance1 = await this.tokenhold.allowance.call(accounts[5], accounts[9]);
  assert.equal(allowance1, 100*10**18, "allowance is wrong when increase approval");
  this.tokenhold.changeApproval(accounts[9], 100*10**18, 1000*10**18, { from: accounts[5] });
  let allowanceNew = await this.tokenhold.allowance.call(accounts[5], accounts[9]);
  assert.equal(allowanceNew, 1000*10**18, "allowance is wrong when increase approval done");

});

it("Should be able to transfer Tokens on the behalf of accounts[5]", async () => {

  let allowanceNew = await this.tokenhold.allowance.call(accounts[5], accounts[9]);
  assert.equal(allowanceNew.toNumber(),1000*10**18, "allowance is wrong before");
  await this.tokenhold.transferFrom(accounts[5],accounts[9],1000*10**18,{from : accounts[9]});
  let allowanceNew1 = await this.tokenhold.allowance.call(accounts[5], accounts[9]);
  assert.equal(allowanceNew1.toNumber(),0, "allowance is wrong After");
  var balance1 = await this.tokenhold.balanceOf.call(accounts[9]);
  assert.equal(balance1.toNumber()/10**18,1110);  
});

it("Should be able to transfer ownership of token Contract ", async () => {

  await this.tokenhold.transferOwnership(accounts[9], { from: accounts[0] });
  let owner = await this.tokenhold.newOwner.call();
  assert.equal(owner, accounts[9], 'Transfered ownership');
});

it("Should be able to Accept ownership of token Contract ", async () => {

  let owner = await this.tokenhold.newOwner.call();
  assert.equal(owner, accounts[9], 'Transfered ownership');
  await this.tokenhold.acceptOwnership.call({from : accounts[9]});
});

it("Should be able to transfer ownership of crowdsale Contract ", async () => {

  await this.crowdhold.transferOwnership(accounts[9], { from: accounts[1] });
  let owner = await this.crowdhold.newOwner.call();
  assert.equal(owner, accounts[9], 'Transfered ownership');
});

it("Should be able to Accept ownership of Crowdsale Contract ", async () => {
  let owner = await this.crowdhold.newOwner.call();
  assert.equal(owner, accounts[9], 'Transfered ownership');
  await this.crowdhold.acceptOwnership.call({from : accounts[9]});
});

it("Should Not be able to transfer Tokens after sale is finalise of Vested tokens", async () => {

  try{
    var investorIsVested = await this.tokenhold.investorIsVested.call(accounts[7]);
    assert.equal(investorIsVested,true);
    await this.tokenhold.transfer(accounts[9], 10*10**18, { from: accounts[7], gas: 5000000 });
  }catch(error){
    var error_ = 'VM Exception while processing transaction: revert';
    assert.equal(error.message, error_, 'Reverted ');
  }
  });

it("Should be able to trasfer tokens after vesting Period is over ", async () => {
 
  this.openingTime = (await latestTime());
  await increaseTimeTo(this.openingTime + duration.seconds(15552000));
  var balanceReciver = await this.tokenhold.balanceOf.call(accounts[9]);
  assert.equal(balanceReciver.toNumber()/10**18,1110);
  var balanceSender = await this.tokenhold.balanceOf.call(accounts[7]);
  assert.equal(balanceSender.toNumber()/10**18,120100);
  var investorIsVested = await this.tokenhold.investorIsVested.call(accounts[7]);
  assert.equal(investorIsVested,true);
  await this.tokenhold.transfer(accounts[9], 10*10**18, { from: accounts[7], gas: 5000000 });
  var balanceReciverLater = await this.tokenhold.balanceOf.call(accounts[9]);
  assert.equal(balanceReciverLater.toNumber()/10**18,1120);
  var balanceSenderLater = await this.tokenhold.balanceOf.call(accounts[7]);
  assert.equal(balanceSenderLater.toNumber()/10**18,120090);
});



})

