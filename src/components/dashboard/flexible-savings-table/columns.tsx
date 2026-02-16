'use client'
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

export const flexibleColumns: ColumnDef<FlexibleCampaign>[] = [
    { accessorKey: "campaignName", header: "Campaign Name" },
    { 
        accessorKey: "frequency", 
        header: "Frequency",
        cell: ({ row }) => {
            // Capitalize the first letter
            const freq = row.original.frequency;
            return freq.charAt(0).toUpperCase() + freq.slice(1);
        },
    },
    { 
        accessorKey: "startDate", 
        header: "Start Date",
        cell: ({ row }) => format(new Date(row.original.startDate), "dd MMM yyyy"), 
    },
    { accessorKey: "amountPerContribution", header: "Amount ($)" },
    { accessorKey: "totalAmount", header: "Total Target ($)" },
    { accessorKey: "amountSaved", header: "Saved So Far ($)" },
    { 
        accessorKey: "endDate", 
        header: "End Date",
        cell: ({ row }) => format(new Date(row.original.endDate), "dd MMM yyyy"), 
    },
];