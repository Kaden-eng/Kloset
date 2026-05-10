export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* Premium Navbar */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-stone-200/60 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold tracking-tight text-stone-900">Kloset</h1>
            </div>
            <div className="hidden md:flex items-center space-x-10">
              <a href="#inventory" className="text-stone-600 hover:text-stone-900 transition-colors duration-200 text-sm font-medium">Inventory</a>
              <a href="#analytics" className="text-stone-600 hover:text-stone-900 transition-colors duration-200 text-sm font-medium">Analytics</a>
              <a href="#pricing" className="text-stone-600 hover:text-stone-900 transition-colors duration-200 text-sm font-medium">Pricing</a>
              <button className="bg-stone-900 text-white px-5 py-2 text-sm font-medium hover:bg-stone-800 transition-colors duration-200 rounded-md">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Immersive Hero Section */}
      <section className="pt-32 pb-24 px-6 lg:px-8 bg-gradient-to-b from-white to-stone-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-8 text-stone-900 leading-tight">
            Kloset
          </h1>
          <p className="text-lg text-stone-600 max-w-xl mx-auto leading-relaxed">
            Inventory, pricing, and resale management in one workspace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <button className="bg-stone-900 text-white px-8 py-3 text-base font-medium hover:bg-stone-800 transition-colors duration-200 rounded-md shadow-sm">
              Get Started
            </button>
            <button className="border border-stone-300 text-stone-700 px-8 py-3 text-base font-medium hover:bg-stone-50 transition-colors duration-200 rounded-md">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Refined Product Cards Section */}
      <section id="inventory" className="py-24 px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-stone-900">Featured Items</h2>
            <p className="text-lg text-stone-600">Current marketplace highlights</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group cursor-pointer bg-white border border-stone-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-stone-300">
              <div className="aspect-[4/5] bg-stone-100 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=625&fit=crop&crop=center"
                  alt="Stone Island Jacket"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-semibold text-stone-900">Stone Island Shadow Project Jacket</h3>
                  <span className="text-sm font-bold text-stone-900">$1,450</span>
                </div>
                <p className="text-stone-600 text-xs mb-2">Size M • Excellent Condition</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">Listed 2 days ago</span>
                  <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded">Listed</span>
                </div>
              </div>
            </div>
            <div className="group cursor-pointer bg-white border border-stone-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-stone-300">
              <div className="aspect-[4/5] bg-stone-100 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=625&fit=crop&crop=center"
                  alt="Supreme Box Logo Tee"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-semibold text-stone-900">Supreme Box Logo Tee</h3>
                  <span className="text-sm font-bold text-stone-900">$285</span>
                </div>
                <p className="text-stone-600 text-xs mb-2">Size L • New with Tags</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">Sold 1 week ago</span>
                  <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded">Sold</span>
                </div>
              </div>
            </div>
            <div className="group cursor-pointer bg-white border border-stone-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-stone-300">
              <div className="aspect-[4/5] bg-stone-100 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=625&fit=crop&crop=center"
                  alt="Nike Air Force 1"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-semibold text-stone-900">Nike Air Force 1 '07</h3>
                  <span className="text-sm font-bold text-stone-900">$110</span>
                </div>
                <p className="text-stone-600 text-xs mb-2">Size 9 • Very Good</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">Listed 5 days ago</span>
                  <span className="text-xs text-stone-600 font-medium bg-stone-100 px-2 py-0.5 rounded">Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Realistic Dashboard Section */}
      <section id="analytics" className="py-24 px-6 lg:px-8 bg-stone-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-stone-900">Performance Dashboard</h2>
            <p className="text-lg text-stone-600">Track your business metrics</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 border border-stone-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-stone-900">$42,750</h3>
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded">+18%</span>
              </div>
              <p className="text-stone-600 text-sm">Total Revenue</p>
              <div className="mt-3 w-full bg-stone-200 rounded-full h-1.5">
                <div className="bg-stone-900 h-1.5 rounded-full w-4/5"></div>
              </div>
            </div>
            <div className="bg-white p-6 border border-stone-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-stone-900">247</h3>
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded">+12%</span>
              </div>
              <p className="text-stone-600 text-sm">Items Sold</p>
              <div className="mt-3 w-full bg-stone-200 rounded-full h-1.5">
                <div className="bg-stone-900 h-1.5 rounded-full w-3/5"></div>
              </div>
            </div>
            <div className="bg-white p-6 border border-stone-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-stone-900">$12,825</h3>
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded">+22%</span>
              </div>
              <p className="text-stone-600 text-sm">Net Profit</p>
              <div className="mt-3 w-full bg-stone-200 rounded-full h-1.5">
                <div className="bg-stone-900 h-1.5 rounded-full w-4/6"></div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-6 text-stone-900">Sales Overview</h3>
            <div className="h-48 bg-stone-100 rounded-lg flex items-center justify-center border border-stone-200">
              <span className="text-stone-500 text-sm">Revenue chart visualization</span>
            </div>
          </div>
        </div>
      </section>

      {/* Market Intelligence Section */}
      <section id="pricing" className="py-24 px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-stone-900">Market Intelligence</h2>
            <p className="text-lg text-stone-600">Data-driven pricing and insights</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold mb-8 text-stone-900">Comparable Sales</h3>
              <div className="space-y-4">
                <div className="border border-stone-200 rounded-lg p-5 bg-white hover:shadow-sm transition-shadow duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-stone-900">Stone Island Jacket</h4>
                      <p className="text-sm text-stone-600">Similar items sold recently</p>
                    </div>
                    <span className="text-base font-bold text-stone-900">$1,350 - $1,550</span>
                  </div>
                  <div className="text-xs text-stone-600">
                    Your listing: $1,450 • Market position: Competitive
                  </div>
                </div>
                <div className="border border-stone-200 rounded-lg p-5 bg-white hover:shadow-sm transition-shadow duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-stone-900">Supreme Box Logo Tee</h4>
                      <p className="text-sm text-stone-600">Similar items sold recently</p>
                    </div>
                    <span className="text-base font-bold text-stone-900">$260 - $310</span>
                  </div>
                  <div className="text-xs text-stone-600">
                    Your listing: $285 • Market position: Optimal
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-8 text-stone-900">Market Trends</h3>
              <div className="space-y-4">
                <div className="border border-stone-200 rounded-lg p-5 bg-white hover:shadow-sm transition-shadow duration-200">
                  <h4 className="font-medium mb-2 text-stone-900">Streetwear Demand</h4>
                  <p className="text-sm text-stone-600 mb-4">Supreme and similar brands showing strong growth</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-20 h-1.5 bg-stone-200 rounded-full">
                      <div className="w-4/5 h-1.5 bg-emerald-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-stone-900">+25%</span>
                  </div>
                </div>
                <div className="border border-stone-200 rounded-lg p-5 bg-white hover:shadow-sm transition-shadow duration-200">
                  <h4 className="font-medium mb-2 text-stone-900">Sneaker Market</h4>
                  <p className="text-sm text-stone-600 mb-4">Stable demand with seasonal fluctuations</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-20 h-1.5 bg-stone-200 rounded-full">
                      <div className="w-3/5 h-1.5 bg-amber-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-stone-900">+5%</span>
                  </div>
                </div>
                <div className="border border-stone-200 rounded-lg p-5 bg-white hover:shadow-sm transition-shadow duration-200">
                  <h4 className="font-medium mb-2 text-stone-900">Luxury Outerwear</h4>
                  <p className="text-sm text-stone-600 mb-4">High-value items with premium pricing</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-20 h-1.5 bg-stone-200 rounded-full">
                      <div className="w-4/6 h-1.5 bg-stone-600 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-stone-900">+15%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="bg-stone-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Kloset</h3>
              <p className="text-stone-400 leading-relaxed">Professional tools for serious resellers.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-3 text-stone-400">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Inventory</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Analytics</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-3 text-stone-400">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-stone-400">
                <li><a href="#" className="hover:text-white transition-colors duration-200">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-stone-800 mt-12 pt-8 text-center text-stone-400">
            <p>&copy; 2024 Kloset. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
