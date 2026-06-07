'use client'

import { useState } from 'react'
import { Package, Image as ImageIcon } from 'lucide-react'
import InventoryItemsTab from './InventoryItemsTab'
import ReferenceDesignsTab from './ReferenceDesignsTab'

export default function InventoryScreen() {
  const [tab, setTab] = useState('items')  // 'items' | 'references'

  return (
    <div className="h-full flex flex-col">
      {/* Tab Switcher */}
      <div className="glass-overlay border-b border-white/40 px-6">
        <div className="flex gap-1">
          <button
            onClick={() => setTab('items')}
            className={`
              flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all
              ${tab === 'items'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'}
            `}
          >
            <Package className="w-4 h-4" />
            All Items
          </button>
          <button
            onClick={() => setTab('references')}
            className={`
              flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all
              ${tab === 'references'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'}
            `}
          >
            <ImageIcon className="w-4 h-4" />
            Reference Designs
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {tab === 'items'      && <InventoryItemsTab />}
        {tab === 'references' && <ReferenceDesignsTab />}
      </div>
    </div>
  )
}
