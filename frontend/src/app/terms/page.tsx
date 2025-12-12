export default function TermsPage() {
    return (
        <div className="pt-24 pb-16 min-h-screen">
            <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Terms of Service
                        </h1>
                        <p className="text-gray-600">
                            Last updated: December 2024
                        </p>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
                        <div className="prose prose-lg max-w-none text-gray-600">
                            <section className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                                <p>
                                    By accessing and using pdfhustle, you agree to be bound by these Terms of Service.
                                    If you do not agree to these terms, please do not use our services.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
                                <p>
                                    pdfhustle provides online PDF editing and conversion tools, including but not limited to:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 mt-4">
                                    <li>PDF editing (text, highlights, annotations)</li>
                                    <li>Image to PDF conversion</li>
                                    <li>PDF to Word conversion</li>
                                    <li>PDF to Excel conversion</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">3. Acceptable Use</h2>
                                <p>You agree not to:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-4">
                                    <li>Upload malicious files or content</li>
                                    <li>Use the service for illegal purposes</li>
                                    <li>Attempt to hack or disrupt our services</li>
                                    <li>Upload copyrighted content you don't own</li>
                                    <li>Exceed reasonable usage limits</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">4. User Content</h2>
                                <p>
                                    You retain all rights to the files you upload. We do not claim ownership of your content.
                                    By uploading files, you grant us a temporary license to process them for the purpose of
                                    providing our services.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">5. Limitation of Liability</h2>
                                <p>
                                    pdfhustle is provided "as is" without warranties of any kind. We are not liable for:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 mt-4">
                                    <li>Data loss or corruption during processing</li>
                                    <li>Service interruptions or downtime</li>
                                    <li>Accuracy of converted documents</li>
                                    <li>Any indirect or consequential damages</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">6. File Size Limits</h2>
                                <p>
                                    We may impose limits on file sizes to ensure service quality. Current limits are:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 mt-4">
                                    <li>Maximum file size: 50 MB per file</li>
                                    <li>Maximum files per conversion: 50 files</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">7. Modifications to Service</h2>
                                <p>
                                    We reserve the right to modify, suspend, or discontinue any part of our service at any time
                                    without prior notice.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">8. Changes to Terms</h2>
                                <p>
                                    We may update these Terms of Service from time to time. Continued use of the service
                                    after changes constitutes acceptance of the new terms.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">9. Contact</h2>
                                <p>
                                    For questions about these Terms of Service, please contact us at{' '}
                                    <a href="mailto:legal@pdfhustle.com" className="text-indigo-600 hover:text-indigo-700">
                                        legal@pdfhustle.com
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
