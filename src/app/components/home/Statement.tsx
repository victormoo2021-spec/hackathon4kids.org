import MaskLines from './MaskLines'

export default function Statement() {
  return (
    <section id="class-size" aria-labelledby="class-size-title" className="container-x section-y pb-0">
      <MaskLines id="class-size-title" lines={['One instructor.', 'Up to 20 kids.']} dimFrom={1} hl="20" anchor="r" className="max-w-5xl" />
    </section>
  )
}
