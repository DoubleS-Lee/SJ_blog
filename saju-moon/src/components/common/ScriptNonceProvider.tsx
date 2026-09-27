'use client'

import { createContext, useContext, type ReactNode } from 'react'

const ScriptNonceContext = createContext<string | undefined>(undefined)

export function useScriptNonce() {
  return useContext(ScriptNonceContext)
}

// Root layouts persist on client navigation. Keep the nonce of the document's
// CSP, rather than using a new nonce from a subsequent RSC response.
export default function ScriptNonceProvider({ nonce, children }: { nonce: string; children: ReactNode }) {
  return <ScriptNonceContext.Provider value={nonce}>{children}</ScriptNonceContext.Provider>
}
