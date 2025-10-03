import { useState, useEffect } from 'react'

export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    type: 'desktop', // 'mobile', 'tablet', 'desktop'
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 0,
    screenHeight: 0,
    isTouchDevice: false
  })

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const width = window.innerWidth
      const height = window.innerHeight
      
      // Touch device detection
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // User agent patterns
      const mobilePattern = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i
      const tabletPattern = /tablet|ipad|playbook|silk/i
      
      // Combined detection (user agent + screen size)
      let deviceType = 'desktop'
      let isMobile = false
      let isTablet = false
      let isDesktop = true
      
      if (mobilePattern.test(userAgent) || width <= 768) {
        deviceType = 'mobile'
        isMobile = true
        isTablet = false
        isDesktop = false
      } else if (tabletPattern.test(userAgent) || (width > 768 && width <= 1024 && isTouchDevice)) {
        deviceType = 'tablet'
        isMobile = false
        isTablet = true
        isDesktop = false
      }
      
      setDeviceInfo({
        type: deviceType,
        isMobile,
        isTablet,
        isDesktop,
        screenWidth: width,
        screenHeight: height,
        isTouchDevice,
        // Additional info
        orientation: width > height ? 'landscape' : 'portrait',
        pixelRatio: window.devicePixelRatio || 1
      })
    }

    // Initial detection
    detectDevice()
    
    // Listen for resize events (orientation changes, window resize)
    window.addEventListener('resize', detectDevice)
    window.addEventListener('orientationchange', detectDevice)
    
    return () => {
      window.removeEventListener('resize', detectDevice)
      window.removeEventListener('orientationchange', detectDevice)
    }
  }, [])

  return deviceInfo
}

// Utility functions for specific checks
export const isMobileDevice = () => {
  return /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase())
}

export const isTabletDevice = () => {
  return /tablet|ipad|playbook|silk/i.test(navigator.userAgent.toLowerCase())
}

export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export default useDeviceDetection