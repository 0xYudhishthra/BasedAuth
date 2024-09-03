// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IProxy.sol";
import "./Luca3Drops.sol";

contract Luca3Treasury is ReentrancyGuard {
    IERC20 public usdcToken;
    address constant ETH_USD_PRICE_PROXY =
        0xB7ce7B052836c69EaB40a1D5C0b2baeE8eFB86C7;
    address constant USDC_USD_PRICE_PROXY =
        0x5fb6E1fBCB474E1aAfFb7C2104d731633D8c3D63;
    Luca3Drops public luca3Drops;

    event Swapped(address indexed tba, uint256 ethAmount, uint256 usdcAmount);

    constructor(address _usdcToken, address _luca3Drops) {
        usdcToken = IERC20(_usdcToken);
        luca3Drops = Luca3Drops(_luca3Drops);
    }

    function swapEthForUsdc(
        string memory cardUID
    ) external payable nonReentrant {
        require(msg.value > 0, "Must send ETH");
        require(luca3Drops.isTBA(cardUID, msg.sender), "Only TBA can swap");

        (int224 ethUsdPrice, ) = IProxy(ETH_USD_PRICE_PROXY).read();
        (int224 usdcUsdPrice, ) = IProxy(USDC_USD_PRICE_PROXY).read();

        uint256 usdAmount = (msg.value * uint224(ethUsdPrice)) / 1e18;
        uint256 usdcAmount = (usdAmount * 1e6) / uint224(usdcUsdPrice);

        require(
            usdcToken.balanceOf(address(this)) >= usdcAmount,
            "Insufficient USDC in treasury"
        );

        bool success = usdcToken.transfer(msg.sender, usdcAmount);
        require(success, "USDC transfer failed");

        emit Swapped(msg.sender, msg.value, usdcAmount);
    }

    function withdrawUsdc(uint256 amount) external {
        require(msg.sender == luca3Drops.admin_(), "Only admin can withdraw");
        require(
            usdcToken.balanceOf(address(this)) >= amount,
            "Insufficient USDC in treasury"
        );

        bool success = usdcToken.transfer(msg.sender, amount);
        require(success, "USDC transfer failed");
    }

    receive() external payable {}
}
