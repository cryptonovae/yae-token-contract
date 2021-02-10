const { expect } = require("chai");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");

/**
 * Make sure the contract start date for testing is set to 01/01/2022 00:00:00
 * You can do this in the getListingTime function
 */

chai.use(solidity);

function randomAddress() {
    let num = Math.random() * 100000000000000000000;
    return '0x' + num.toString(16).padStart(40, '0')
}

describe("GAS cost calculation", function() {

    let token;
    let mc;
    

    // This is called before each test to reset the contract
    beforeEach(async function () {
        token = await ethers.getContractFactory("YAEToken");
        mc = await token.deploy();
        await mc.deployed();
    });

    it("3 times 30 transfers in 1", async function() {
        let totalSupply = await mc.totalSupply();
        expect(totalSupply.toNumber()).to.equal(0);
            
        for (let i=0; i<3; i++) {
            let addrs = [];
            let val = [];
            for(let j=0; j<30; j++) {
                addrs.push(randomAddress());
                val.push(100);
            }

            await mc.addAllocations(addrs, val, 0);

        }
    });
});
