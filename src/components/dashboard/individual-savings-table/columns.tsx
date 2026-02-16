'use client'
import { ColumnDef } from "@tanstack/react-table";
import {format} from "date-fns"

export const columns: ColumnDef<RegularCampaign>[] = [
  { accessorKey: "campaignName", header: "Campaign Name" },
  { accessorKey: "amountPerMonth", header: "Monthly Amount ($)" },
  { accessorKey: "totalAmount", header: "Total Target ($)" },
  { accessorKey: "amountSaved", header: "Saved So Far ($)" },
  { 
    accessorKey: "startDate", 
    header: "Start Date",
    cell: ({ row }) => format(new Date(row.original.startDate), "dd MMM yyyy"), 
  },
  { 
    accessorKey: "endDate", 
    header: "End Date",
    cell: ({ row }) => format(new Date(row.original.endDate), "dd MMM yyyy"), 
  },
];