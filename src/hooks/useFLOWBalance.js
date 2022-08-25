import PropTypes from 'prop-types'
import { fetchFLOWBalance } from '../helpers/fetchFLOWBalance.js'
import { fmtFlow } from '../utils/fmt-flow.js'
import useSWR from 'swr'

export default function useFLOWBalance(address) {
  const { data, error } = useSWR(address, fetchFLOWBalance)
  return {
    data: typeof data === 'undefined' ? undefined : fmtFlow(data),
    error,
    isLoading: typeof data === 'undefined' && !error
  }
}

useFLOWBalance.propTypes = {
  address: PropTypes.string
}
