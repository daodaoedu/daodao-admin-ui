import { useQuery } from '@tanstack/react-query'
import {
  getAutoModCommunityModConfig,
  getAutoModFlagQueue,
  getAutoModLog,
  getAutoModRules,
  getAutoModSpamDetection,
  getAutoModUsernameBlocklist,
  getAutoModWordLists,
} from '@/api/admin-trust'

export function useAutoModRules() {
  return useQuery({
    queryKey: ['admin', 'automod', 'rules'],
    queryFn: () => getAutoModRules().then((r) => r.data.data),
  })
}

export function useAutoModWordLists() {
  return useQuery({
    queryKey: ['admin', 'automod', 'word-lists'],
    queryFn: () => getAutoModWordLists().then((r) => r.data.data),
  })
}

export function useAutoModLog() {
  return useQuery({
    queryKey: ['admin', 'automod', 'log'],
    queryFn: () => getAutoModLog().then((r) => r.data.data),
  })
}

export function useAutoModSpamDetection() {
  return useQuery({
    queryKey: ['admin', 'automod', 'spam-detection'],
    queryFn: () => getAutoModSpamDetection().then((r) => r.data.data),
  })
}

export function useAutoModUsernameBlocklist() {
  return useQuery({
    queryKey: ['admin', 'automod', 'username-blocklist'],
    queryFn: () => getAutoModUsernameBlocklist().then((r) => r.data.data),
  })
}

export function useAutoModFlagQueue() {
  return useQuery({
    queryKey: ['admin', 'automod', 'flag-queue'],
    queryFn: () => getAutoModFlagQueue().then((r) => r.data.data),
  })
}

export function useAutoModCommunityModConfig() {
  return useQuery({
    queryKey: ['admin', 'automod', 'community-mod-config'],
    queryFn: () => getAutoModCommunityModConfig().then((r) => r.data.data),
  })
}
