import { useState, useEffect, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, useWriteContract, useReadContract, useWaitForTransactionReceipt, usePublicClient, useWalletClient } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Zap, Shield, Trophy, X, RefreshCw, Lock, Unlock, Sparkles } from 'lucide-react';
import { CONTRACT_ADDRESS, LOTTERY_ABI } from '@/config/contract';
import { initFhevm, encryptChoice, toHex, userDecrypt } from '@/lib/fhe';

type GamePhase = 'select' | 'encrypting' | 'submitting' | 'indexing' | 'waiting' | 'decrypting' | 'result';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('select');
  const [resultHandle, setResultHandle] = useState<string | null>(null);
  const [isWinner, setIsWinner] = useState<boolean | null>(null);
  const [fhevmReady, setFhevmReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const { data: playCount, refetch: refetchPlayCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOTTERY_ABI,
    functionName: 'playCount',
  });

  const { writeContract: playWrite, data: playTxHash, reset: resetPlay } = useWriteContract();
  const { isSuccess: playSuccess } = useWaitForTransactionReceipt({ hash: playTxHash });

  useEffect(() => {
    if (isConnected && !fhevmReady) {
      initFhevm()
        .then(() => setFhevmReady(true))
        .catch((err) => {
          console.error('FHEVM init error:', err);
          setError('Failed to initialize FHE');
        });
    }
  }, [isConnected, fhevmReady]);

  // Handle play success - wait for indexing
  useEffect(() => {
    if (playSuccess && gamePhase === 'submitting') {
      setGamePhase('indexing');
      setCountdown(10); // Wait 10 seconds for relayer to index
      
      refetchPlayCount().then(async ({ data }) => {
        const newPlayId = data ? data - BigInt(1) : BigInt(0);
        
        try {
          const playInfo = await publicClient?.readContract({
            address: CONTRACT_ADDRESS,
            abi: LOTTERY_ABI,
            functionName: 'getPlay',
            args: [newPlayId],
          }) as [string, string];
          
          const handle = playInfo[1]; // resultHandle is second element
          setResultHandle(handle);
          console.log('Got handle:', handle);
        } catch (e) {
          console.error('Failed to get play info:', e);
        }
      });
    }
  }, [playSuccess, gamePhase, refetchPlayCount, publicClient, address]);

  // Countdown timer
  useEffect(() => {
    if (gamePhase === 'indexing' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gamePhase === 'indexing' && countdown === 0) {
      setGamePhase('waiting');
    }
  }, [gamePhase, countdown]);

  const handlePlay = async () => {
    if (!selectedNumber || !address || !fhevmReady) return;
    try {
      setError(null);
      setGamePhase('encrypting');
      const { handle, inputProof } = await encryptChoice(selectedNumber, CONTRACT_ADDRESS, address);
      setGamePhase('submitting');
      playWrite({
        address: CONTRACT_ADDRESS,
        abi: LOTTERY_ABI,
        functionName: 'play',
        args: [toHex(handle), toHex(inputProof)],
      });
    } catch (err: any) {
      setError(err.message || 'Failed');
      setGamePhase('select');
    }
  };

  const handleDecrypt = async () => {
    if (!resultHandle || !address || !walletClient) return;
    
    try {
      setError(null);
      setGamePhase('decrypting');
      
      // Call userDecrypt - sign EIP-712 and get result
      const win = await userDecrypt(resultHandle, address, walletClient, 5);
      console.log('UserDecrypt result:', win);
      
      setIsWinner(win);
      setGamePhase('result');
    } catch (err: any) {
      console.error('Decrypt error:', err);
      setError('Decrypt failed: ' + err.message);
      setGamePhase('waiting');
    }
  };

  const resetGame = useCallback(() => {
    setSelectedNumber(null);
    setGamePhase('select');
    setResultHandle(null);
    setIsWinner(null);
    setError(null);
    setCountdown(0);
    resetPlay();
  }, [resetPlay]);

  return (
    <div className="min-h-screen bg-[#050508] overflow-hidden relative">
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-fuchsia-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 grid-bg opacity-30" />
      </div>

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ y: [0, -30, 0], x: [0, 20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px]" />
        <motion.div animate={{ y: [0, 30, 0], x: [0, -20, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fuchsia-500/15 rounded-full blur-[100px]" />
      </div>

      <header className="relative z-10 flex justify-between items-center p-6 md:px-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <Lock className="w-7 h-7 text-cyan-400" />
          <span className="font-display text-xl md:text-2xl font-bold tracking-widest">
            <span className="text-cyan-400">LOTTERY</span><span className="text-white">DAY</span>
          </span>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          {isConnected ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-sm text-gray-300">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              </div>
              <button onClick={() => disconnect()} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Disconnect</button>
            </div>
          ) : (
            <button onClick={() => connect({ connector: connectors[0] })} disabled={isPending} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full font-display font-semibold text-black">
              <span className="flex items-center gap-2"><Wallet className="w-4 h-4" />{isPending ? 'Connecting...' : 'Connect'}</span>
            </button>
          )}
        </motion.div>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-4 py-8">
        <AnimatePresence mode="wait">
          {!isConnected ? (
            <motion.div key="landing" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="text-center max-w-3xl">
              <h1 className="font-display text-5xl md:text-7xl font-black mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white">LOTTERY</span><br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-fuchsia-300">DAY</span>
              </h1>
              <p className="text-gray-400 text-lg mb-8">Pick a number. Encrypt. Decrypt.</p>
              <div className="flex justify-center gap-3 mb-8">
                {[{ icon: <Lock className="w-4 h-4" />, text: 'FHE Encrypted' }, { icon: <Sparkles className="w-4 h-4" />, text: 'Private' }, { icon: <Zap className="w-4 h-4" />, text: '2 Steps' }].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                    <span className="text-cyan-400">{item.icon}</span>
                    <span className="text-gray-300 text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
              <p className="text-cyan-400/60 text-sm font-mono animate-pulse">[ Connect wallet ]</p>
            </motion.div>
          ) : (
            <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-lg">
              <div className="text-center mb-6">
                <span className="text-gray-500 text-sm">Total Plays: </span>
                <span className="text-fuchsia-400 font-bold">{playCount?.toString() || '0'}</span>
              </div>

              <div className="relative bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-8">
                {/* Refresh Button */}
                <button 
                  onClick={resetGame}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                  title="Reset Game"
                >
                  <RefreshCw className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                </button>

                <AnimatePresence mode="wait">
                  {gamePhase === 'select' && (
                    <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <h2 className="font-display text-2xl font-bold text-white text-center mb-2">Pick 1-10</h2>
                      <p className="text-gray-400 text-sm text-center mb-6">Match the random number to win</p>
                      <div className="grid grid-cols-5 gap-3 mb-6">
                        {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                          <motion.button key={n} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectedNumber(n)}
                            className={`aspect-square rounded-xl font-display text-xl font-bold transition-all ${selectedNumber === n ? 'bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-white shadow-[0_0_30px_rgba(0,255,255,0.4)]' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'}`}
                          >{n}</motion.button>
                        ))}
                      </div>
                      <button onClick={handlePlay} disabled={!selectedNumber || !fhevmReady}
                        className={`w-full py-4 rounded-xl font-display font-bold text-lg ${selectedNumber && fhevmReady ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-black' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}
                      ><Zap className="w-4 h-4 inline mr-2" />Encrypt & Submit</button>
                      {!fhevmReady && <p className="text-yellow-400/60 text-xs mt-3 text-center">Initializing FHE...</p>}
                    </motion.div>
                  )}

                  {(gamePhase === 'encrypting' || gamePhase === 'submitting') && (
                    <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
                      <h3 className="font-display text-xl font-bold text-white">{gamePhase === 'encrypting' ? 'Encrypting...' : 'Submitting...'}</h3>
                    </motion.div>
                  )}

                  {gamePhase === 'indexing' && (
                    <motion.div key="indexing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <span className="font-display text-3xl font-bold text-cyan-400">{countdown}</span>
                      </div>
                      <h3 className="font-display text-xl font-bold text-cyan-400 mb-2">Indexing...</h3>
                      <p className="text-gray-400 text-sm">Waiting for relayer to index your encrypted data</p>
                    </motion.div>
                  )}

                  {gamePhase === 'waiting' && (
                    <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-display text-xl font-bold text-emerald-400 mb-2">Ready!</h3>
                      <p className="text-gray-400 text-sm mb-6">Sign to decrypt your private result</p>
                      <button onClick={handleDecrypt} className="px-8 py-3 bg-gradient-to-r from-fuchsia-500 to-fuchsia-400 rounded-xl font-display font-bold text-white">
                        <Unlock className="w-4 h-4 inline mr-2" />Decrypt Result
                      </button>
                    </motion.div>
                  )}

                  {gamePhase === 'decrypting' && (
                    <motion.div key="dec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12">
                      <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} transition={{ duration: 2, repeat: Infinity }} className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center">
                        <RefreshCw className="w-8 h-8 text-white" />
                      </motion.div>
                      <h3 className="font-display text-xl font-bold text-white">Decrypting...</h3>
                      <p className="text-gray-400 text-sm mt-2">This may take a moment</p>
                    </motion.div>
                  )}

                  {gamePhase === 'result' && (
                    <motion.div key="res" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
                      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                        className={`w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center ${isWinner ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_40px_rgba(251,191,36,0.5)]' : 'bg-gray-800'}`}
                      >
                        {isWinner ? <Trophy className="w-12 h-12 text-white" /> : <X className="w-12 h-12 text-gray-500" />}
                      </motion.div>
                      <h3 className={`font-display text-3xl font-black mb-6 ${isWinner ? 'text-amber-400' : 'text-gray-500'}`}>
                        {isWinner ? 'YOU WIN!' : 'Not This Time'}
                      </h3>
                      <button onClick={resetGame} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-display font-bold text-white hover:bg-white/10">
                        Play Again
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 text-center py-6">
        <p className="text-gray-600 text-sm font-mono"><Shield className="w-3 h-3 inline mr-1" />Powered by FHE</p>
      </footer>
    </div>
  );
}
