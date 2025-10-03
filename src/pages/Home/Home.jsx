export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">

      {/* Hero Section */}
      <section className="flex-1 flex flex-col md:flex-row items-center justify-between px-8 md:px-20 py-16 bg-gradient-to-r from-green-50 to-green-100">
        <div className="md:w-1/2 space-y-6">
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Smart <span className="text-green-600">Poultry Farming</span> Management
          </h2>
          <p className="text-lg text-gray-600">
            Track your flocks, feed, production, and health in one simple dashboard. 
            Designed for farmers, hatcheries, and feed mill operators.
          </p>
          <div className="space-x-4">
            <button className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700">
              Get Started
            </button>
            <button className="px-6 py-3 bg-gray-200 rounded-lg shadow hover:bg-gray-300">
              Learn More
            </button>
          </div>
        </div>
        <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center">
          <img 
            src="https://illustrations.popsy.co/green/farm.svg" 
            alt="Poultry dashboard preview"
            className="w-4/5"
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-8 md:px-20 py-16">
        <h3 className="text-3xl font-bold text-center mb-10">Farm Management Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <h4 className="text-xl font-semibold mb-3">Flock Tracking</h4>
            <p className="text-gray-600">
              Monitor flock growth, mortality, and production cycles in real-time.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <h4 className="text-xl font-semibold mb-3">Feed Management</h4>
            <p className="text-gray-600">
              Record feed usage, calculate FCR (Feed Conversion Ratio), and manage costs.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <h4 className="text-xl font-semibold mb-3">Health Monitoring</h4>
            <p className="text-gray-600">
              Track vaccinations, diseases, and medication schedules for better biosecurity.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <h4 className="text-xl font-semibold mb-3">Egg & Meat Production</h4>
            <p className="text-gray-600">
              Record daily egg production or broiler growth rates for profitability insights.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <h4 className="text-xl font-semibold mb-3">Inventory & Expenses</h4>
            <p className="text-gray-600">
              Manage medicine stock, vaccines, and other farm supplies with cost tracking.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <h4 className="text-xl font-semibold mb-3">Reports & Analytics</h4>
            <p className="text-gray-600">
              Generate detailed farm performance reports with charts and KPIs.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="px-8 md:px-20 py-16 bg-gray-100">
        <h3 className="text-3xl font-bold text-center mb-6">About PoultryCare</h3>
        <p className="max-w-3xl mx-auto text-center text-gray-600">
          PoultryCare is a modern farm management platform built on the MERN stack. 
          It helps poultry farmers, hatcheries, and feed producers run smarter, more 
          profitable operations by providing real-time data and analytics.
        </p>
      </section>

      {/* Contact Section */}
      <section id="contact" className="px-8 md:px-20 py-16">
        <h3 className="text-3xl font-bold text-center mb-6">Contact Us</h3>
        <form className="max-w-xl mx-auto space-y-4">
          <input 
            type="text" 
            placeholder="Your Name" 
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400"
          />
          <input 
            type="email" 
            placeholder="Your Email" 
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400"
          />
          <textarea 
            placeholder="Your Message" 
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400 h-32"
          ></textarea>
          <button 
            type="submit" 
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 w-full"
          >
            Send Message
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer className="bg-green-700 text-gray-100 text-center py-6">
        <p>&copy; {new Date().getFullYear()} PoultryCare. All rights reserved.</p>
      </footer>
    </div>
  );
}
