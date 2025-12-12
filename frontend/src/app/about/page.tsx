export default function AboutPage() {
    return (
        <div className="pt-24 pb-16 min-h-screen">
            <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            About pdfhustle
                        </h1>
                        <p className="text-xl text-gray-600">
                            Making PDF work easy for everyone.
                        </p>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
                        <div className="prose prose-lg max-w-none">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
                            <p className="text-gray-600 mb-6">
                                At pdfhustle, we believe working with PDFs should be simple, fast, and accessible to everyone.
                                No bloated software downloads, no expensive subscriptions – just efficient tools that work
                                right in your browser.
                            </p>

                            <h2 className="text-2xl font-bold text-gray-900 mb-4">What We Offer</h2>
                            <ul className="text-gray-600 space-y-3 mb-6">
                                <li className="flex items-start gap-3">
                                    <svg className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span><strong>PDF Editor</strong> – Add text, highlight, annotate, and modify your PDFs</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <svg className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span><strong>Image to PDF</strong> – Convert multiple images into a single PDF</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <svg className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span><strong>PDF to Word</strong> – Convert PDFs to editable Word documents</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <svg className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span><strong>PDF to Excel</strong> – Extract tables and data into spreadsheets</span>
                                </li>
                            </ul>

                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Promise</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <h3 className="font-semibold text-gray-900 mb-2">🔒 Privacy First</h3>
                                    <p className="text-gray-600 text-sm">Your files are processed securely and deleted automatically. We never store or share your documents.</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <h3 className="font-semibold text-gray-900 mb-2">⚡ Lightning Fast</h3>
                                    <p className="text-gray-600 text-sm">Browser-based processing means no waiting for uploads. Get results in seconds.</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <h3 className="font-semibold text-gray-900 mb-2">🎯 Simple to Use</h3>
                                    <p className="text-gray-600 text-sm">No learning curve. Just upload, edit or convert, and download. That's it.</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <h3 className="font-semibold text-gray-900 mb-2">💸 Free to Use</h3>
                                    <p className="text-gray-600 text-sm">All basic features are free. No hidden fees or surprise charges.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
