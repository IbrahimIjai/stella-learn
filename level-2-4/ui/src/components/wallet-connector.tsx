import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { stellar } from "@/lib/stellar-helper";
import type { KitEventStateUpdated } from "@creit-tech/stellar-wallets-kit/types";

export default function WalletConnector() {
  const [address, setAddress] = useState<string | undefined>();

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    
    const initAndListen = async () => {
      const { StellarWalletsKit } = await import("@creit-tech/stellar-wallets-kit/sdk");
      const { KitEventType } = await import("@creit-tech/stellar-wallets-kit/types");
      
      await stellar.getAddress().catch(() => {}); // Check if already connected without forcing modal
      
      const unsubState = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event: KitEventStateUpdated) => {
        setAddress(event.payload.address);
      });

      const unsubDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
        setAddress(undefined);
      });

      unsubs.push(unsubState, unsubDisconnect);
    };

    initAndListen();

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  async function handleClick() {
    const { StellarWalletsKit } = await import("@creit-tech/stellar-wallets-kit/sdk");
    
    if (address) {
      await StellarWalletsKit.profileModal();
    } else {
      try {
        const addr = await stellar.connectWallet();
        setAddress(addr);
      } catch {
        // User closed the modal, do nothing
      }
    }
  }

  const label = address
    ? `${address.slice(0, 4)}....${address.slice(-6)}`
    : "Connect Wallet";

  return (
    <Button onClick={handleClick} variant="outline" size="sm" className="text-[12px] font-bold tracking-tight px-3 h-8">
      {label}
    </Button>
  );
}