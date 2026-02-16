'use client'

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusIcon } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'

interface Group {
    _id: string;
    groupName: string;
    description: string;
    groupType: string;
    admin: {
        _id: string;
        name: string;
    };
    maxGroupSize: number;
}

const ListAllGroupsComponent = ({ initialGroups }: { initialGroups: Group[] }) => {
    const searchParams = useSearchParams();
    const {replace} = useRouter();

    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [groupTypeFilter, setGroupTypeFilter] = useState(searchParams.get('type') || '');
    const [maxSizeFilter, setMaxSizeFilter] = useState(searchParams.get('size') || '');

    const handleFilterChange = useDebouncedCallback(() => {
        const params = new URLSearchParams(searchParams);
        
        if (searchTerm) params.set('q', searchTerm); else params.delete('q');
        if (groupTypeFilter) params.set('type', groupTypeFilter); else params.delete('type');
        if (maxSizeFilter) params.set('size', maxSizeFilter); else params.delete('size');
        
        replace(`/groups?${params.toString()}`);
    }, 300); 

    useEffect(() => {
        handleFilterChange();
    }, [searchTerm, groupTypeFilter, maxSizeFilter, handleFilterChange]);


    if(initialGroups.length === 0) {
        return (
            <div className="p-6 flex flex-col items-center justify-center space-y-4 min-h-[300px]">
                <div className="text-2xl font-bold text-muted-foreground">No groups available</div>
                <p className="text-muted-foreground">Check back later or create your own group</p>
                <Button asChild className='sm:w-auto text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white'>
                    <Link className='flex gap-2 items-center' href={'/create-group'}>Create Group <PlusIcon /></Link>
                </Button>
            </div>
        )
    }

  return (
    <div className="sm:px-8 px-4 mt-2 sm:mt-6">
        <div className='flex justify-between'>
            <h1 className="text-xl sm:text-2xl font-bold mb-6">Available Groups</h1>
            <Button asChild className='sm:w-auto text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white'>
                <Link className='flex gap-2 items-center' href={'/create-group'}>Create Group <PlusIcon /></Link>
            </Button>
        </div>
            
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by name or description"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                </div>

                <select
                    value={groupTypeFilter}
                    onChange={e => setGroupTypeFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Types</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                </select>

                <input
                    type="number"
                    placeholder="Max group size"
                    value={maxSizeFilter ?? ''}
                    onChange={e => setMaxSizeFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                />
            </div>

            {initialGroups.length === 0 ? (
                <div className="bg-gray-50 p-8 rounded-lg text-center">
                    <p className="text-gray-500">No groups match your search criteria</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {initialGroups.map((group) => (
                        <Card key={group._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                            <CardHeader className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                <CardTitle className="text-lg font-semibold text-gray-800">{group.groupName}</CardTitle>
                                <div className="flex gap-2 mt-1">
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        group.groupType === 'public' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-purple-100 text-purple-800'
                                    }`}>
                                        {group.groupType}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                        Max {group.maxGroupSize}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <p className="text-sm text-gray-600 mb-3">
                                    {(group.description.slice(0, 100) + '...') || "No description provided"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    <span className="font-medium">Admin:</span> {group.admin?.name || "Unknown"}
                                </p>
                            </CardContent>
                            <div className="px-4 pb-4">
                                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                    <Link href={`/groups/${group._id}`}>
                                        View Details
                                    </Link>
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
  )
}

export default ListAllGroupsComponent
