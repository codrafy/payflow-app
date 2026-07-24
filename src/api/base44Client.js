import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseKey)

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
    ExtraJob: makeEntity('extra_job'),
    Job: makeEntity('job'),
    Payment: makeEntity('payment'),
    WeeklyPay: makeEntity('weekly_pay'),
  },
  auth: {
    me: async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data?.user) throw new Error('Not authenticated')
      return data.user
    },
    logout: async () => {
      await supabase.auth.signOut()
    },
    updateMe: async (fields) => {
      const { data, error } = await supabase.auth.updateUser({ data: fields })
      if (error) throw error
      return data.user
    },
    signInWithPassword: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return data.user
    },
    signUpWithPassword: async (email, password) => {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      return data.user
    },
    signInWithGoogle: async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (error) throw error
    },
  }
}
