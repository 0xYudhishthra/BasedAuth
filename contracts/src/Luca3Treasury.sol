// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IProxy.sol";
import "./Luca3Drops.sol";

/// @title Luca3Treasury
/// @author Luca3
/// @notice This contract manages the treasury for the Luca3 system, allowing ETH to USDC swaps for token-bound accounts
/// @dev Inherits from ReentrancyGuard to prevent reentrancy attacks
contract Luca3Treasury is ReentrancyGuard {
    /// @notice The USDC token contract
    IERC20 public usdcToken;

    /// @notice The address of the ETH/USD price proxy contract
    address constant ETH_USD_PRICE_PROXY =
        0xB7ce7B052836c69EaB40a1D5C0b2baeE8eFB86C7;

    /// @notice The address of the USDC/USD price proxy contract
    address constant USDC_USD_PRICE_PROXY =
        0x5fb6E1fBCB474E1aAfFb7C2104d731633D8c3D63;

    /// @notice The Luca3Drops contract instance
    Luca3Drops public luca3Drops;

    /// @notice Emitted when a swap from ETH to USDC occurs
    /// @param tba The address of the token-bound account that performed the swap
    /// @param ethAmount The amount of ETH swapped
    /// @param usdcAmount The amount of USDC received
    event Swapped(address indexed tba, uint256 ethAmount, uint256 usdcAmount);

    /// @notice Constructor to initialize the contract
    /// @param _usdcToken The address of the USDC token contract
    /// @param _luca3Drops The address of the Luca3Drops contract
    constructor(address _usdcToken, address _luca3Drops) {
        usdcToken = IERC20(_usdcToken);
        luca3Drops = Luca3Drops(_luca3Drops);
    }

    /// @notice Swaps ETH for USDC
    /// @dev Only token-bound accounts can perform this swap
    /// @param cardUID The unique identifier of the card associated with the token-bound account
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

    /// @notice Withdraws USDC from the treasury
    /// @dev Only the admin of Luca3Drops can withdraw
    /// @param amount The amount of USDC to withdraw
    function withdrawUsdc(uint256 amount) external {
        require(msg.sender == luca3Drops.admin_(), "Only admin can withdraw");
        require(
            usdcToken.balanceOf(address(this)) >= amount,
            "Insufficient USDC in treasury"
        );

        bool success = usdcToken.transfer(msg.sender, amount);
        require(success, "USDC transfer failed");
    }

    /// @notice Allows the contract to receive ETH
    receive() external payable {}
}
