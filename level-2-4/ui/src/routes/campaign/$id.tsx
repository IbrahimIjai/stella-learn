import { createFileRoute } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import WalletConnector from "@/components/wallet-connector"
import { stellar } from "@/lib/stellar-helper"
import { Logo } from "@/components/logo"

export const Route = createFileRoute("/campaign/$id")({
  component: CampaignDetail,
})

function CampaignDetail() {
  const { id } = Route.useParams()
  const campaignId = parseInt(id)
  
  const [address, setAddress] = useState<string | undefined>()
  const [amount, setAmount] = useState("")

  const queryClient = useQueryClient()

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

  const { data: campaign, isLoading, error } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () => stellar.getCampaign(campaignId),
    refetchInterval: 10000, // Refresh every 10 seconds
  })

  const depositMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Wallet not connected")
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        throw new Error("Invalid amount")
      }
      return await stellar.deposit(address, campaignId, amount)
    },
    onSuccess: (txHash) => {
      toast.success("Deposit successful!", {
        description: `Tx Hash: ${txHash.slice(0, 10)}...`,
      })
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] })
      setAmount("")
    },
    onError: (error: any) => {
      toast.error("Deposit failed", { description: error.message })
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Wallet not connected")
      // Admins withdraw to themselves in this simple UI
      return await stellar.withdraw(address, campaignId, address)
    },
    onSuccess: (txHash) => {
      toast.success("Withdrawal successful!", {
        description: `Tx Hash: ${txHash.slice(0, 10)}...`,
      })
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] })
    },
    onError: (error: any) => {
      toast.error("Withdrawal failed", { description: error.message })
    },
  })

  const formatBalance = (bal: bigint) => (Number(bal) / 1e7).toFixed(2)

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background p-8">
        <div className="animate-pulse flex flex-col gap-4 max-w-2xl mx-auto w-full">
          <div className="h-10 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded w-full mt-4"></div>
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <h2 className="text-2xl font-bold text-destructive">Campaign Not Found</h2>
        <p className="text-muted-foreground mt-2">The campaign you are looking for does not exist.</p>
        <Button className="mt-6" variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  const isAdmin = address === campaign.admin

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between mx-auto px-4 md:px-8">
          <div className="flex items-center gap-4">
             <button 
               onClick={() => window.history.back()} 
               className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-muted"
               aria-label="Go back"
             >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
             </button>
             <div className="flex items-center gap-2.5 border-l border-border/50 pl-3.5">
                <Logo className="h-5 w-5" />
                <span className="text-[12px] font-black tracking-tighter uppercase bg-clip-text text-transparent bg-linear-to-r from-[#8B5CF6] to-[#06B6D4]">s-metadao</span>
             </div>
          </div>
          <WalletConnector />
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 md:px-8 py-8 md:py-12 flex justify-center">
        <Card className="w-full max-w-3xl border-2 shadow-sm">
          <CardHeader className="bg-secondary/10 pb-6">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-black tracking-tighter mb-1 uppercase">
                  Campaign #{campaign.id}
                </CardTitle>
                <CardDescription className="text-[11px] font-medium tracking-tight">
                  Transparent, decentralized fundraising on Soroban.
                </CardDescription>
              </div>
              {isAdmin && (
                <Badge variant="default" className="text-[9px] uppercase font-black px-2 py-0.5 tracking-widest leading-none">
                  Admin
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-8 grid gap-8">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 p-5 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  Total Raised
                </span>
                <span className="text-4xl font-mono font-black text-primary tracking-tighter">
                  {formatBalance(campaign.balance)}
                </span>
                <span className="text-[10px] text-muted-foreground/70 font-medium">
                   Current contract liquidity
                </span>
              </div>
              
              <div className="flex flex-col gap-3 p-5 rounded-lg border bg-muted/20">
                <div>
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Admin Address</span>
                  <div className="font-mono text-[10px] break-all mt-1 font-bold text-foreground/80">{campaign.admin}</div>
                </div>
                <Separator className="opacity-50" />
                <div>
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Accepted Token</span>
                  <div className="font-mono text-[10px] break-all mt-1">{campaign.token}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Actions Section */}
            <div className="grid gap-8 md:grid-cols-2">
              {/* Deposit Form */}
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-xl font-bold">Fund this Campaign</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Deposit tokens directly to the contract. All funds are secured by Soroban.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Deposit Amount</Label>
                  <div className="flex gap-2">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Amount to send..."
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="0"
                      step="any"
                    />
                    <Button 
                      onClick={() => depositMutation.mutate()} 
                      disabled={depositMutation.isPending || !amount || !address}
                      className="whitespace-nowrap w-24 text-[10px] font-black uppercase tracking-wider h-8 bg-linear-to-r from-[#8B5CF6] to-[#06B6D4]"
                    >
                      {depositMutation.isPending ? "..." : "Deposit"}
                    </Button>
                  </div>
                </div>
                {!address && (
                  <p className="text-sm text-destructive font-medium">Connect your wallet to deposit.</p>
                )}
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div className="flex flex-col gap-4 pl-0 md:pl-8 md:border-l">
                  <div>
                    <h3 className="text-xl font-bold">Admin Actions</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage the funds for this campaign.
                    </p>
                  </div>
                  <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5 space-y-4 mt-2">
                    <div>
                      <h4 className="font-medium text-destructive">Withdraw All Funds</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Transfers {formatBalance(campaign.balance)} tokens to your wallet.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full text-[10px] font-black uppercase tracking-widest h-8"
                      onClick={() => withdrawMutation.mutate()}
                      disabled={withdrawMutation.isPending || campaign.balance === BigInt(0)}
                    >
                      {withdrawMutation.isPending ? "..." : "Withdraw Funds"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
