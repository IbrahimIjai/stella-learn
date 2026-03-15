import { useEffect, useState } from "react";
import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";
import {
  SwkAppDarkTheme,
  KitEventType,
} from "@creit-tech/stellar-wallets-kit/types";
import { defaultModules } from "@creit-tech/stellar-wallets-kit/modules/utils";
import { Button } from "@/components/ui/button";

// Initialize the kit once (module-level, runs in browser only)
let kitInitialized = false;
function ensureKitInit() {
  if (kitInitialized) return;
  StellarWalletsKit.init({
    theme: SwkAppDarkTheme,
    modules: defaultModules(),
  });
  kitInitialized = true;
}

export default function WalletConnector() {
  const [address, setAddress] = useState<string | undefined>();

  useEffect(() => {
    ensureKitInit();

    // Listen for state updates (wallet connected, address changed, etc.)
    const unsubState = StellarWalletsKit.on(
      KitEventType.STATE_UPDATED,
      (event) => {
        setAddress(event.payload.address);
      }
    );

    // Listen for disconnect events
    const unsubDisconnect = StellarWalletsKit.on(
      KitEventType.DISCONNECT,
      () => {
        setAddress(undefined);
      }
    );

    return () => {
      unsubState();
      unsubDisconnect();
    };
  }, []);

  async function handleClick() {
    ensureKitInit();

    if (address) {
      // User is already connected — show the profile modal
      await StellarWalletsKit.profileModal();
    } else {
      // User is not connected — show the auth/connect modal
      try {
        const { address: newAddress } = await StellarWalletsKit.authModal();
        setAddress(newAddress);
      } catch {
        // User closed the modal, do nothing
      }
    }
  }

  const label = address
    ? `${address.slice(0, 4)}....${address.slice(-6)}`
    : "Connect Wallet";

  return (
    <Button onClick={handleClick} variant="outline" size="lg">
      {label}
    </Button>
  );
}