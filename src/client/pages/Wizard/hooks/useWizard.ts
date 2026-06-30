import { create } from 'zustand'
import type {
  WizardStage,
  KBCredential,
  KBInfo,
  TreeNode,
  ProductItem,
  DiagnoseResult,
} from '../../../services/wizard'

interface WizardState {
  wizardId: string | null
  stage: WizardStage
  credential: KBCredential | null
  kbInfo: KBInfo | null
  tree: TreeNode[]
  docCount: number
  summary: string
  products: ProductItem[]
  loading: boolean
  error: string | null
  jobId: string | null
  jobStatus: 'pending' | 'running' | 'completed' | 'failed' | 'done' | 'error' | null
  setWizardId: (id: string | null) => void
  setStage: (stage: WizardStage) => void
  setCredential: (credential: KBCredential | null) => void
  setCredentialFields: (kbId: string, kbName: string, accessToken: string) => void
  setKbInfo: (info: KBInfo | null) => void
  setDiagnoseResult: (result: DiagnoseResult) => void
  setProducts: (products: ProductItem[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setJobId: (jobId: string | null) => void
  setJobStatus: (status: WizardState['jobStatus']) => void
  reset: () => void
}

const initialState = {
  wizardId: null,
  stage: 'init' as WizardStage,
  credential: null,
  kbInfo: null,
  tree: [],
  docCount: 0,
  summary: '',
  products: [],
  loading: false,
  error: null,
  jobId: null,
  jobStatus: null,
}

export const useWizardStore = create<WizardState>((set) => ({
  ...initialState,
  setWizardId: (wizardId) => set({ wizardId }),
  setStage: (stage) => set({ stage }),
  setCredential: (credential) => set({ credential }),
  setCredentialFields: (kbId, kbName, accessToken) =>
    set({
      credential: { kbId, kbName, token: accessToken },
    }),
  setKbInfo: (kbInfo) => set({ kbInfo }),
  setDiagnoseResult: (result) =>
    set({
      kbInfo: result.kbInfo,
      tree: result.tree,
      docCount: result.docCount,
      summary: result.summary,
    }),
  setProducts: (products) => set({ products }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setJobId: (jobId) => set({ jobId }),
  setJobStatus: (jobStatus) => set({ jobStatus }),
  reset: () => set(initialState),
}))

export function getKbId(): string {
  return useWizardStore.getState().credential?.kbId ?? ''
}

export function getKbName(): string {
  return useWizardStore.getState().credential?.kbName ?? ''
}

export function getAccessToken(): string {
  return useWizardStore.getState().credential?.token ?? ''
}
