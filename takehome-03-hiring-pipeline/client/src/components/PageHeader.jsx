function PageHeader({ actions = null, eyebrow, meta = null, subtitle, title }) {
  return (
    <div className="border-b border-slate-200/80 bg-white px-6 py-4 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-500">{eyebrow}</p>
          ) : null}
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2.5">
            <h1 className="truncate text-xl font-bold leading-7 text-slate-900">{title}</h1>
            {meta}
          </div>
          {subtitle ? <p className="mt-1 line-clamp-2 max-w-3xl text-sm leading-5 text-slate-500">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div> : null}
      </div>
    </div>
  );
}

export default PageHeader;
