import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

function makeEntity(table) {
  return {
    list: async () => (await supabase.from(table).select('*')).data,
    get: async (id) => (await supabase.from(table).select('*').eq('id', id).single()).data,
    create: async (data) => (await supabase.from(table).insert(data).select().single()).data,
    update: async (id, data) => (await supabase.from(table).update(data).eq('id', id).select().single()).data,
    delete: async (id) => (await supabase.from(table).delete().eq('id', id)),
  }
}

export const base44 = {
  entities: {
    AutoPaySchedule: makeEntity('auto_pay_schedule'),
  }
}
