pragma solidity ^0.7.6;
pragma experimental ABIEncoderV2;

struct VestingWallet {
    address wallet;
    uint totalAmount;
    uint dayAmount;
    uint startDay;
    uint afterDays;
    bool vesting;
}

/**
 * dailyRate:       the daily amount of tokens to give access to,
 *                  this is a percentage * 1000000000000000000
 * afterDays:       vesting cliff, don't allow any withdrawal before these days expired
**/

struct VestingType {
    uint dailyRate;
    uint afterDays;
    bool vesting;
}

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract VestingToken is Ownable, ERC20Burnable, ERC20Pausable {
    mapping (address => VestingWallet) public vestingWallets;
    VestingType[] public vestingTypes;

    using SafeMath for uint256;
    
    /**
     * Setup the initial supply and types of vesting schema's
    **/
    
    constructor() ERC20("Cryptonovae", "YAE") {
        _setupDecimals(0);

		// 0: 90 Days 0.277% per day (360 days), pre-seed
        vestingTypes.push(VestingType(277777777777777778, 90 days, true));   

        // 1: Immediate release for 360 days, seed, advisor
        vestingTypes.push(VestingType(277777777777777778, 0, true));

        // 2: Immediate release for 150 days, p1
        vestingTypes.push(VestingType(666666666666666667, 0, true));

        // 3: Immediate release for 120 days, p2
        vestingTypes.push(VestingType(833333333333333333, 0, true));

        // 4: IDO, release all first day
        vestingTypes.push(VestingType(100000000000000000000, 0, true)); 

        // 5: Immediate release for 1080 days, reserve
        vestingTypes.push(VestingType(92592592592592592, 0, true));

        // 6: Release for 360 days, after 360 days, team
        vestingTypes.push(VestingType(277777777777777778, 360 days, true));

        // 7: Release immediately, for 3600 days, rewards
        vestingTypes.push(VestingType(27777777777777778, 0, true));
    }
	
    function getListingTime() public pure returns (uint256) {
        return 1640995200; // 2022/1/1 00:00
        //return 1609459200; // 2021/1/1 00:00
        //return 1614607200; // March 1st 2021 @ 2:00pm (UTC)
    }

    function getMaxTotalSupply() public pure returns (uint256) {
        return 100000000;
    }

    function mulDiv(uint x, uint y, uint z) private pure returns (uint) {
        return x.mul(y).div(z);
    }
    
    function addAllocations(address[] memory addresses, uint[] memory totalAmounts, uint vestingTypeIndex) external onlyOwner returns (bool) {
        require(addresses.length == totalAmounts.length, "Address and totalAmounts length must be same");
        require(vestingTypes[vestingTypeIndex].vesting, "Vesting type isn't found");

        VestingType memory vestingType = vestingTypes[vestingTypeIndex];
        uint addressesLength = addresses.length;

        for(uint i = 0; i < addressesLength; i++) {
            address _address = addresses[i];
            uint256 totalAmount = totalAmounts[i];
            // We add 1 to round up, this prevents small amounts from never vesting
            uint256 dayAmount = mulDiv(totalAmounts[i], vestingType.dailyRate, 100000000000000000000).add(1);
            uint256 afterDay = vestingType.afterDays;

            addVestingWallet(_address, totalAmount, dayAmount, afterDay);
        }

        return true;
    }

    function _mint(address account, uint256 amount) internal override {
        uint totalSupply = super.totalSupply();
        require(getMaxTotalSupply() >= totalSupply.add(amount), "Maximum supply exceeded!");
        super._mint(account, amount);
    }

    // Utilizes the overwritten _mint function so won't mint past max supply
    // The provided amount is used for all transactions in this batch
    function batchMint(address[] memory addresses, uint256 amount) external onlyOwner returns (bool) {
        uint addressesLength = addresses.length;
        for(uint i = 0; i < addressesLength; i++) {
            address _address = addresses[i];
            _mint(_address, amount);
        }
        return true;
    }
    
    function addVestingWallet(address wallet, uint totalAmount, uint dayAmount, uint afterDays) internal {

        require(!vestingWallets[wallet].vesting, "Vesting wallet already created for this address");

        uint256 releaseTime = getListingTime();

        // Create vesting wallets
        VestingWallet memory vestingWallet = VestingWallet(
            wallet,
            totalAmount,
            dayAmount,
            releaseTime.add(afterDays),
            afterDays,
            true
        );

        vestingWallets[wallet] = vestingWallet;
        _mint(wallet, totalAmount);
    }

    function getTimestamp() external view returns (uint256) {
        return block.timestamp;
    }

    /**
     * Returns the amount of days passed with vesting
     */

    function getDays(uint afterDays) public view returns (uint) {
        uint256 releaseTime = getListingTime();
        uint time = releaseTime.add(afterDays);

        if (block.timestamp < time) {
            return 0;
        }

        uint diff = block.timestamp.sub(time);
        uint ds = diff.div(1 days).add(1);
        
        return ds;
    }

    function isStarted(uint startDay) public view returns (bool) {
        uint256 releaseTime = getListingTime();

        if (block.timestamp < releaseTime || block.timestamp < startDay) {
            return false;
        }

        return true;
    }

    function getTransferableAmount(address sender) public view returns (uint256) {
        
        if (!vestingWallets[sender].vesting) {
            return balanceOf(sender);
        }

        uint ds = getDays(vestingWallets[sender].afterDays);
        uint256 dailyTransferableAmount = vestingWallets[sender].dayAmount.mul(ds);

        if (dailyTransferableAmount > vestingWallets[sender].totalAmount) {
            return vestingWallets[sender].totalAmount;
        }

        return dailyTransferableAmount;
    }

    function getRestAmount(address sender) public view returns (uint256) {
        uint256 transferableAmount = getTransferableAmount(sender);
        uint256 restAmount = vestingWallets[sender].totalAmount.sub(transferableAmount);

        return restAmount;
    }

    // Transfer control 
    function canTransfer(address sender, uint256 amount) public view returns (bool) {

        // Treat as a normal coin if this is not a vested wallet
        if (!vestingWallets[sender].vesting) {
            return true;
        }

        uint256 balance = balanceOf(sender);
        uint256 restAmount = getRestAmount(sender);

        if (balance > vestingWallets[sender].totalAmount && balance.sub(vestingWallets[sender].totalAmount) >= amount) {
            return true;
        }

        if (!isStarted(vestingWallets[sender].startDay) || balance.sub(amount) < restAmount) {
            return false;
        }

        return true;
    }

    // @override
    function _beforeTokenTransfer(address sender, address recipient, uint256 amount) internal virtual override(ERC20, ERC20Pausable) {
        require(canTransfer(sender, amount), "Unable to transfer, not unlocked yet.");
        super._beforeTokenTransfer(sender, recipient, amount);
    }

    function pause(bool status) public onlyOwner {
        if (status) {
            _pause();
        } else {
            _unpause();
        }
    }
}
