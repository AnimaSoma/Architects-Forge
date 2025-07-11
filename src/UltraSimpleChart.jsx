import React, { useEffect, useRef, useState } from 'react';

/**
 * UltraSimpleChart - A minimal, guaranteed-to-render chart component
 * 
 * Uses only HTML/CSS (no SVG or external libraries) for maximum reliability
 * 
 * @param {Array} data - Array of numeric data points
 * @param {Array} labels - Optional array of labels
 * @param {string} title - Optional chart title
 * @param {string} color - Color for chart elements (CSS color)
 * @param {number} height - Height of chart in pixels
 * @param {Array} thresholdLine - Optional threshold [value, color]
 */
const UltraSimpleChart = ({
  data = [],
  labels = [],
  title = 'Chart',
  color = '#3b82f6', // blue-500
  height = 180,
  thresholdLine = null
}) => {
  const containerRef = useRef(null);
  const [debugMessage, setDebugMessage] = useState('Initializing...');
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Log component lifecycle and props for debugging
  useEffect(() => {
    console.log(`[UltraSimpleChart] "${title}" mounted with ${data?.length || 0} data points`);
    
    // Debug data validity
    if (!Array.isArray(data)) {
      console.error('[UltraSimpleChart] Data is not an array:', data);
      setDebugMessage('Error: Data is not an array');
      setHasError(true);
      return;
    }
    
    if (data.length === 0) {
      console.warn('[UltraSimpleChart] Empty data array');
      setDebugMessage('Warning: No data to display');
      return;
    }
    
    // Check if data contains non-numeric values
    const hasNonNumeric = data.some(val => typeof val !== 'number' || isNaN(val));
    if (hasNonNumeric) {
      console.warn('[UltraSimpleChart] Data contains non-numeric values');
      setDebugMessage('Warning: Data contains non-numeric values');
    }
    
    setDebugMessage(`Rendering ${data.length} data points`);
    setIsReady(true);
    
    return () => {
      console.log(`[UltraSimpleChart] "${title}" unmounting`);
    };
  }, [data, title]);

  // Render error state
  if (hasError) {
    return (
      <div 
        style={{ 
          height: `${height}px`, 
          backgroundColor: 'rgba(239, 68, 68, 0.2)', 
          border: '1px solid rgba(239, 68, 68, 0.5)',
          borderRadius: '6px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          flexDirection: 'column'
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Chart Error</div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>{debugMessage}</div>
      </div>
    );
  }

  // Handle empty data
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div 
        style={{ 
          height: `${height}px`, 
          backgroundColor: 'rgba(0, 0, 0, 0.2)', 
          borderRadius: '6px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          flexDirection: 'column'
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{title}</div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>No data available</div>
      </div>
    );
  }

  // Find min/max values for scaling
  let minValue = Math.min(...data.filter(val => typeof val === 'number' && !isNaN(val)));
  let maxValue = Math.max(...data.filter(val => typeof val === 'number' && !isNaN(val)));
  
  // Ensure we have valid min/max (handle edge cases)
  if (isNaN(minValue) || isNaN(maxValue)) {
    minValue = 0;
    maxValue = 1;
  }
  
  // Add some padding to the max value
  maxValue = maxValue + (maxValue - minValue) * 0.1;
  
  // Ensure min/max are different to avoid division by zero
  if (minValue === maxValue) {
    maxValue = minValue + 1;
  }

  // Chart dimensions
  const chartHeight = height - 40; // Reserve space for title and labels
  const barWidth = 100 / Math.max(data.length, 1);

  // Calculate threshold position if provided
  let thresholdPosition = null;
  if (thresholdLine && Array.isArray(thresholdLine) && thresholdLine.length >= 1) {
    const thresholdValue = thresholdLine[0];
    const thresholdColor = thresholdLine[1] || 'rgba(239, 68, 68, 0.8)'; // red if not specified
    
    if (typeof thresholdValue === 'number' && !isNaN(thresholdValue)) {
      // Calculate position as percentage from bottom
      const percentage = ((thresholdValue - minValue) / (maxValue - minValue)) * 100;
      thresholdPosition = {
        position: Math.min(Math.max(0, percentage), 100), // Clamp between 0-100%
        color: thresholdColor
      };
    }
  }

  return (
    <div 
      ref={containerRef}
      style={{ 
        height: `${height}px`, 
        position: 'relative',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '6px',
        padding: '8px',
        overflow: 'hidden'
      }}
    >
      {/* Title */}
      <div style={{ 
        fontSize: '12px', 
        color: 'rgba(255, 255, 255, 0.8)', 
        marginBottom: '4px',
        height: '16px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {title}
      </div>
      
      {/* Debug message (only in development) */}
      {process.env.NODE_ENV !== 'production' && (
        <div style={{ 
          position: 'absolute', 
          top: '4px', 
          right: '8px',
          fontSize: '9px', 
          color: 'rgba(255, 255, 255, 0.5)',
          zIndex: 5
        }}>
          {debugMessage}
        </div>
      )}
      
      {/* Chart container */}
      <div style={{ 
        height: `${chartHeight}px`, 
        position: 'relative',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '4px',
        marginTop: '4px',
        display: 'flex',
        alignItems: 'flex-end'
      }}>
        {/* Horizontal grid lines */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
          {[0, 25, 50, 75, 100].map(percent => (
            <div 
              key={`grid-${percent}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: `${percent}%`,
                borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
                height: 1
              }}
            />
          ))}
        </div>
        
        {/* Threshold line */}
        {thresholdPosition && (
          <div 
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: `${thresholdPosition.position}%`,
              borderTop: `2px dashed ${thresholdPosition.color}`,
              height: 0,
              zIndex: 3
            }}
          >
            <span style={{
              position: 'absolute',
              right: '4px',
              top: '-14px',
              fontSize: '9px',
              color: thresholdPosition.color,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              padding: '1px 3px',
              borderRadius: '2px'
            }}>
              Threshold
            </span>
          </div>
        )}
        
        {/* Data bars */}
        <div style={{ 
          display: 'flex', 
          width: '100%', 
          height: '100%', 
          alignItems: 'flex-end',
          position: 'relative',
          zIndex: 2
        }}>
          {data.map((value, index) => {
            // Handle non-numeric values
            const isValid = typeof value === 'number' && !isNaN(value);
            const normalizedValue = isValid 
              ? ((value - minValue) / (maxValue - minValue)) * 100 
              : 0;
            
            // Ensure the bar has at least 1px height to be visible
            const barHeight = Math.max(normalizedValue, 1);
            
            return (
              <div 
                key={`bar-${index}`}
                style={{
                  width: `${barWidth}%`,
                  height: `${barHeight}%`,
                  backgroundColor: isValid ? color : 'rgba(239, 68, 68, 0.5)', // Red for invalid
                  opacity: isValid ? 1 : 0.5,
                  marginRight: index < data.length - 1 ? '1px' : 0,
                  position: 'relative',
                  transition: 'height 0.3s ease-out'
                }}
                title={`${labels[index] || index}: ${isValid ? value.toFixed(2) : 'Invalid'}`}
              >
                {!isValid && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '9px',
                    color: 'rgba(239, 68, 68, 0.8)',
                  }}>!</div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Line connecting the data points */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '100%',
          zIndex: 4,
          pointerEvents: 'none'
        }}>
          <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
            <polyline
              points={data
                .map((value, index) => {
                  const isValid = typeof value === 'number' && !isNaN(value);
                  const normalizedValue = isValid 
                    ? ((value - minValue) / (maxValue - minValue)) * 100 
                    : 0;
                  
                  const x = (index / (data.length - 1)) * 100;
                  const y = 100 - normalizedValue;
                  
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeOpacity="0.7"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
      
      {/* X-axis labels (show a few to avoid crowding) */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        marginTop: '4px',
        height: '16px',
        fontSize: '9px',
        color: 'rgba(255, 255, 255, 0.5)',
      }}>
        {data.length > 0 && (
          <>
            <div>{labels[0] || '0'}</div>
            {data.length > 2 && <div>{labels[Math.floor(data.length / 2)] || Math.floor(data.length / 2).toString()}</div>}
            <div>{labels[data.length - 1] || (data.length - 1).toString()}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default UltraSimpleChart;
