import { createGlobalStyle } from 'styled-components'
import { createRoot } from 'react-dom/client'
import { ClientContextProvider } from './contexts/ClientContext'
import { JsonRpcContextProvider } from './contexts/JsonRpcContext'
import { ChainDataContextProvider } from './contexts/ChainDataContext'
import { TransactionContextProvider } from './contexts/TransactionContext'
import App from './App'
import { globalStyle } from './styles'
const GlobalStyle = createGlobalStyle`
  ${globalStyle}
`

declare global {
  // tslint:disable-next-line
  interface Window {
    blockies: any
  }
}

const container = document.getElementById('root')
const root = createRoot(container!)
root.render(
  <>
    <GlobalStyle />
    <ChainDataContextProvider>
      <ClientContextProvider>
        <JsonRpcContextProvider>
          <TransactionContextProvider>
            <App />
          </TransactionContextProvider>
        </JsonRpcContextProvider>
      </ClientContextProvider>
    </ChainDataContextProvider>
  </>
)
