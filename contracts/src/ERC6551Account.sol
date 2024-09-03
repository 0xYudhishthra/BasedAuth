// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Luca3Drops.sol";
import "./Luca3Treasury.sol";

interface IERC6551Account {
    receive() external payable;
    function token()
        external
        view
        returns (uint256 chainId, address tokenContract, uint256 tokenId);
    function state() external view returns (uint256);
    function isValidSigner(
        address signer,
        bytes calldata context
    ) external view returns (bytes4 magicValue);
}

interface IERC6551Executable {
    function execute(
        address to,
        uint256 value,
        bytes calldata data,
        uint8 operation
    ) external payable returns (bytes memory);
}

/// @title ERC6551 Account Implementation
/// @author Luca3
/// @notice This contract implements the ERC6551 Account standard
/// @dev This contract allows NFTs to own assets and execute transactions
contract ERC6551Account is
    IERC165,
    IERC1271,
    IERC6551Account,
    IERC6551Executable
{
    /// @notice Error thrown when attempting to create a duplicate connection
    /// @param _walletAddress The address that already exists as a connection
    error ConnectionAlreadyExists(address _walletAddress);

    /// @notice Event emitted when a new connection is created
    /// @param name The name of the new connection
    /// @param walletAddress The wallet address of the new connection
    /// @param profilePicture The profile picture URL of the new connection
    event ConnectionCreated(
        string name,
        address walletAddress,
        string profilePicture
    );

    /// @notice The current state of the account
    /// @dev This value is incremented each time the account's state changes
    uint256 public state;

    /// @notice The address of the SNARK verifier contract
    /// @dev This is the contract that will verify the SNARK proofs
    address public snarkVerifier_;

    /// @notice The address of the Luca3Drops contract
    address public luca3DropsAddress_;

    /// @notice The Card UID of the account
    string public cardUID_;

    /// @notice The address of the Luca3Treasury contract
    address public luca3TreasuryAddress_;

    /// @notice Struct to store connection details
    /// @param name The name of the connection
    /// @param walletAddress The wallet address of the connection
    /// @param profilePicture The profile picture URL of the connection
    struct Connection {
        string name;
        address walletAddress;
        string profilePicture;
    }

    /// @notice Array to store all connections
    /// @dev This array is used to store all connections
    Connection[] public connections;

    /// @notice Initializes the account with the SNARK verifier address
    /// @dev This function should be called right after deployment
    /// @param _snarkVerifier The address of the SNARK verifier contract
    /// @param _cardUID The Card UID for this account
    /// @param _luca3Treasury The address of the Luca3Treasury contract
    function initialize(
        address _snarkVerifier,
        string memory _cardUID,
        address _luca3Treasury
    ) external {
        require(snarkVerifier_ == address(0), "Already initialized");
        snarkVerifier_ = _snarkVerifier;
        cardUID_ = _cardUID;
        luca3TreasuryAddress_ = _luca3Treasury;
    }

    /// @notice Allows the account to receive Ether
    /// @dev This function is called when the account receives Ether
    receive() external payable {}

    /// @notice Executes a call on behalf of the account
    /// @dev Only callable by a valid signer
    /// @param to The target address for the call
    /// @param value The amount of Ether to send with the call
    /// @param data The call data
    /// @param operation The type of operation to perform (only call operations are supported)
    /// @return result The result of the call
    function execute(
        address to,
        uint256 value,
        bytes calldata data,
        uint8 operation
    ) external payable virtual returns (bytes memory result) {
        require(_isValidSigner(msg.sender), "Invalid signer");
        require(operation == 0, "Only call operations are supported");

        ++state;

        bool success;
        (success, result) = to.call{value: value}(data);

        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    /// @notice Checks if a given address is a valid signer for this account
    /// @param signer The address to check
    /// @return The magic value if the signer is valid, or 0 otherwise
    function isValidSigner(
        address signer,
        bytes calldata
    ) external view virtual returns (bytes4) {
        if (_isValidSigner(signer)) {
            return IERC6551Account.isValidSigner.selector;
        }
        return bytes4(0);
    }

    /// @notice Retrieves a connection by index
    /// @param index The index of the connection to retrieve
    /// @return The Connection struct at the given index
    function getConnection(
        uint256 index
    ) public view returns (Connection memory) {
        return connections[index];
    }

    /// @notice Validates a signature for ERC1271 compatibility
    /// @param hash The hash of the data that was signed
    /// @param signature The signature to validate
    /// @return magicValue The magic value if the signature is valid, or 0 otherwise
    function isValidSignature(
        bytes32 hash,
        bytes memory signature
    ) external view virtual returns (bytes4 magicValue) {
        bool isValid;

        if (snarkVerifier_ != address(0)) {
            // P256 signature verification
            (bool success, ) = snarkVerifier_.staticcall(signature);
            isValid = success;
        } else {
            // Fallback to existing ECDSA verification
            isValid = SignatureChecker.isValidSignatureNow(
                owner(),
                hash,
                signature
            );
        }

        if (isValid) {
            return IERC1271.isValidSignature.selector;
        }
        return bytes4(0);
    }

    /// @notice Checks if the contract supports a given interface
    /// @param interfaceId The interface identifier to check
    /// @return True if the contract supports the interface, false otherwise
    function supportsInterface(
        bytes4 interfaceId
    ) external pure virtual returns (bool) {
        return
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == type(IERC6551Account).interfaceId ||
            interfaceId == type(IERC6551Executable).interfaceId;
    }

    /// @notice Returns the token associated with this account
    /// @return chainId The chain ID of the token
    /// @return tokenContract The address of the token contract
    /// @return tokenId The ID of the token
    function token() public view virtual returns (uint256, address, uint256) {
        bytes memory footer = new bytes(0x60);

        assembly {
            extcodecopy(address(), add(footer, 0x20), 0x4d, 0x60)
        }

        return abi.decode(footer, (uint256, address, uint256));
    }

    /// @notice Returns the owner of the account
    /// @return The address of the owner
    function owner() public view virtual returns (address) {
        (uint256 chainId, address tokenContract, uint256 tokenId) = token();
        if (chainId != block.chainid) return address(0);

        return IERC721(tokenContract).ownerOf(tokenId);
    }

    /// @notice Internal function to check if a signer is valid
    /// @param signer The address to check
    /// @return True if the signer is valid, false otherwise
    function _isValidSigner(
        address signer
    ) internal view virtual returns (bool) {
        return signer == owner();
    }

    /// @notice Claims a certification using SNARK proof verification
    /// @param certificationId The ID of the certification to claim
    /// @param signature The SNARK proof
    function claimCertification(
        uint256 certificationId,
        bytes memory signature
    ) external {
        require(_isValidSigner(msg.sender), "Invalid signer");
        require(luca3DropsAddress_ != address(0), "Luca3Drops address not set");

        // Verify the SNARK proof
        (bool success, ) = snarkVerifier_.call(signature);
        require(success, "Invalid SNARK proof");

        // Mark the certification as claimed
        Luca3Drops luca3Drops = Luca3Drops(luca3DropsAddress_);
        luca3Drops.markCertificationClaimed(
            certificationId,
            cardUID_,
            address(this)
        );

        // Increment the state
        ++state;
    }

    /// @notice Swaps ETH in the account for USDC using the Luca3Treasury contract
    /// @param _luca3TreasuryAddress The address of the Luca3Treasury contract
    /// @param signature The SNARK proof
    function swapEthForUsdc(
        address _luca3TreasuryAddress,
        bytes memory signature
    ) external {
        require(_isValidSigner(msg.sender), "Invalid signer");
        (bool success, ) = snarkVerifier_.call(signature);
        require(success, "Invalid SNARK proof");

        Luca3Treasury luca3Treasury = Luca3Treasury(
            payable(_luca3TreasuryAddress)
        );
        luca3Treasury.swapEthForUsdc(cardUID_);

        // Increment the state
        ++state;
    }

    /// @notice Transfers USDC from this account to another address
    /// @param _usdcAddress The address of the USDC token contract
    /// @param _recipient The address to receive the USDC
    /// @param _amount The amount of USDC to transfer
    /// @param signature The SNARK proof
    function transferUsdcToAddress(
        address _usdcAddress,
        address _recipient,
        uint256 _amount,
        bytes memory signature
    ) external {
        require(_isValidSigner(msg.sender), "Invalid signer");
        (bool success, ) = snarkVerifier_.call(signature);
        require(success, "Invalid SNARK proof");

        // Transfer USDC from this account to the recipient
        IERC20(_usdcAddress).transfer(_recipient, _amount);

        // Increment the state
        ++state;
    }
}
