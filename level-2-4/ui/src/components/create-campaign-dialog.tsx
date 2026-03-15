import { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { stellar } from "@/lib/stellar-helper"
import { cn } from "@/lib/utils"

const DEFAULT_META_TOKEN = "CCELBQQHO3TMNSYOGO6CIRQML7J2SMJLTWFKISNUHIBIAESGL5KTWO76"

export function CreateCampaignDialog({ currentAddress }: { currentAddress?: string }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [useDefaultToken, setUseDefaultToken] = useState(true)
  const [tokenAddress, setTokenAddress] = useState(DEFAULT_META_TOKEN)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [txHash, setTxHash] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { status: confirmStatus } = useQuery({
    queryKey: ["tx", txHash],
    queryFn: () => stellar.pollTransaction(txHash!),
    enabled: !!txHash,
    gcTime: 0,
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (confirmStatus === 'success' && txHash) {
      toast.success("Campaign deployed!", {
        id: "create-campaign",
        description: "Your campaign is now live on Stellar.",
      })
      queryClient.invalidateQueries({ queryKey: ["campaigns"] })
      handleClose()
    } else if (confirmStatus === 'error') {
      toast.error("Deployment failed", {
        id: "create-campaign",
        description: "Transaction failed during confirmation.",
      })
      setTxHash(null)
    }
  }, [confirmStatus, txHash, queryClient])

  const handleClose = () => {
    setOpen(false)
    setStep(1)
    setTxHash(null)
    setTokenAddress(DEFAULT_META_TOKEN)
    setUseDefaultToken(true)
    setName("")
    setDescription("")
    setTargetAmount("")
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!currentAddress) throw new Error("Wallet not connected")
      const finalToken = useDefaultToken ? DEFAULT_META_TOKEN : tokenAddress
      if (!finalToken.startsWith("C")) {
        throw new Error("Invalid Soroban token address. Must start with 'C'.")
      }
      if (!name || !description || !targetAmount) {
        throw new Error("Please fill in all fields")
      }
      return await stellar.createCampaign(currentAddress, finalToken, name, description, targetAmount)
    },
    onMutate: () => {
      toast.loading("Deploying campaign module...", { id: "create-campaign" })
    },
    onSuccess: (hash: string) => {
      setTxHash(hash)
      toast.loading("Confirming transaction...", { 
        id: "create-campaign",
        description: `Hash: ${hash.slice(0, 10)}...`
      })
    },
    onError: (error: unknown) => {
      toast.error("Submission failed", {
        id: "create-campaign",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    },
  })

  const isPending = createMutation.isPending || (confirmStatus === 'pending' && !!txHash);

  const nextStep = () => {
    if (name && description && targetAmount) {
      setStep(2)
    } else {
      toast.error("Please fill in all info first")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger render={<Button>Create Campaign</Button>} />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
             <div className={cn("h-1 flex-1 rounded-full", step >= 1 ? "bg-primary" : "bg-muted")} />
             <div className={cn("h-1 flex-1 rounded-full", step >= 2 ? "bg-primary" : "bg-muted")} />
          </div>
          <DialogTitle className="text-lg font-black tracking-tighter uppercase">
            {step === 1 ? "Campaign Info" : "Token Selection"}
          </DialogTitle>
          <DialogDescription className="text-[11px] leading-relaxed">
            {step === 1 
              ? "Tell us about your project and how much you need to raise." 
              : "Choose the token you want to accept for funding."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 1 ? (
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="name" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Project Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Save the Stars"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="description" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Description</Label>
                <Input
                  id="description"
                  placeholder="What is this project about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="target" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Target Raise (Tokens)</Label>
                <Input
                  id="target"
                  type="number"
                  placeholder="e.g. 5000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-2">
                 <button
                   onClick={() => { setUseDefaultToken(true); setTokenAddress(DEFAULT_META_TOKEN); }}
                   className={cn(
                     "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all gap-2",
                     useDefaultToken ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                   )}
                 >
                    <div className={cn("h-3 w-3 rounded-full border-2", useDefaultToken ? "border-primary bg-primary" : "border-muted-foreground")} />
                    <span className="text-[10px] font-black uppercase tracking-tight">Meta Token</span>
                    <span className="text-[9px] text-muted-foreground font-medium">Platform Default</span>
                 </button>
                 <button
                   onClick={() => setUseDefaultToken(false)}
                   className={cn(
                     "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all gap-2",
                     !useDefaultToken ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                   )}
                 >
                    <div className={cn("h-3 w-3 rounded-full border-2", !useDefaultToken ? "border-primary bg-primary" : "border-muted-foreground")} />
                    <span className="text-[10px] font-black uppercase tracking-tight">Custom Token</span>
                    <span className="text-[9px] text-muted-foreground font-medium">Specify Address</span>
                 </button>
              </div>

              {!useDefaultToken && (
                <div className="grid gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label htmlFor="token" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Token Address</Label>
                  <Input
                    id="token"
                    placeholder="CDLZ..."
                    value={tokenAddress === DEFAULT_META_TOKEN ? "" : tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    className="text-xs h-9"
                  />
                  <p className="text-[10px] text-muted-foreground/60 font-medium">
                    The Soroban token contract ID used for funding.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step === 1 ? (
            <Button
              className="text-[11px] font-black uppercase tracking-wider h-9 px-6 bg-primary text-primary-foreground hover:opacity-90 w-full"
              onClick={nextStep}
            >
              Next Step
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                disabled={isPending}
                className="text-[11px] font-bold h-9"
              >
                Back
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={isPending || (!useDefaultToken && !tokenAddress) || !currentAddress}
                className="text-[11px] font-black uppercase tracking-wider h-9 px-6 bg-primary text-primary-foreground hover:opacity-90 flex-1"
              >
                {isPending ? "Deploying..." : "Launch Campaign"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
