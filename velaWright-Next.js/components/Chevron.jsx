const shadow = "drop-shadow(0 1px 2px rgba(0,0,0,0.45))"

const svgStyle = (small) => ({
  display: 'inline-block',
  verticalAlign: 'middle',
  flexShrink: 0,
  marginLeft: small ? '4px' : '10px',
  marginRight: small ? '2px' : '0px',
  filter: shadow,
  overflow: 'visible',
})

export default function Chevron({ type, small = false }) {
  if (type === "basic") {
    return (
      <svg
        width={small ? 9 : 14} height={small ? 6 : 10}
        viewBox="0 0 20 14"
        style={svgStyle(small)}
        aria-label="Promoted from Lead"
      >
        <polyline
          points="1,12 10,2 19,12"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (type === "ornate") {
    return (
      <svg
        width={small ? 11 : 17} height={small ? 12 : 19}
        viewBox="-2 -2 24 24"
        style={svgStyle(small)}
        aria-label="Started as an Endeavor"
      >
        <polyline
          points="1,8 10,1 19,8"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="1,16 10,9 19,16"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (type === "grand") {
    return (
      <svg
        width={small ? 11 : 17} height={small ? 15 : 23}
        viewBox="-2 -2 24 28"
        style={svgStyle(small)}
        aria-label="Promoted from Trace to Deployment"
      >
        <polyline
          points="1,8 10,1 19,8"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="1,16 10,9 19,16"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="1,24 10,17 19,24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return null
}
