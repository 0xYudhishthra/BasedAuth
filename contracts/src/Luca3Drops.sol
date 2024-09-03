// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interfaces/IERC6551Registry.sol";

contract Luca3Drops is ERC721 {
    using Strings for uint256;

    struct Student {
        uint256 studentId;
        string metadata;
        address tbaAddress;
        bool isRegistered;
    }

    struct Certification {
        string metadata;
        bool isRegistered;
        mapping(address => bool) hasClaimed;
        address[] eligibleAddresses;
    }

    address public erc6551RegistryAddress_;
    address public erc6551ImplementationAddress_;
    address public snarkVerifier_;
    address public admin_;

    //maps the serial number of the card to the student
    mapping(string => Student) private students_;
    mapping(uint256 => Certification) private certifications_;
    mapping(bytes32 => bool) private metadataHashes_;

    uint256 private currentCertificationId = 0;

    error StudentAlreadyRegistered(uint256 studentId);
    error StudentDoesNotExist(uint256 studentId);
    error CertificationAlreadyRegistered(uint256 certificationId);
    error CertificationDoesNotExist(uint256 certificationId);
    error MetadataIsNotUnique(string metadata);
    error AlreadyClaimed(uint256 certificationId, address studentTBA);
    error NotTokenBoundAccountError(address _walletAddress);
    error SignatureValidationFailed();
    error NotAdmin();
    error NotEligible(uint256 certificationId, address studentTBA);

    event StudentRegistered(
        uint256 studentId,
        string metadata,
        address tbaAddress
    );
    event CertificationCreated(
        uint256 certificationId,
        string metadata,
        address[] eligibleAddresses
    );
    event CertificationClaimed(
        uint256 certificationId,
        string cardUID,
        address studentTBA
    );

    modifier onlyTBA(string memory cardUID) {
        if (msg.sender != students_[cardUID].tbaAddress)
            revert NotTokenBoundAccountError(students_[cardUID].tbaAddress);
        _;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin_) revert NotAdmin();
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _erc6551RegistryAddress,
        address _erc6551ImplementationAddress,
        address _snarkVerifier,
        address _admin
    ) ERC721(_name, _symbol) {
        erc6551RegistryAddress_ = _erc6551RegistryAddress;
        erc6551ImplementationAddress_ = _erc6551ImplementationAddress;
        snarkVerifier_ = _snarkVerifier;
        admin_ = _admin;
    }

    function registerStudent(
        string memory cardUID,
        uint256 studentId,
        string memory metadata
    ) public onlyAdmin returns (address) {
        if (students_[cardUID].isRegistered) {
            revert StudentAlreadyRegistered(students_[cardUID].studentId);
        }

        bytes32 metadataHash = keccak256(abi.encodePacked(metadata));
        if (metadataHashes_[metadataHash]) {
            revert MetadataIsNotUnique(metadata);
        }

        //a random number will be fetched, and the studentId will be the hash of the cardUID and the random number
        uint256 randomNumber = uint256(
            keccak256(abi.encodePacked(block.timestamp, msg.sender))
        );
        uint256 salt = uint256(
            keccak256(abi.encodePacked(cardUID, randomNumber))
        );

        _safeMint(msg.sender, salt);

        IERC6551Registry registry = IERC6551Registry(erc6551RegistryAddress_);
        address tbaAddress = registry.createAccount(
            bytes32(randomNumber),
            block.chainid,
            address(this),
            salt,
            cardUID
        );

        students_[cardUID] = Student({
            studentId: studentId,
            metadata: metadata,
            tbaAddress: tbaAddress,
            isRegistered: true
        });

        metadataHashes_[metadataHash] = true;

        emit StudentRegistered(studentId, metadata, tbaAddress);

        return tbaAddress;
    }

    function createCertification(
        string memory metadata,
        address[] memory eligibleAddresses
    ) public onlyAdmin returns (uint256) {
        bytes32 metadataHash = keccak256(abi.encodePacked(metadata));

        if (metadataHashes_[metadataHash]) {
            revert MetadataIsNotUnique(metadata);
        }

        uint256 newCertificationId = ++currentCertificationId;
        certifications_[newCertificationId].metadata = metadata;
        certifications_[newCertificationId].isRegistered = true;
        certifications_[newCertificationId]
            .eligibleAddresses = eligibleAddresses;
        metadataHashes_[metadataHash] = true;

        emit CertificationCreated(
            newCertificationId,
            metadata,
            eligibleAddresses
        );

        return newCertificationId;
    }

    function isCertificationClaimed(
        uint256 certificationId,
        address studentTBA
    ) public view returns (bool) {
        if (!certifications_[certificationId].isRegistered) {
            revert CertificationDoesNotExist(certificationId);
        }

        return certifications_[certificationId].hasClaimed[studentTBA];
    }

    function markCertificationClaimed(
        uint256 certificationId,
        string memory cardUID,
        address studentTBA
    ) external onlyTBA(cardUID) {
        if (!certifications_[certificationId].isRegistered) {
            revert CertificationDoesNotExist(certificationId);
        }

        bool isEligible = false;
        for (
            uint i = 0;
            i < certifications_[certificationId].eligibleAddresses.length;
            i++
        ) {
            if (
                certifications_[certificationId].eligibleAddresses[i] ==
                studentTBA
            ) {
                isEligible = true;
                break;
            }
        }
        if (!isEligible) {
            revert NotEligible(certificationId, studentTBA);
        }

        certifications_[certificationId].hasClaimed[studentTBA] = true;
        emit CertificationClaimed(certificationId, cardUID, studentTBA);
    }

    function tokenURI(
        string memory cardUID
    ) public view returns (string memory) {
        if (!students_[cardUID].isRegistered) {
            revert StudentDoesNotExist(students_[cardUID].studentId);
        }

        return students_[cardUID].metadata;
    }

    function updateERC6551RegistryAddress(
        address _erc6551RegistryAddress
    ) public {
        erc6551RegistryAddress_ = _erc6551RegistryAddress;
    }

    function updateERC6551ImplementationAddress(
        address _erc6551ImplementationAddress
    ) public {
        erc6551ImplementationAddress_ = _erc6551ImplementationAddress;
    }

    function isTBA(
        string memory cardUID,
        address walletAddress
    ) public view returns (bool) {
        return students_[cardUID].tbaAddress == walletAddress;
    }
}
