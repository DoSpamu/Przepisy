export const SUPABASE_URL = 'https://fjhbnqbkdpgspucvanhq.supabase.co'
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqaGJucWJrZHBnc3B1Y3ZhbmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NDE2ODgsImV4cCI6MjA4OTMxNzY4OH0.VylvExUM5BH59FzcXLQlZ7DKRmCbJX1AQs_AqPa3hFQ'

export const YT_CHANNELS = [
  { handle: 'thefoodini',     label: 'thefoodini' },
  { handle: 'KochamGotowac',  label: 'Kocham Gotować' },
  { handle: 'mrgiboneg',      label: 'Mrgiboneg' },
  { handle: 'OddaszFartucha', label: 'Strzelczyk' },
]

export const ALL_CATS = [
  '🐔 Kurczak', '🥩 Schab', '🥩 Karkówka', '🐄 Wołowina',
  '🌭 Kiełbasa', '🐟 Ryba', '🥘 Wariacje', '🥗 Sałatki', '🥖 Pieczywo',
]

export const catColors: Record<string, string> = {
  '🐔 Kurczak': '#fef3c7', '🥩 Schab': '#fce7f3', '🥩 Karkówka': '#ffe4e6',
  '🐄 Wołowina': '#fee2e2', '🌭 Kiełbasa': '#fef9c3', '🐟 Ryba': '#dbeafe',
  '🥘 Wariacje': '#d1fae5', '🥗 Sałatki': '#ecfdf5', '🥖 Pieczywo': '#fffbeb',
}

export const catBorder: Record<string, string> = {
  '🐔 Kurczak': '#f59e0b', '🥩 Schab': '#ec4899', '🥩 Karkówka': '#f43f5e',
  '🐄 Wołowina': '#ef4444', '🌭 Kiełbasa': '#eab308', '🐟 Ryba': '#3b82f6',
  '🥘 Wariacje': '#10b981', '🥗 Sałatki': '#059669', '🥖 Pieczywo': '#d97706',
}

export const catEmoji: Record<string, string> = {
  '🐔 Kurczak': '🐔', '🥩 Schab': '🥩', '🥩 Karkówka': '🥩',
  '🐄 Wołowina': '🐄', '🌭 Kiełbasa': '🌭', '🐟 Ryba': '🐟',
  '🥘 Wariacje': '🥘', '🥗 Sałatki': '🥗', '🥖 Pieczywo': '🥖',
}

export const STORAGE_IMG_KEY  = 'img_chosen_v5'
export const STORAGE_CHAN_KEY = 'yt_channel_cache_v1'
export const STORAGE_ADM_KEY  = 'admin_r_v1'
