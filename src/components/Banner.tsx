import * as React from 'react'
import styled from 'styled-components'
import logo from '../assets/flow-developers.png'

const SBannerWrapper = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`

const SBanner = styled.div`
  width: 275px;
  height: 53px;
  background: url(${logo}) no-repeat;
  background-size: cover;
  background-position: center;
`

const Banner = () => (
  <SBannerWrapper>
    <SBanner />
  </SBannerWrapper>
)

export default Banner
