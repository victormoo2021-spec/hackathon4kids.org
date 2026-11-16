import MaskLines from './MaskLines'

export default function Statement() {
  return (
    <section id="class-size" aria-labelledby="class-size-title" className="container-x section-y">
      <MaskLines id="class-size-title" lines={['One instructor.', 'Up to 20 kids.']} dimFrom={1} anchor="r" className="max-w-5xl" />
    </section>
  )
}
