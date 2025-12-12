import * as SDK from "@zoho-corp/office-integrator-sdk";

let isInitialized = false;

/**
 * Initialize Zoho Office Integrator SDK
 */
export async function initializeZohoSDK(): Promise<void> {
    if (isInitialized) return;

    const apiKey = process.env.ZOHO_API_KEY;
    const datacenter = process.env.ZOHO_DATACENTER || 'in';

    if (!apiKey) {
        throw new Error('ZOHO_API_KEY environment variable is required');
    }

    // Get datacenter based on environment variable
    let environment: SDK.Environment;
    switch (datacenter.toLowerCase()) {
        case 'com':
            environment = SDK.Environment.PRODUCTION;
            break;
        case 'in':
            environment = new SDK.Environment("https://api.office-integrator.zoho.in", "zoho.in", null, null);
            break;
        case 'eu':
            environment = new SDK.Environment("https://api.office-integrator.zoho.eu", "zoho.eu", null, null);
            break;
        case 'au':
            environment = new SDK.Environment("https://api.office-integrator.zoho.com.au", "zoho.com.au", null, null);
            break;
        default:
            environment = new SDK.Environment("https://api.office-integrator.zoho.in", "zoho.in", null, null);
    }

    // Create authentication
    const auth = new SDK.APIKey(apiKey, SDK.Authentication.HEADER);

    // Initialize SDK
    const sdkConfig = new SDK.SDKConfigBuilder()
        .pickSSLCertificate(true)
        .autoRefreshFields(true)
        .build();

    await new SDK.InitializeBuilder()
        .environment(environment)
        .authentication(auth)
        .SDKConfig(sdkConfig)
        .initialize();

    isInitialized = true;
    console.log('Zoho Office Integrator SDK initialized successfully');
}

/**
 * Get datacenter domain for API calls
 */
export function getZohoDomain(): string {
    const datacenter = process.env.ZOHO_DATACENTER || 'in';

    switch (datacenter.toLowerCase()) {
        case 'com':
            return 'https://api.office-integrator.zoho.com';
        case 'in':
            return 'https://api.office-integrator.zoho.in';
        case 'eu':
            return 'https://api.office-integrator.zoho.eu';
        case 'au':
            return 'https://api.office-integrator.zoho.com.au';
        default:
            return 'https://api.office-integrator.zoho.in';
    }
}
