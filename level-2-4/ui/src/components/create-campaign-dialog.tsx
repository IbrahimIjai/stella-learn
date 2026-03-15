import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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

export function CreateCampaignDialog({ currentAddress }: { currentAddress?: string }) {
  const [open, setOpen] = useState(false)
  const [tokenAddress, setTokenAddress] = useState("")
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!currentAddress) throw new Error("Wallet not connected")
      // Dummy token address validation (Stellar addresses start with G or C)
      if (!tokenAddress.startsWith("C")) {
        throw new Error("Invalid Soroban token address. Must start with 'C'.")
      }
      return await stellar.createCampaign(currentAddress, tokenAddress)
    },
    onSuccess: (txHash) => {
      toast.success("Campaign created successfully!", {
        description: `Tx Hash: ${txHash.slice(0, 10)}...`,
      })
      queryClient.invalidateQueries({ queryKey: ["campaigns"] })
      setOpen(false)
      setTokenAddress("")
    },
    onError: (error: any) => {
      toast.error("Failed to create campaign", {
        description: error.message,
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Create Campaign</Button>} />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tighter uppercase">Create Campaign</DialogTitle>
          <DialogDescription className="text-[11px] leading-relaxed">
            Deploy a new campaign on the Stellar testnet. You will be set as the admin.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-1.5">
            <Label htmlFor="token" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Token Address</Label>
            <Input
              id="token"
              placeholder="CDLZ..."
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="text-xs h-9"
            />
            <p className="text-[10px] text-muted-foreground/60 font-medium">
              The Soroban token contract ID used for funding.
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={createMutation.isPending}
            className="text-[11px] font-bold h-9"
          >
            Cancel
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !tokenAddress || !currentAddress}
            className="text-[11px] font-black uppercase tracking-wider h-9 px-6 bg-linear-to-r from-[#8B5CF6] to-[#06B6D4] hover:opacity-90"
          >
            {createMutation.isPending ? "Deploying..." : "Launch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
