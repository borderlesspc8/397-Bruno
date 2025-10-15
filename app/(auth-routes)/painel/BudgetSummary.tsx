const getProgressColor = (progress: number) => {
  if (progress >= 100) {
    return "bg-yellow-600";
  }
  if (progress >= 75) {
    return "bg-yellow-500";
  }
  return "bg-yellow-400";
}; 
