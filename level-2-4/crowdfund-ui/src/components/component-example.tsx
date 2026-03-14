'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { stellar } from '@/lib/stellar-helper'

export function ComponentExample() {
  const [address, setAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    try {
      setError(null)
      const addr = await stellar.connectWallet()
      setAddress(addr)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDisconnect = () => {
    stellar.disconnect()
    setAddress(null)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 max-w-lg mx-auto border rounded-xl shadow-sm mt-10">
      <h2 className="text-2xl font-bold">Wallet Connection Test</h2>
      
      {address ? (
        <div className="flex flex-col items-center gap-4 w-full">
          <p className="text-green-600 font-medium tracking-wide">Connected</p>
          <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-full text-center">
            <p className="font-mono text-sm break-all select-all">{address}</p>
          </div>
          <Button onClick={handleDisconnect} variant="outline" className="w-full">
            Disconnect
          </Button>
        </div>
      ) : (
        <Button onClick={handleConnect} className="w-full p-6 text-lg">
          Connect Stellar Wallet
        </Button>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-4">{error}</p>
      )}
    </div>
  )
}
