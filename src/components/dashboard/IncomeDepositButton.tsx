'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IndianRupee, TrendingUp } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const IncomeDepositButton = () => {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Calculate split amounts
  const grossIncome = parseFloat(amount) || 0
  const walletAmount = grossIncome * 0.85
  const taxVaultAmount = grossIncome * 0.15

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (grossIncome <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/wallet/income', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: grossIncome }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process income')
      }

      toast.success('Income processed successfully! 💰', {
        description: `₹${walletAmount.toFixed(2)} added to wallet, ₹${taxVaultAmount.toFixed(2)} secured for taxes`,
      })

      // Dispatch custom event to trigger WalletHistory refresh
      window.dispatchEvent(new Event('wallet-updated'))

      setOpen(false)
      setAmount('')
      router.refresh()
    } catch (error: any) {
      toast.error('Failed to process income', {
        description: error.message || 'Please try again later',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">
          Record Income
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2 cursor-pointer">
              <TrendingUp className="h-4 w-4" />
              Just Got Paid 💰
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Record Your Income</DialogTitle>
                <DialogDescription>
                  Enter your gross income. We'll automatically set aside 15% for taxes.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Gross Income (INR)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-9"
                      step="0.01"
                      min="0"
                      max="10000000"
                      required
                    />
                  </div>
                </div>

                {grossIncome > 0 && (
                  <div className="rounded-lg bg-muted p-4 space-y-2">
                    <p className="text-sm font-medium">Split Breakdown:</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">85% to Wallet</span>
                      <span className="font-semibold text-green-600">
                        ₹{walletAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">15% to Tax Vault</span>
                      <span className="font-semibold text-orange-600">
                        ₹{taxVaultAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="default"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || grossIncome <= 0} className="cursor-pointer">
                  {isLoading ? 'Processing...' : 'Confirm'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default IncomeDepositButton
