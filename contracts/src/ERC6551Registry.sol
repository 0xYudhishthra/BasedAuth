// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.4;

import "./interfaces/IERC6551Registry.sol";

/// @title ERC6551Registry
/// @author Luca3
/// @notice This contract implements the ERC6551 Registry standard for creating and managing token bound accounts
/// @dev This contract uses assembly for gas optimization and implements the IERC6551Registry interface
contract ERC6551Registry is IERC6551Registry {
    /// @notice Emitted when a new SNARK verifier is set
    event SnarkVerifierSet(address indexed snarkVerifier);

    /// @notice Emitted when a new implementation address is set
    event ImplementationSet(address indexed implementation);

    /// @notice Emitted when a new admin address is set
    event AdminSet(address indexed admin);

    /// @notice The address of the implementation contract
    address public implementation_;

    /// @notice The address of the SNARK verifier contract
    address public snarkVerifier_;

    /// @notice The address of the admin
    address public admin_;

    /// @notice The cardUID (purpose not specified in the contract)
    string public cardUID_;

    /// @notice Ensures only the admin can call the function
    modifier onlyAdmin() {
        require(msg.sender == admin_, "Only admin can call this function");
        _;
    }

    /// @notice Initializes the contract with necessary addresses
    /// @param _snarkVerifier The address of the SNARK verifier contract
    /// @param _implementation The address of the implementation contract
    /// @param _admin The address of the admin
    constructor(
        address _snarkVerifier,
        address _implementation,
        address _admin
    ) {
        snarkVerifier_ = _snarkVerifier;
        implementation_ = _implementation;
        admin_ = _admin;
    }

    /// @notice Creates a new ERC6551 account
    /// @dev Uses CREATE2 to deploy a new account contract
    /// @param salt A unique value to ensure a unique deployment address
    /// @param chainId The chain ID where the NFT contract is deployed
    /// @param tokenContract The address of the NFT contract
    /// @param tokenId The ID of the NFT
    /// @param cardUID The card UID (purpose not specified)
    /// @return The address of the newly created account
    function createAccount(
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        string memory cardUID
    ) external returns (address) {
        assembly {
            // Memory Layout:
            // 0x00   0xff                           (1 byte)
            // 0x01   registry (address)             (20 bytes)
            // 0x15   salt (bytes32)                 (32 bytes)
            // 0x35   Bytecode Hash (bytes32)        (32 bytes)
            // 0x55   ERC-1167 Constructor + Header  (20 bytes)
            // 0x69   implementation (address)       (20 bytes)
            // 0x5D   ERC-1167 Footer                (15 bytes)
            // 0x8C   salt (uint256)                 (32 bytes)
            // 0xAC   chainId (uint256)              (32 bytes)
            // 0xCC   tokenContract (address)        (32 bytes)
            // 0xEC   tokenId (uint256)              (32 bytes)
            // 0xFC   snarkVerifier (address)        (32 bytes)
            // 0x10C  cardUID (string)               (32 bytes)

            // Silence unused variable warnings
            pop(chainId)

            // Copy bytecode + constant data to memory
            calldatacopy(0x8c, 0x24, 0x80) // salt, chainId, tokenContract, tokenId
            mstore(0x6c, 0x5af43d82803e903d91602b57fd5bf3) // ERC-1167 footer
            mstore(0x5d, sload(implementation_.slot)) // implementation
            mstore(0x49, 0x3d60ad80600a3d3981f3363d3d373d3d3d363d73) // ERC-1167 constructor + header

            // Copy create2 computation data to memory
            mstore8(0x00, 0xff) // 0xFF
            mstore(0x35, keccak256(0x55, 0xb7)) // keccak256(bytecode)
            mstore(0x01, shl(96, address())) // registry address
            mstore(0x15, salt) // salt

            // Copy snarkVerifier to memory
            mstore(0xFC, sload(snarkVerifier_.slot))

            // Copy cardUID to memory
            mstore(0x10C, cardUID)

            // Compute account address
            let computed := keccak256(0x00, 0x55)

            // If the account has not yet been deployed
            if iszero(extcodesize(computed)) {
                // Deploy account contract
                let deployed := create2(0, 0x55, 0xd7, salt)

                // Initialize the account with the snarkVerifier address
                let success := call(gas(), deployed, 0, 0, 0x24, 0x20, 0)
                if iszero(success) {
                    revert(0, 0)
                }

                // Revert if the deployment fails
                if iszero(deployed) {
                    mstore(0x00, 0x20188a59) // `AccountCreationFailed()`
                    revert(0x1c, 0x04)
                }

                // Store account address in memory before salt and chainId
                mstore(0x6c, deployed)

                // Emit the ERC6551AccountCreated event
                log4(
                    0x6c,
                    0x60,
                    // `ERC6551AccountCreated(address,address,bytes32,uint256,address,uint256)`
                    0x79f19b3655ee38b1ce526556b7731a20c8f218fbda4a3990b6cc4172fdf88722,
                    sload(implementation_.slot),
                    tokenContract,
                    tokenId
                )

                // Return the account address
                return(0x6c, 0x20)
            }

            // Otherwise, return the computed account address
            mstore(0x00, shr(96, shl(96, computed)))
            return(0x00, 0x20)
        }
    }

    /// @notice Computes the address of an ERC6551 account
    /// @dev This function doesn't deploy the account, it only computes the address
    /// @param salt A unique value to ensure a unique deployment address
    /// @param chainId The chain ID where the NFT contract is deployed
    /// @param tokenContract The address of the NFT contract
    /// @param tokenId The ID of the NFT
    /// @return The computed address of the account
    function account(
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) external view returns (address) {
        assembly {
            // Silence unused variable warnings
            pop(chainId)
            pop(tokenContract)
            pop(tokenId)

            // Copy bytecode + constant data to memory
            calldatacopy(0x8c, 0x24, 0x80) // salt, chainId, tokenContract, tokenId
            mstore(0x6c, 0x5af43d82803e903d91602b57fd5bf3) // ERC-1167 footer
            mstore(0x5d, sload(implementation_.slot)) // implementation
            mstore(0x49, 0x3d60ad80600a3d3981f3363d3d373d3d3d363d73) // ERC-1167 constructor + header

            // Copy create2 computation data to memory
            mstore8(0x00, 0xff) // 0xFF
            mstore(0x35, keccak256(0x55, 0xb7)) // keccak256(bytecode)
            mstore(0x01, shl(96, address())) // registry address
            mstore(0x15, salt) // salt

            // Store computed account address in memory
            mstore(0x00, shr(96, shl(96, keccak256(0x00, 0x55))))

            // Return computed account address
            return(0x00, 0x20)
        }
    }

    /// @notice Sets the address of the SNARK verifier contract
    /// @param _snarkVerifier The address of the SNARK verifier contract
    function setSnarkVerifier(address _snarkVerifier) external onlyAdmin {
        snarkVerifier_ = _snarkVerifier;
        emit SnarkVerifierSet(_snarkVerifier);
    }

    /// @notice Sets the address of the implementation contract
    /// @param _implementation The address of the implementation contract
    function setImplementation(address _implementation) external onlyAdmin {
        implementation_ = _implementation;
        emit ImplementationSet(_implementation);
    }

    /// @notice Sets the address of the admin
    /// @param _newAdmin The address of the new admin
    function setAdmin(address _newAdmin) external onlyAdmin {
        admin_ = _newAdmin;
        emit AdminSet(_newAdmin);
    }
}
