import React from 'react'
import { useDeviceDetection } from '../hooks/useDeviceDetection'

export const DeviceInfo = () => {
  const device = useDeviceDetection()

  return (
    <div className="p-4 border rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
      <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
        Device Information
      </h3>
      
      <div className="space-y-2 text-sm">
        <div style={{ color: 'var(--text-secondary)' }}>
          <strong>Type:</strong> {device.type}
        </div>
        <div style={{ color: 'var(--text-secondary)' }}>
          <strong>Screen:</strong> {device.screenWidth} × {device.screenHeight}
        </div>
        <div style={{ color: 'var(--text-secondary)' }}>
          <strong>Orientation:</strong> {device.orientation}
        </div>
        <div style={{ color: 'var(--text-secondary)' }}>
          <strong>Touch Device:</strong> {device.isTouchDevice ? 'Yes' : 'No'}
        </div>
        <div style={{ color: 'var(--text-secondary)' }}>
          <strong>Pixel Ratio:</strong> {device.pixelRatio}
        </div>
        
        <div className="flex gap-2 mt-3">
          <span className={`px-2 py-1 rounded text-xs ${device.isMobile ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
            📱 Mobile
          </span>
          <span className={`px-2 py-1 rounded text-xs ${device.isTablet ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            📊 Tablet
          </span>
          <span className={`px-2 py-1 rounded text-xs ${device.isDesktop ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
            🖥️ Desktop
          </span>
        </div>
      </div>
    </div>
  )
}

export default DeviceInfo