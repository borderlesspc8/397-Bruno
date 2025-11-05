import { motion } from "framer-motion";

interface DataTableColumn<T> {
  key: string;
  label: string;
  render?: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  title: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title
}: DataTableProps<T>) {
  return (
    <div className="ios26-card p-6 space-y-4">
      <div className="text-sm font-bold text-foreground mb-4">
        {title}
      </div>
      <div className="overflow-auto max-h-[280px] rounded-xl border border-border/50">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-[hsl(var(--orange-light))] to-[hsl(var(--yellow-light))] border-b border-border sticky top-0">
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key}
                  className={`px-4 py-3 font-semibold text-foreground ${
                    column.align === 'right' ? 'text-right' : 
                    column.align === 'center' ? 'text-center' : 
                    'text-left'
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {data.map((item, index) => (
              <motion.tr 
                key={index} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-[hsl(var(--orange-light))]/30 transition-colors duration-200"
              >
                {columns.map((column) => {
                  const content = column.render 
                    ? column.render(item, index)
                    : item[column.key];
                  
                  return (
                    <td 
                      key={column.key}
                      className={`px-4 py-3 ${
                        column.align === 'right' ? 'text-right' : 
                        column.align === 'center' ? 'text-center' : 
                        'text-left'
                      }`}
                    >
                      {content}
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

