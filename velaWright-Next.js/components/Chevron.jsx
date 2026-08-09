const shadow = "drop-shadow(0 1px 2px rgba(0,0,0,0.45))"

export default function Chevron({ type }) {
  if (type === "basic") {
    return (
      <svg
        width="14" height="10"
        viewBox="0 0 20 14"
        className="inline-block align-middle ml-3 mr-1 flex-shrink-0"
        style={{ filter: shadow }}
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
        width="17" height="19"
        viewBox="-2 -2 24 24"
        className="inline-block align-middle ml-3 mr-1 flex-shrink-0"
        style={{ filter: shadow }}
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
        width="17" height="23"
        viewBox="-2 -2 24 28"
        className="inline-block align-middle ml-3 mr-1 flex-shrink-0"
        style={{ filter: shadow }}
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
