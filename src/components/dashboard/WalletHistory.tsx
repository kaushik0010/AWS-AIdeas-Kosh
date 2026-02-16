'use client'

import { useEffect, useRef, useState } from "react"
import { walletTopUpColumns } from "./wallet-topup-table/columns"
import axios from "axios";
import { DataTable } from "./individual-savings-table/data-table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PAGE_LIMIT = 5;

const WalletHistory = ({ initialTopups, initialTotalPages }: WalletHistoryProps) => {
  const [topups, setTopups] = useState<WalletTopUp[]>(initialTopups);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);

  const isInitialRender = useRef(true);

  const fetchTopups = async (page=1) => {
    try {
      setLoading(true)
      const res = await axios.get(`/api/wallet/topups?page=${page}&limit=${PAGE_LIMIT}`);
      setTopups(res.data.topups || []);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Failed to fetch wallet top-ups", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if(isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    fetchTopups(currentPage)
  }, [currentPage]);


  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">
          Wallet Top-Up History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topups.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No top-up history found</p>
        ) : (
          <>
            <div className="rounded-md border">
              <DataTable columns={walletTopUpColumns} data={topups} />
            </div>
            <div className="flex items-center justify-end space-x-2 mt-4">
              <Button
                className="cursor-pointer"
                variant="default"
                size="sm"
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                className="cursor-pointer"
                variant="default"
                size="sm"
                disabled={currentPage === totalPages || loading}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default WalletHistory
