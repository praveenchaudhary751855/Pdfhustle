export default function PrivacyPage() {
    return (
        <div className="pt-24 pb-16 min-h-screen">
            <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Privacy Policy
                        </h1>
                        <p className="text-gray-600">
                            Last updated: December 2024
                        </p>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
                        <div className="prose prose-lg max-w-none text-gray-600">
                            <section className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                                <p>
                                    At pdfhustle, we take your privacy seriously. This Privacy Policy explains how we collect,
                                    use, and protect your information when you use our PDF tools and services.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Files You Upload</h3>
                                <p className="mb-4">
                                    When you use our tools, you may upload PDF files, images, or other documents. These files are:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 mb-4">
                                    <li>Processed temporarily on our servers</li>
                                    <li>Automatically deleted within 1 hour after processing</li>
                                    <li>Never shared with third parties</li>
                                    <li>Not used for any purpose other than providing our services</li>
                                </ul>

                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Usage Information</h3>
                                <p>
                                    We may collect anonymous usage data to improve our services, including page views,
                                    feature usage, and general analytics. This data does not personally identify you.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>To provide PDF editing and conversion services</li>
                                    <li>To improve and optimize our tools</li>
                                    <li>To respond to your inquiries and support requests</li>
                                    <li>To detect and prevent abuse or security issues</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">4. Data Security</h2>
                                <p>
                                    We implement industry-standard security measures to protect your files and information:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 mt-4">
                                    <li>HTTPS encryption for all data transfers</li>
                                    <li>Secure server infrastructure</li>
                                    <li>Automatic file deletion after processing</li>
                                    <li>No long-term storage of user files</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">5. Cookies</h2>
                                <p>
                                    We use minimal cookies necessary for the website to function properly. We do not use
                                    tracking cookies for advertising purposes.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">6. Third-Party Services</h2>
                                <p>
                                    We may use third-party services for analytics and hosting. These services have their
                                    own privacy policies and we recommend reviewing them.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">7. Your Rights</h2>
                                <p>You have the right to:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-4">
                                    <li>Request information about your data</li>
                                    <li>Request deletion of your data</li>
                                    <li>Opt out of analytics tracking</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">8. Contact Us</h2>
                                <p>
                                    If you have questions about this Privacy Policy, please contact us at{' '}
                                    <a href="mailto:privacy@pdfhustle.com" className="text-indigo-600 hover:text-indigo-700">
                                        privacy@pdfhustle.com
                                    </a>
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
