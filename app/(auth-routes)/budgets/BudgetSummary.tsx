const getBudgetProgressColor = (progress: number) => {
  if (progress >= 100) return "bg-red-600";
  if (progress >= 75) return "bg-orange-500";
  return "bg-green-500";
}; 