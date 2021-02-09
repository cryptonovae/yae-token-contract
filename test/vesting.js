const { expect } = require("chai");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");

/**
 * Make sure the contract start date for testing is set to 01/01/2020 00:00:00
 */

chai.use(solidity);

describe("Vesting", function() {

    let token;
    let mc;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    let addr4;
    let addr5;
    let addr6;
    let addr7;
    let addr8;
    let addr9;
    let addr10;
    let snapshot;
    

    // This is called before each test to reset the contract
    beforeEach(async function () {
        snapshot = await network.provider.send("evm_snapshot");
        token = await ethers.getContractFactory("YAEToken");
        mc = await token.deploy();
        [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10] = await ethers.getSigners();
        await mc.deployed();
    });

    it("Check if token settings are no placeholders", async function() {
        expect(await mc.name()).to.equal("Cryptonovae");
        expect(await mc.symbol()).to.equal("YAE");
        expect(await mc.decimals()).to.equal(0);
        
        const maxSupply = await mc.getMaxTotalSupply();
        expect(maxSupply.toNumber()).to.equal(100000000);
    });

    it("Should set the right owner", async function () {
        expect(await mc.owner()).to.equal(owner.address);
    });
    
    it("10 allotments in 1", async function() {
        let totalSupply = await mc.totalSupply();
        expect(totalSupply.toNumber()).to.equal(0);
        
        const addrs = [
            addr1.address, 
            addr2.address, 
            addr3.address, 
            addr4.address,
            addr5.address,
            addr6.address,
            addr7.address,
            addr8.address,
            addr9.address,
            addr10.address
        ];

        await mc.addAllocations(addrs, [100, 100, 100, 100, 100, 100, 100, 100, 100, 100], 0);

        totalSupply = await mc.totalSupply();
        expect(totalSupply.toNumber()).to.equal(1000);
        

        await expect(
            mc.connect(addr1).transfer(addr2.address, 100)
        ).to.be.revertedWith("Unable to transfer, not unlocked yet.");
        
        expect(await mc.balanceOf(addr1.address)).to.equal(100);
        expect(await mc.balanceOf(addr2.address)).to.equal(100);
        expect(await mc.balanceOf(addr3.address)).to.equal(100);


    });
    
    it("Full supply allocation, no more", async function() {
        let totalSupply = await mc.totalSupply();
    
        expect(totalSupply.toNumber()).to.equal(0);
        
        await mc.addAllocations([addr1.address], [1000000], 0);
        await mc.addAllocations([addr2.address], [1000000], 1);
        await mc.addAllocations([addr3.address], [1000000], 2);
        await mc.addAllocations([addr4.address], [1000000], 3);
        await mc.addAllocations([addr5.address], [1000000], 4);
        await mc.addAllocations([addr6.address], [1000000], 5);
        await mc.addAllocations([addr7.address], [1000000], 6);
        await mc.addAllocations([addr8.address], [1000000], 7);
        
        await expect(
            mc.addAllocations([addr8.address], [1000000], 3)
        ).to.be.revertedWith("Vesting wallet already created for this address");
        
        await mc.addAllocations([addr9.address], [92000000], 7);

        await expect(
            mc.addAllocations([addr10.address], [1000000], 7)
        ).to.be.revertedWith("Maximum supply exceeded!");
        

        totalSupply = await mc.totalSupply();
        expect(totalSupply.toNumber()).to.equal(100000000);
    });
    
    it("Check vesting at certain dates", async function() {
        let totalSupply = await mc.totalSupply();
        expect(totalSupply.toNumber()).to.equal(0);
            
        // The amount of tokens te allocate for each vesting type
        const total = 10000000;
        
        await mc.addAllocations([addr1.address], [total], 0);
        await mc.addAllocations([addr2.address], [total], 1);
        await mc.addAllocations([addr3.address], [total], 2);
        await mc.addAllocations([addr4.address], [total], 3);
        await mc.addAllocations([addr5.address], [total], 4);
        await mc.addAllocations([addr6.address], [total], 5);
        await mc.addAllocations([addr7.address], [total], 6);
        await mc.addAllocations([addr8.address], [total], 7);
        await mc.addAllocations([addr9.address], [total], 1);

        const daily360 = Math.floor(total/360) + 1;
        const daily150 = Math.floor(total/150) + 1;
        const daily120 = Math.floor(total/120) + 1;
        const daily1080 = Math.floor(total/1080) + 1;
        const daily3600 = Math.floor(total/3600) + 1;

        const nonlin_y1 = 5834;
        const nonlin_y2 = 4167;
        const nonlin_y3 = 3334;
        const nonlin_y4 = 2778;
        
        console.log('\n\n------------- Vesting schedule CSV ------------------------\n\n');
        console.log('Date, Day, Preseed, Seed, P1, P2, IDO, Reserve, Team, Rewards');

        // Set the next block TS to 2021/12/31 23:50:00 for testing,
        // Just before the contract starts
        await network.provider.send("evm_setNextBlockTimestamp", [1640994600]);
        await network.provider.send("evm_mine");
        expect(await mc.getTransferableAmount(addr1.address)).to.equal(0);
        expect(await mc.getTransferableAmount(addr2.address)).to.equal(0);
        expect(await mc.getTransferableAmount(addr3.address)).to.equal(0);
        expect(await mc.getTransferableAmount(addr4.address)).to.equal(0);
        expect(await mc.getTransferableAmount(addr5.address)).to.equal(0);
        expect(await mc.getTransferableAmount(addr6.address)).to.equal(0);
        expect(await mc.getTransferableAmount(addr7.address)).to.equal(0);
        expect(await mc.getTransferableAmount(addr8.address)).to.equal(0);
        expect(await mc.getTransferableAmount(addr9.address)).to.equal(0);
        expect(await mc.getTransferableAmount(addr10.address)).to.equal(0);
        
        console.log('2021/12/31, -1, 0, 0, 0, 0, 0, 0, 0, 0');
        
        // Set the next block TS to 2022/1/2 00:00:00 for testing
        await network.provider.send("evm_setNextBlockTimestamp", [1641031200]);
        await network.provider.send("evm_mine");

        expect(await mc.getTransferableAmount(addr1.address)).to.equal(0);
        expect(await mc.getTransferableAmount(addr2.address)).to.equal(daily360);
        expect(await mc.getTransferableAmount(addr3.address)).to.equal(daily150);
        expect(await mc.getTransferableAmount(addr4.address)).to.equal(daily120);
        expect(await mc.getTransferableAmount(addr5.address)).to.equal(total);
        expect(await mc.getTransferableAmount(addr6.address)).to.equal(daily1080);
        expect(await mc.getTransferableAmount(addr7.address)).to.equal(0);
        expect(await mc.getTransferableAmount(addr8.address)).to.equal(nonlin_y1);
        
        console.log('2022/01/01, 1, 0, '+daily360+', '+daily150+', '+daily120+', '+total+', '+daily1080+', 0, '+nonlin_y1);

        // Transfer too much, not allowed
        await expect(
            mc.connect(addr9).transfer(addr3.address, total-1)
        ).to.be.revertedWith("Unable to transfer, not unlocked yet.");
        
        // Transfer what is available, allowed
        await mc.connect(addr9).transfer(addr10.address, daily360);
        
        // Do it again, should not be allowed
        await expect(
            mc.connect(addr9).transfer(addr10.address, daily360)
        ).to.be.revertedWith("Unable to transfer, not unlocked yet.");

        
        // Set the next block TS to 2022/1/2 00:00:01 for testing
        await network.provider.send("evm_setNextBlockTimestamp", [1641081601]);
        await network.provider.send("evm_mine");
        
        expect(await mc.getTransferableAmount(addr1.address)).to.equal(0);
        expect(await mc.getTransferableAmount(addr2.address)).to.equal(daily360 * 2);
        expect(await mc.getTransferableAmount(addr3.address)).to.equal(daily150 * 2);
        expect(await mc.getTransferableAmount(addr4.address)).to.equal(daily120 * 2);
        expect(await mc.getTransferableAmount(addr5.address)).to.equal(total);
        expect(await mc.getTransferableAmount(addr6.address)).to.equal(daily1080 * 2);
        expect(await mc.getTransferableAmount(addr7.address)).to.equal(0);
        expect(await mc.getTransferableAmount(addr8.address)).to.equal(nonlin_y1 * 2);
        
        console.log('2022/01/02, 2, 0, '+daily360*2+', '+daily150*2+', '+daily120*2+', '+total+', '+daily1080*2+', 0, '+nonlin_y1*2);
        
        // Set the next block TS to 2022/4/1 00:00:01 for testing
        await network.provider.send("evm_setNextBlockTimestamp", [1648771201]);
        await network.provider.send("evm_mine");
        
        expect(await mc.getTransferableAmount(addr1.address)).to.equal(daily360);
        expect(await mc.getTransferableAmount(addr2.address)).to.equal(daily360 * 91);
        expect(await mc.getTransferableAmount(addr3.address)).to.equal(daily150 * 91);
        expect(await mc.getTransferableAmount(addr4.address)).to.equal(daily120 * 91);
        expect(await mc.getTransferableAmount(addr5.address)).to.equal(total);
        expect(await mc.getTransferableAmount(addr6.address)).to.equal(daily1080 * 91);
        expect(await mc.getTransferableAmount(addr7.address)).to.equal(0);
        expect(await mc.getTransferableAmount(addr8.address)).to.equal(nonlin_y1 * 91);
        
        console.log('2022/04/01, 91, '+daily360+', '+daily360*91+', '+daily150*91+', '+daily120*91+', '+total+', '+daily1080*91+', 0, '+nonlin_y1*91);
        
        // Set the next block TS to 2022/6/30 00:00:01 for testing
        await network.provider.send("evm_setNextBlockTimestamp", [1656547201]);
        await network.provider.send("evm_mine");
        
        expect(await mc.getTransferableAmount(addr1.address)).to.equal(daily360 * 91);
        expect(await mc.getTransferableAmount(addr2.address)).to.equal(daily360 * 181);
        expect(await mc.getTransferableAmount(addr3.address)).to.equal(total);
        expect(await mc.getTransferableAmount(addr4.address)).to.equal(total);
        expect(await mc.getTransferableAmount(addr5.address)).to.equal(total);
        expect(await mc.getTransferableAmount(addr6.address)).to.equal(daily1080 * 181);
        expect(await mc.getTransferableAmount(addr7.address)).to.equal(0);
        expect(await mc.getTransferableAmount(addr8.address)).to.equal(nonlin_y1 * 181);
        
        console.log('2022/06/30, 181, '+daily360*91+', '+daily360*181+', '+total+', '+total+', '+total+', '+daily1080*181+', 0, '+nonlin_y1*181);
        
        // Set the next block TS to 2022/12/27 00:00:01 for testing
        await network.provider.send("evm_setNextBlockTimestamp", [1672099201]);
        await network.provider.send("evm_mine");
        
        expect(await mc.getTransferableAmount(addr1.address)).to.equal(daily360 * 271);
        expect(await mc.getTransferableAmount(addr2.address)).to.equal(total);
        expect(await mc.getTransferableAmount(addr3.address)).to.equal(total);
        expect(await mc.getTransferableAmount(addr4.address)).to.equal(total);
        expect(await mc.getTransferableAmount(addr5.address)).to.equal(total);
        expect(await mc.getTransferableAmount(addr6.address)).to.equal(daily1080 * 361);
        expect(await mc.getTransferableAmount(addr7.address)).to.equal(daily360);
        expect(await mc.getTransferableAmount(addr8.address)).to.equal((nonlin_y1 * 360) + nonlin_y2);
        
        console.log('2022/12/27, 361, '+daily360*271+', '+total+', '+total+', '+total+', '+total+', '+daily1080*361+', '+daily360+', '+((nonlin_y1*360)+nonlin_y2));
        
        // Set the next block TS to 2023/12/27 02:00:01 for testing
        await network.provider.send("evm_setNextBlockTimestamp", [1703210401]);
        await network.provider.send("evm_mine");
        
        expect(await mc.getTransferableAmount(addr6.address)).to.equal(daily1080 * 721);
        expect(await mc.getTransferableAmount(addr7.address)).to.equal(total);
        expect(await mc.getTransferableAmount(addr8.address)).to.equal((nonlin_y1 * 360) + (nonlin_y2*360) + nonlin_y3);
        
        console.log('2023/12/22, 721, '+total+', '+total+', '+total+', '+total+', '+total+', '+daily1080*721+', '+total+', '+((nonlin_y1*360)+(nonlin_y2*360)+(nonlin_y3)));
        
        // Set the next block TS to 2024/12/16 02:00:01 for testing
        await network.provider.send("evm_setNextBlockTimestamp", [1734314401]);
        await network.provider.send("evm_mine");
        
        expect(await mc.getTransferableAmount(addr6.address)).to.equal(total);
        expect(await mc.getTransferableAmount(addr8.address)).to.equal((nonlin_y1 * 360) + (nonlin_y2*360) + (nonlin_y3*360) + nonlin_y4);
        
        console.log('2024/12/22, 1081, '+total+', '+total+', '+total+', '+total+', '+total+', '+total+', '+total+', '+((nonlin_y1*360)+(nonlin_y2*360)+(nonlin_y3*360)+nonlin_y4));
        
        // Set the next block TS to 2040/1/1 00:00:01 for testing
        await network.provider.send("evm_setNextBlockTimestamp", [2208988800]);
        await network.provider.send("evm_mine");
        
        expect(await mc.getTransferableAmount(addr1.address)).to.equal(total);
        expect(await mc.getTransferableAmount(addr2.address)).to.equal(total);
        expect(await mc.getTransferableAmount(addr3.address)).to.equal(total);
        expect(await mc.getTransferableAmount(addr4.address)).to.equal(total);
        expect(await mc.getTransferableAmount(addr5.address)).to.equal(total);
        expect(await mc.getTransferableAmount(addr6.address)).to.equal(total);
        expect(await mc.getTransferableAmount(addr7.address)).to.equal(total);
        expect(await mc.getTransferableAmount(addr8.address)).to.equal(total);
        
        console.log('2040/1/1, 6574, '+total+', '+total+', '+total+', '+total+', '+total+', '+total+', '+total+', '+total);
        
        console.log('\n\n-----------------------------------------------------------\n\n');

    });
    

});
