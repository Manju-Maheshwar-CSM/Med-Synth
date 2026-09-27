import { motion } from "framer-motion";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-[1.7rem]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
