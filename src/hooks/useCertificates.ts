import { useQuery } from '@tanstack/react-query'
import { listCertificateTemplates, listIssuedCertificates } from '@/api/admin-learning'

export function useCertificateTemplates() {
  return useQuery({
    queryKey: ['admin', 'learning', 'certificate-templates'],
    queryFn: () => listCertificateTemplates().then((r) => r.data.data),
  })
}

export function useIssuedCertificates() {
  return useQuery({
    queryKey: ['admin', 'learning', 'issued-certificates'],
    queryFn: () => listIssuedCertificates().then((r) => r.data.data),
  })
}
