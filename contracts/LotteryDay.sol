// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint8, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import "encrypted-types/EncryptedTypes.sol";

/**
 * @title LotteryDay
 * @notice Privacy-preserving lottery using FHE with userDecrypt
 */
contract LotteryDay is ZamaEthereumConfig {
    uint256 public playCount;
    
    struct Play {
        address player;
        bytes32 resultHandle;
    }
    
    mapping(uint256 => Play) public plays;
    
    event Played(uint256 indexed playId, address indexed player, bytes32 resultHandle);
    
    /**
     * @notice Play - encrypt choice, compare with random target
     */
    function play(
        externalEuint8 inputHandle,
        bytes calldata inputProof
    ) external returns (uint256) {
        uint256 playId = playCount++;
        
        euint8 choice = FHE.fromExternal(inputHandle, inputProof);
        
        // Random target (1-10)
        uint8 target = uint8(
            uint256(keccak256(abi.encodePacked(
                playId,
                block.timestamp,
                block.prevrandao,
                msg.sender
            ))) % 10 + 1
        );
        euint8 encryptedTarget = FHE.asEuint8(target);
        
        // Encrypted comparison
        ebool isWinnerEnc = FHE.eq(choice, encryptedTarget);
        bytes32 resultHandle = ebool.unwrap(isWinnerEnc);
        
        plays[playId] = Play({
            player: msg.sender,
            resultHandle: resultHandle
        });
        
        // Allow user to decrypt via userDecrypt
        FHE.allowThis(isWinnerEnc);
        FHE.allow(isWinnerEnc, msg.sender);
        
        emit Played(playId, msg.sender, resultHandle);
        return playId;
    }
    
    /**
     * @notice Get play info
     */
    function getPlay(uint256 playId) external view returns (
        address player,
        bytes32 resultHandle
    ) {
        Play storage p = plays[playId];
        return (p.player, p.resultHandle);
    }
}
