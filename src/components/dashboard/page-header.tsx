export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[40px] tracking-[-1.8px]">{title}</h1>
        {description && <p className="mt-2 max-w-[520px] text-[15px] text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white ${className}`}>{children}</div>
}
