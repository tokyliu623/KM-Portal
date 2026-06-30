import { create } from 'zustand'
import type {
  WizardStage,
  KBCredential,
  KBInfo,
  TreeNode,
  ProductItem,
  DiagnoseResult,
} from '../../services/wizard'

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
  setWizardId: (id: string | null) => void
  setStage: (stage: WizardStage) => void
  setCredential: (credential: KBCredential | null) => void
  setKbInfo: (info: KBInfo | null) => void
  setDiagnoseResult: (result: DiagnoseResult) => void
  setProducts: (products: ProductItem[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
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
}

export const useWizardStore = create<WizardState>((set) => ({
  ...initialState,
  setWizardId: (wizardId) => set({ wizardId }),
  setStage: (stage) => set({ stage }),
  setCredential: (credential) => set({ credential }),
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
  reset: () => set(initialState),
}))