// The yellow eye path. StoryStage sets the path and scrubs its stroke-dashoffset.
export default function Trail({ pathRef }: { pathRef: React.Ref<SVGPathElement> }) {
  return (
    <svg className="trail" aria-hidden>
      <path ref={pathRef} d="M0 0" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
