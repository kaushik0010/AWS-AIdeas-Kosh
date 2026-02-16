'use client'

import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import {format} from "date-fns"
import { ArrowUpDown } from "lucide-react";

export const walletTopUpColumns: ColumnDef<WalletTopUp>[] = [
    { 
        accessorKey: "amount", 
        header: ({ column }) => {
        return (
            <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
            Top-up Amount ($)
            <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        )
        }, 
    },
    { accessorKey: "status", header: "Status" },
    {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => format(new Date(row.original.date), "dd MMM yyyy"),
    },
];
