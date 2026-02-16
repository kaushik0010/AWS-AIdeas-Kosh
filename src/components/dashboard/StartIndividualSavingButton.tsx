import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

const StartIndividualSavingButton = () => {

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">
          Start New Savings Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full gap-2 cursor-pointer">
          <Link href={'/individual/start'}>
            <PlusCircle className="h-4 w-4" />
            Start Now
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default StartIndividualSavingButton
