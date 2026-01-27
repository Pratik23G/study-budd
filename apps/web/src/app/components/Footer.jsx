import Link from 'next/link'
import Image from 'next/image'
export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white py-25 px-4">
            <div className = "max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Contact form creation is done from here*/}
                <div>
                    <h3 className="text-4xl font-bold mb-4"> Contact Us</h3>
                    <form>
                        {/* We will add key compnenets here*/}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">
                                Your Name
                            </label>
                            <input type="text" placeholder="Enter your full name" 
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                            </input>
                            <label className="block text-sm font-medium mb-2">
                                Your Email
                            </label>
                            <input type="text" placeholder="Enter your email address" 
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                            </input>
                            {/* Message Text Field*/}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    Your Message
                                </label>
                                <textarea placeholder="Please let us know if you have any questions.."
                                    rows={5}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-vertical"
                                >
                                </textarea>

                                {/* Submit Button */}
                                <div>
                                    <button 
                                        type="submit" className="w-full bg-blue-600 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200">
                                            Send Message
                                        </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Navigation links Section*/}
                <div>
                    <h3 className="text-4xl font-bold bold mb-4">Quick Links</h3>
                    {/* Here we will add more links here */}
                    <div className="inline-flex items-center justify-center gap-3">
                        <div>
                            <Link href="/" className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                                </svg>
                            </Link>
                        </div>

                        <div>
                            <Link href="/features" className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                </svg>
                            </Link>
                        </div>

                        <div>
                            <Link href="/pricing" className= "inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                                </svg>
                            </Link>
                        </div>

                        <div>
                            <Link href="/quizzes" className= "inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                            </Link>
                        </div>
                    </div>

                </div>

            </div> 
        </footer>
    )
}