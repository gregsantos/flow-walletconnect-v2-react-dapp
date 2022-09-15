import Loader from '../components/Loader'
import { SContainer, STable, SRow, SKey, SValue } from '../components/shared'

import { SModalContainer, SModalTitle, SModalParagraph } from './shared'

interface RequestModalProps {
  pending: boolean
  data: any
  result: any
}

const RequestModal = (props: RequestModalProps) => {
  const { pending, data, result } = props
  const { name } = data?.session?.peer?.metadata || data?.pairing?.peerMetadata || ''
  return (
    <>
      {pending ? (
        <SModalContainer>
          <SModalTitle>{`Pending ${data?.method} Request`}</SModalTitle>
          <SContainer>
            <Loader />
            <SModalParagraph>{`Approve or reject request using your ${name} wallet`}</SModalParagraph>
          </SContainer>
        </SModalContainer>
      ) : result ? (
        <SModalContainer>
          <SModalTitle>
            {result.valid ? 'JSON-RPC Request Approved' : 'JSON-RPC Request Failed'}
          </SModalTitle>
          <STable>
            {Object.keys(result).map(key => (
              <SRow key={key}>
                <SKey>{key}</SKey>
                <SValue>{result[key].toString()}</SValue>
              </SRow>
            ))}
          </STable>
        </SModalContainer>
      ) : (
        <SModalContainer>
          <SModalTitle>{'JSON-RPC Request Rejected'}</SModalTitle>
        </SModalContainer>
      )}
    </>
  )
}

export default RequestModal
