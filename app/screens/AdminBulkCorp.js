'use client'

// ── Bulk & Corporate editor ──────────────────────────────────────────
// Inner tabs: Bulk (occasions / themes / pricing tiers / hampers) and
// Corporate (packages / hampers / add-ons). All sections are full CRUD
// over admin/catalog/:collection via the shared CatalogSection.

import { useState } from 'react'
import { CatalogSection } from '../components/CatalogKit'
import {
  Boxes, Building2, Cake, Tag, BadgePercent, Package, Briefcase, Puzzle, ImageIcon,
} from 'lucide-react'

const thumb = (src, dim = 'w-full h-24') => (
  <div className={`${dim} rounded-xl overflow-hidden bg-gray-50 border border-gray-100 mb-3 flex items-center justify-center`}>
    {src
      ? <img src={src} alt="" className="w-full h-full object-cover" />
      : <ImageIcon className="w-5 h-5 text-gray-300" />}
  </div>
)

const inr = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`

function BulkTab() {
  return (
    <div className="space-y-8">
      <CatalogSection
        collection="bulk_occasions"
        title="Bulk Occasions"
        subtitle="Occasion cards on the Bulk page"
        icon={Cake}
        addLabel="Add Occasion"
        uploadFolder="/content/bulk"
        fields={[
          { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Birthday Return Gifts' },
          { key: 'desc', label: 'Description', type: 'text', placeholder: 'For 10–100 guests' },
          { key: 'icon', label: 'Icon (lucide name)', type: 'text', placeholder: 'Cake' },
          { key: 'accent', label: 'Accent', type: 'accent', default: 'accent-peach' },
          { key: 'image', label: 'Image', type: 'image' },
        ]}
        card={(d) => (
          <div>
            {thumb(d.image)}
            <h4 className="font-bold text-gray-800 text-sm leading-tight truncate">{d.name}</h4>
            <p className="text-xs text-gray-400 truncate">{d.desc || '—'}{d.icon ? ` · ${d.icon}` : ''}</p>
          </div>
        )}
      />

      <CatalogSection
        collection="bulk_themes"
        title="Bulk Themes"
        subtitle="Theme chips in the quote request"
        icon={Tag}
        addLabel="Add Theme"
        grid="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4"
        fields={[
          { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Pastel' },
        ]}
        card={(d) => (
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-pink-400 shrink-0" />
            <h4 className="font-bold text-gray-800 text-sm truncate">{d.name}</h4>
          </div>
        )}
      />

      <CatalogSection
        collection="bulk_tiers"
        title="Pricing Tiers"
        subtitle="Quantity bands and per-unit price"
        icon={BadgePercent}
        addLabel="Add Tier"
        fields={[
          { key: 'qty', label: 'Quantity Band', type: 'text', required: true, placeholder: '25–49' },
          { key: 'label', label: 'Tier Label', type: 'text', placeholder: 'Growth' },
          { key: 'perUnit', label: 'Per Unit (₹)', type: 'number', placeholder: '999' },
          { key: 'save', label: 'Save (%)', type: 'number', placeholder: '17' },
        ]}
        card={(d) => (
          <div>
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-gray-800 text-sm truncate">{d.label || d.qty}</h4>
              {Number(d.save) > 0 && (
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">Save {d.save}%</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{d.qty} units</p>
            <p className="text-sm font-bold text-gray-800 mt-1">{inr(d.perUnit)} <span className="text-xs font-normal text-gray-400">/ unit</span></p>
          </div>
        )}
      />

      <CatalogSection
        collection="bulk_hampers"
        title="Bulk Hampers"
        subtitle="Curated hampers on the Bulk page"
        icon={Package}
        addLabel="Add Hamper"
        uploadFolder="/content/bulk"
        fields={[
          { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Wellness Curated Box' },
          { key: 'perUnit', label: 'Per Unit (₹)', type: 'number', placeholder: '999' },
          { key: 'category', label: 'Category', type: 'text', placeholder: 'Wellness' },
          { key: 'contents', label: 'Contents (comma separated)', type: 'list', placeholder: 'Organic tea, Dark chocolate, Journal' },
          { key: 'image', label: 'Image', type: 'image' },
        ]}
        card={(d) => (
          <div>
            {thumb(d.image)}
            <h4 className="font-bold text-gray-800 text-sm leading-tight truncate">{d.name}</h4>
            <p className="text-xs text-gray-400 truncate">
              {d.category || '—'} · {(d.contents || []).length} items
            </p>
            <p className="text-sm font-bold text-gray-800 mt-1">{inr(d.perUnit)} <span className="text-xs font-normal text-gray-400">/ unit</span></p>
          </div>
        )}
      />
    </div>
  )
}

function CorporateTab() {
  return (
    <div className="space-y-8">
      <CatalogSection
        collection="corporate_packages"
        title="Corporate Packages"
        subtitle="Budget bands on the Corporate desk"
        icon={Briefcase}
        addLabel="Add Package"
        fields={[
          { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Premium Corporate Box' },
          { key: 'range', label: 'Price Range', type: 'text', placeholder: '₹1,000–₹1,999' },
          { key: 'desc', label: 'Description', type: 'text', placeholder: 'For client appreciation' },
          { key: 'accent', label: 'Accent', type: 'accent', default: 'accent-mint' },
          { key: 'popular', label: 'Mark as Popular', type: 'check' },
        ]}
        card={(d) => (
          <div>
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-gray-800 text-sm leading-tight truncate">{d.name}</h4>
              {d.popular && (
                <span className="bg-pink-100 text-pink-600 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">POPULAR</span>
              )}
            </div>
            <p className="text-sm font-bold text-gray-800 mt-1">{d.range || '—'}</p>
            <p className="text-xs text-gray-400 truncate">{d.desc || ''}</p>
          </div>
        )}
      />

      <CatalogSection
        collection="corporate_hampers"
        title="Corporate Hampers"
        subtitle="Ready hampers on the Corporate desk"
        icon={Package}
        addLabel="Add Hamper"
        uploadFolder="/content/corporate"
        fields={[
          { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Onboarding Welcome Kit' },
          { key: 'perUnit', label: 'Per Unit (₹)', type: 'number', placeholder: '1299' },
          { key: 'use', label: 'Best For', type: 'text', placeholder: 'New hires' },
          { key: 'contents', label: 'Contents (comma separated)', type: 'list', placeholder: 'Branded notebook, Premium pen, Bottle' },
          { key: 'image', label: 'Image', type: 'image' },
        ]}
        card={(d) => (
          <div>
            {thumb(d.image)}
            <h4 className="font-bold text-gray-800 text-sm leading-tight truncate">{d.name}</h4>
            <p className="text-xs text-gray-400 truncate">
              {d.use || '—'} · {(d.contents || []).length} items
            </p>
            <p className="text-sm font-bold text-gray-800 mt-1">{inr(d.perUnit)} <span className="text-xs font-normal text-gray-400">/ unit</span></p>
          </div>
        )}
      />

      <CatalogSection
        collection="corporate_addons"
        title="Corporate Add-ons"
        subtitle="Extras in the corporate quote"
        icon={Puzzle}
        addLabel="Add Add-on"
        fields={[
          { key: 'label', label: 'Label', type: 'text', required: true, placeholder: 'Co-branded packaging' },
          { key: 'price', label: 'Price (₹)', type: 'number', placeholder: '49' },
          { key: 'free', label: 'Included Free', type: 'check' },
        ]}
        card={(d) => (
          <div>
            <h4 className="font-bold text-gray-800 text-sm leading-tight truncate">{d.label}</h4>
            <p className="text-sm font-bold mt-1">
              {d.free
                ? <span className="text-green-600">Free</span>
                : <span className="text-gray-800">{inr(d.price)}</span>}
            </p>
          </div>
        )}
      />
    </div>
  )
}

export default function AdminBulkCorp() {
  const [tab, setTab] = useState('bulk')

  return (
    <div className="p-6 space-y-6">
      {/* Tab Switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('bulk')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'bulk' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2"><Boxes className="w-4 h-4" /> Bulk</span>
        </button>
        <button
          onClick={() => setTab('corporate')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'corporate' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Corporate</span>
        </button>
      </div>

      {tab === 'bulk' ? <BulkTab /> : <CorporateTab />}
    </div>
  )
}
