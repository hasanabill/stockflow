export const Navbar = () => {
  return (
    <>
      <nav className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between">
            <div className="flex space-x-7">
              <div className="flex items-center py-4 px-2">
                <img src="/logo.png" alt="logo" className="h-10" />
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};
