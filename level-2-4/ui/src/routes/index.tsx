import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import type { KitEventStateUpdated } from "@creit-tech/stellar-wallets-kit/types"
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
                <div className="absolute -inset-1 rounded-full bg-primary opacity-40 blur transition group-hover:opacity-75"></div>
                <Logo className="h-9 w-9 relative bg-background rounded-full p-1" />
             </div>
             <h1 className="text-2xl font-black tracking-tighter text-primary transition-all duration-300">s-metadao</h1>
          </div>
          <WalletConnector />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-muted/30 py-12 md:py-20">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 md:px-8 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Stellar Testnet Live
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9] mb-6">
              The Future of <br className="hidden md:block" />
              <span className="text-primary">Meta-Governance</span> is Here.
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium max-w-lg mb-8 leading-relaxed">
              s-metadao is a decentralized foundry for metadata-driven crowdfunding and DAO governance on the Stellar Network. Secure, transparent, and built for high-impact scaling.
            </p>
            <div className="flex flex-wrap gap-3">
               {address ? (
                 <CreateCampaignDialog currentAddress={address} />
               ) : (
                 <Button onClick={async () => {
                    const { stellar } = await import("@/lib/stellar-helper");
                    await stellar.connectWallet();
                 }} size="lg" className="h-11 px-8 text-xs font-black uppercase tracking-widest">
                   Get Started
                 </Button>
               )}
               <Button variant="outline" size="lg" className="h-11 px-8 text-xs font-black uppercase tracking-widest">
                 Documentation
               </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Rolling Ticker */}
      <div className="w-full border-b bg-secondary/20 py-3 overflow-hidden whitespace-nowrap relative">
        <div className="flex animate-marquee gap-8 items-center">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-8 items-center">
              {campaigns && campaigns.length > 0 ? (
                campaigns.slice(0, 5).map((camp) => (
                  <div key={camp.id} className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Live Campaign:</span>
                    <span className="text-[11px] font-bold">{camp.name}</span>
                    <span className="text-[10px] font-mono opacity-50">{Math.round((Number(camp.total_raised) / Number(camp.target_amount)) * 100)}% Funded</span>
                    <div className="h-4 w-px bg-border mx-2" />
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Network Status:</span>
                  <span className="text-[11px] font-bold">Scanning for active metadata components on Stellar...</span>
                  <div className="h-4 w-[1px] bg-border mx-2" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl font-black tracking-tighter mb-1 uppercase">Active Hub</h2>
            <p className="text-muted-foreground text-[11px] font-medium max-w-lg leading-relaxed">
              Explore and contribute to meta-powered crowdfunding campaigns.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 px-3 rounded-md bg-secondary flex items-center gap-2 text-[10px] font-black uppercase tracking-tight text-secondary-foreground border">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {campaigns?.length || 0} Projects Online
            </div>
          </div>
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
                  <CardTitle className="flex justify-between items-center text-sm font-black uppercase tracking-wider truncate">
                    {camp.name || `Campaign #${camp.id}`}
                  </CardTitle>
                  <CardDescription className="text-[10px] font-medium opacity-70 line-clamp-1">
                    {camp.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    <div className="rounded-md bg-secondary/30 p-2.5">
                      <div className="flex justify-between items-end mb-1">
                        <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Progress</div>
                        <div className="text-[9px] font-bold text-primary">{Math.min(100, Math.round((Number(camp.total_raised) / Number(camp.target_amount)) * 100))}%</div>
                      </div>
                      <div className="text-xl font-black font-mono text-primary leading-none">
                        {formatBalance(camp.total_raised)} 
                        <span className="text-[9px] font-normal text-muted-foreground uppercase ml-1">/ {formatBalance(camp.target_amount)}</span>
                      </div>
                      <div className="mt-2 h-1 w-full bg-muted/50 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-primary transition-all" 
                           style={{ width: `${Math.min(100, (Number(camp.total_raised) / Number(camp.target_amount)) * 100)}%` }}
                         />
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-tighter text-muted-foreground/60">
                      <span>Admin: {truncate(camp.admin)}</span>
                      <span>ID: {camp.id}</span>
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
