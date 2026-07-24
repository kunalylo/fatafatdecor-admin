'use client'

// Trending Decorations — the "Near you / Trending Decorations" rail shown on
// the app + website Home. Images/titles are fully admin-editable here via the
// shared CatalogSection over admin/catalog/trending.
import { CatalogSection } from '../components/CatalogKit'
import { TrendingUp, ImageIcon } from 'lucide-react'

const thumb = (src) => (
  <div className="w-full h-28 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 mb-3 flex items-center justify-center">
    {src
      ? <img src={src} alt="" className="w-full h-full object-cover" />
      : <ImageIcon className="w-5 h-5 text-gray-300" />}
  </div>
)

export default function AdminTrending() {
  return (
    <div className="space-y-8">
      <CatalogSection
        collection="trending"
        title="Trending Decorations"
        subtitle="The 'Near you' rail on the app & website Home. Drag order via Sort order."
        icon={TrendingUp}
        addLabel="Add Trending Card"
        uploadFolder="/content/trending"
        fields={[
          { key: 'image',    label: 'Image', type: 'image', required: true },
          { key: 'title',    label: 'Title', type: 'text', required: true, placeholder: 'Elegant Birthday Celebration' },
          { key: 'category', label: 'Category label', type: 'text', placeholder: 'Birthday Decor' },
          { key: 'occasion', label: 'Opens which occasion on tap', type: 'text', placeholder: 'birthday · anniversary · baby_shower · housewarming · festival' },
          { key: 'booked',   label: 'Booked recently (count)', type: 'number', default: 0 },
          { key: 'accent',   label: 'Accent colour', type: 'accent' },
          { key: 'sortOrder', label: 'Sort order', type: 'number', default: 0 },
        ]}
        card={(d) => (
          <>
            {thumb(d.image)}
            <p className="text-[10px] font-bold tracking-wide uppercase text-pink-500">{d.category || '—'}</p>
            <h4 className="font-bold text-gray-800 text-sm truncate">{d.title}</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">{d.booked || 0} booked recently</p>
          </>
        )}
      />
    </div>
  )
}
