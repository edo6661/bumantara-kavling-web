const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-sm">
    <div className="relative flex items-center justify-center w-16 h-16">
      <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
    </div>
    <p className="mt-4 text-sm font-medium text-gray-500 animate-pulse">Memuat data...</p>
  </div>
);

export default PageLoader;