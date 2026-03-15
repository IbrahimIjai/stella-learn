import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import WalletConnector from "@/components/wallet-connector"
import { CreateCampaignDialog } from "@/components/create-campaign-dialog"
import { stellar } from "@/lib/stellar-helper"
import { Logo } from "@/components/logo"

export const Route = createFileRoute("/")({ component: App })

function App() {
  const [address, setAddress] = useState<string | undefined>()

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const initAndListen = async () => {
      const { StellarWalletsKit } = await import("@creit-tech/stellar-wallets-kit/sdk");
      const { KitEventType } = await import("@creit-tech/stellar-wallets-kit/types");

      try {
        const addr = await stellar.getAddress();
        setAddress(addr);
      } catch (e) {
        // Not logged in
      }

      const unsubState = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event: any) => {
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
    }
  }, [])

  const { data: campaigns, isLoading, error } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => stellar.getAllCampaigns(),
  })

  // Format balance (stroops to whole units)
  const formatBalance = (bal: bigint) => (Number(bal) / 1e7).toFixed(2)
  const truncate = (str: string) => `${str.slice(0, 6)}...${str.slice(-4)}`

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between mx-auto px-4 md:px-8">
          <div className="flex items-center gap-3">
             <div className="relative group">
                <div className="absolute -inset-1 rounded-full bg-linear-to-r from-[#8B5CF6] to-[#06B6D4] opacity-40 blur transition group-hover:opacity-75"></div>
                <Logo className="h-9 w-9 relative bg-background rounded-full p-1" />
             </div>
             <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-[#8B5CF6] to-[#06B6D4] hover:from-[#06B6D4] hover:to-[#8B5CF6] transition-all duration-300">s-metadao</h1>
          </div>
          <WalletConnector />
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tighter mb-1 uppercase">Network Hub</h2>
            <p className="text-muted-foreground text-xs font-medium max-w-lg leading-relaxed">
              Powering the next generation of meta-governed DAOs and high-impact metadata on Stellar.
            </p>
          </div>
          {address && <CreateCampaignDialog currentAddress={address} />}
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            <h3 className="font-semibold">Error Loading Campaigns</h3>
            <p className="text-sm">{(error as Error).message}</p>
          </div>
        ) : campaigns?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed">
            <h3 className="text-xl font-medium">No campaigns found</h3>
            <p className="text-muted-foreground mt-2 mb-6">Be the first to create one!</p>
            {address ? (
              <CreateCampaignDialog currentAddress={address} />
            ) : (
              <p className="text-sm text-muted-foreground">Connect your wallet to create</p>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns?.map((camp) => (
              <Card key={camp.id} className="flex flex-col transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center text-sm font-black uppercase tracking-wider">
                    Campaign #{camp.id}
                  </CardTitle>
                  <CardDescription className="text-[10px] font-medium opacity-70">
                    Admin: <span className="font-mono">{truncate(camp.admin)}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    <div className="rounded-md bg-secondary/30 p-2.5">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Balance Collected</div>
                      <div className="text-xl font-black font-mono text-primary">
                        {formatBalance(camp.balance)} <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-normal">Tokens</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Token Address</div>
                      <div className="font-mono text-[10px] bg-muted/50 p-1.5 rounded truncate border border-border/50" title={camp.token}>
                        {camp.token}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link to="/campaign/$id" params={{ id: camp.id.toString() }} className="w-full">
                    <Button className="w-full text-[10px] font-black uppercase tracking-widest h-8" variant="default">
                      View Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
