'use client'

import { useState } from "react";
import GroupSidebarComponent from "./GroupSidebarComponent";
import GroupHeaderComponent from "./GroupHeaderComponent";
import GroupMainSectionComponent from "./GroupMainSectionComponent";


const GroupDetailsComponent = ({ initialData }: { initialData: GroupPageData }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <GroupSidebarComponent 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        data={initialData}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <GroupHeaderComponent 
          data={initialData} 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <GroupMainSectionComponent data={initialData} />
      </div>
    </div>
  )
}

export default GroupDetailsComponent
