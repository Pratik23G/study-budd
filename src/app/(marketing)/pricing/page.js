export default function Page() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 text-gray-900 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-12 sm:mb-16">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
                        Choose Your Plan
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                        Select the perfect plan for your needs. Upgrade or downgrade at any time.
                    </p>
                </div>

                {/* Pricing Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Basic Plan */}
                    <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 flex flex-col h-full">
                        <div className="text-center mb-6">
                            <h3 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">
                                Basic Plan
                            </h3>
                            <p className="text-gray-600 text-base sm:text-lg">
                                Perfect for getting started
                            </p>
                        </div>
                        
                        <div className="flex-grow">
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Basic pricing models
                                </li>
                                <li className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    24/7 Support
                                </li>
                                <li className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Basic Analytics
                                </li>
                            </ul>
                        </div>

                        <div className="text-center mt-auto">
                            <div className="mb-6">
                                <span className="text-sm text-gray-500">Starting at</span>
                                <div className="text-4xl sm:text-5xl font-bold text-green-600">
                                    $12.99
                                    <span className="text-lg text-gray-500 font-normal">/month</span>
                                </div>
                            </div>
                            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300">
                                Get Started
                            </button>
                        </div>
                    </div>

                    {/* Premium Plan */}
                    <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 flex flex-col h-full border-2 border-blue-500 relative">
                        {/* Popular Badge */}
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                Most Popular
                            </span>
                        </div>
                        
                        <div className="text-center mb-6">
                            <h3 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">
                                Premium Plan
                            </h3>
                            <p className="text-gray-600 text-base sm:text-lg">
                                Best for growing businesses
                            </p>
                        </div>
                        
                        <div className="flex-grow">
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Everything in Basic
                                </li>
                                <li className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Advanced Analytics
                                </li>
                                <li className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Priority Support
                                </li>
                                <li className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Custom Integrations
                                </li>
                            </ul>
                        </div>

                        <div className="text-center mt-auto">
                            <div className="mb-6">
                                <span className="text-sm text-gray-500">Starting at</span>
                                <div className="text-4xl sm:text-5xl font-bold text-blue-600">
                                    $29.99
                                    <span className="text-lg text-gray-500 font-normal">/month</span>
                                </div>
                            </div>
                            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300">
                                Get Started
                            </button>
                        </div>
                    </div>

                    {/* Pro Plan */}
                    <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 flex flex-col h-full md:col-span-2 lg:col-span-1">
                        <div className="text-center mb-6">
                            <h3 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">
                                Pro Plan
                            </h3>
                            <p className="text-gray-600 text-base sm:text-lg">
                                For enterprise solutions
                            </p>
                        </div>
                        
                        <div className="flex-grow">
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Everything in Premium
                                </li>
                                <li className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    White-label Solution
                                </li>
                                <li className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Dedicated Account Manager
                                </li>
                                <li className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    SLA Guarantee
                                </li>
                            </ul>
                        </div>

                        <div className="text-center mt-auto">
                            <div className="mb-6">
                                <span className="text-sm text-gray-500">Starting at</span>
                                <div className="text-4xl sm:text-5xl font-bold text-purple-600">
                                    $49.99
                                    <span className="text-lg text-gray-500 font-normal">/month</span>
                                </div>
                            </div>
                            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300">
                                Contact Sales
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="text-center mt-12 sm:mt-16">
                    <p className="text-gray-600 mb-4">
                        All plans include a 14-day free trial. No credit card required.
                    </p>
                    <p className="text-sm text-gray-500">
                        Questions? <a href="#" className="text-blue-600 hover:text-blue-700 underline">Contact our sales team</a>
                    </p>
                </div>
            </div>
        </main>
    );
}