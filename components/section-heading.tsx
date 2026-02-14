type Props = { title: string; subtitle?: string }
export default function SectionHeading({ title, subtitle }: Props) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-semibold text-[hsl(var(--primary))]">{title}</h2>
      {subtitle ? <p className="mt-2 text-[hsl(var(--muted-foreground))]">{subtitle}</p> : null}
    </div>
  )
}
