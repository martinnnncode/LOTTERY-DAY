import { FHEVM_CONFIG, CHAIN_ID, RPC_URL, CONTRACT_ADDRESS } from '@/config/contract';

let fhevmInstance: any = null;
let sdkInitialized = false;

export async function initFhevm(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('FHEVM can only run in browser');
  }
  
  if (fhevmInstance) {
    return fhevmInstance;
  }

  try {
    if (typeof (window as any).global === 'undefined') {
      (window as any).global = window;
    }

    const { createInstance, initSDK, SepoliaConfig } = await import('@zama-fhe/relayer-sdk/web');

    if (!sdkInitialized) {
      await initSDK({ thread: 1 });
      sdkInitialized = true;
    }

    const config = {
      ...SepoliaConfig,
      chainId: CHAIN_ID,
      relayerUrl: FHEVM_CONFIG.RELAYER_URL,
      network: RPC_URL,
    };

    fhevmInstance = await createInstance(config);
    return fhevmInstance;
  } catch (error) {
    console.error('Failed to initialize FHEVM:', error);
    throw error;
  }
}

export function getFhevmInstance(): any {
  if (!fhevmInstance) {
    throw new Error('FHEVM not initialized');
  }
  return fhevmInstance;
}

export async function encryptChoice(
  choice: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: Uint8Array; inputProof: Uint8Array }> {
  const instance = getFhevmInstance();
  const input = instance.createEncryptedInput(contractAddress, userAddress);
  input.add8(choice);
  const encrypted = await input.encrypt();
  return {
    handle: encrypted.handles[0],
    inputProof: encrypted.inputProof,
  };
}

/**
 * User decrypt - sign EIP-712 and decrypt via relayer
 * Based on ArtEpoch/VendorElect implementation
 */
export async function userDecrypt(
  handle: string,
  userAddress: string,
  signer: any,
  maxRetries: number = 5
): Promise<boolean> {
  const instance = getFhevmInstance();
  
  // Generate keypair for decryption
  const { publicKey, privateKey } = instance.generateKeypair();
  
  // Create EIP-712 message
  const startTimestamp = Math.floor(Date.now() / 1000);
  const durationDays = 1;
  
  const eip712 = instance.createEIP712(
    publicKey,
    [CONTRACT_ADDRESS],
    startTimestamp,
    durationDays
  );
  
  const signature = await signer.signTypedData({
    domain: eip712.domain,
    types: { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
    primaryType: 'UserDecryptRequestVerification',
    message: eip712.message,
  });
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await instance.userDecrypt(
        [{ handle, contractAddress: CONTRACT_ADDRESS }],
        privateKey,
        publicKey,
        signature,
        [CONTRACT_ADDRESS],
        userAddress,
        startTimestamp,
        durationDays
      );
      
      const decryptedValue = result[handle] as boolean;
      return decryptedValue;
      
    } catch (error: any) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = attempt * 5000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('userDecrypt failed after retries');
}

export function toHex(arr: Uint8Array): `0x${string}` {
  return `0x${Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}
