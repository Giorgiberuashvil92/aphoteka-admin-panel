"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const QUICKSHIPPER_BASE_URL = 'https://test-auth.quickshipper.ge';
const USERNAME = 'Ntsulik@gmail.com';
const PASSWORD = 'dAmpov-9roxcy-wyktyg';
async function testQuickshipperAuth() {
    console.log('🔑 Testing Quickshipper Authentication...\n');
    try {
        const basicAuth = Buffer.from('DeliveryApiClient:DeliveryApiSecret').toString('base64');
        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('scope', 'DeliveryApi');
        params.append('username', USERNAME);
        params.append('password', PASSWORD);
        const response = await (0, node_fetch_1.default)(`${QUICKSHIPPER_BASE_URL}/connect/token`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });
        if (!response.ok) {
            const error = await response.text();
            console.error('❌ Authentication failed:', response.status, error);
            return null;
        }
        const data = await response.json();
        console.log('✅ Authentication successful!');
        console.log('📝 Access Token:', data.access_token.substring(0, 50) + '...');
        console.log('⏱️  Expires in:', data.expires_in, 'seconds');
        console.log('🔐 Token type:', data.token_type);
        console.log('📦 Scope:', data.scope);
        console.log('');
        return data.access_token;
    }
    catch (error) {
        console.error('❌ Error during authentication:', error.message);
        return null;
    }
}
async function testDeliveryFees(token) {
    console.log('💰 Testing Delivery Fees Calculation...\n');
    try {
        const params = new URLSearchParams({
            FromStreetName: 'Elguja Amashukeli St, Tbilisi, Georgia',
            FromCityName: 'Tbilisi',
            FromLatitude: '41.7332044',
            FromLongitude: '44.7413653',
            ToStreetName: '2 Otar Oniashvili St, Tbilisi, Georgia',
            ToCityName: 'Tbilisi',
            ToLatitude: '41.7315215',
            ToLongitude: '44.7671514',
        });
        const url = `${QUICKSHIPPER_BASE_URL}/v1/order/fees?${params.toString()}`;
        console.log('🌐 Request URL:', url);
        console.log('');
        const response = await (0, node_fetch_1.default)(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            const error = await response.text();
            console.error('❌ Fees calculation failed:', response.status, error);
            return;
        }
        const data = await response.json();
        console.log('✅ Fees calculation successful!');
        console.log('📊 Response:', JSON.stringify(data, null, 2));
        console.log('');
        console.log('📦 Available Providers:', data.fees?.length || 0);
        console.log('📏 Distance:', data.distance, 'km');
        console.log('💵 Service Fee:', data.serviceFee, data.serviceFeeCurrency);
        if (data.fees && data.fees.length > 0) {
            console.log('');
            console.log('🚚 Delivery Options:');
            data.fees.forEach((provider) => {
                console.log(`\n  Provider: ${provider.providerName}`);
                console.log(`  Active: ${provider.isActive}`);
                console.log(`  Min Price: ${provider.minPrice} ${provider.prices[0]?.currency || ''}`);
                provider.prices.forEach((price) => {
                    console.log(`    - ${price.deliverySpeedName}: ${price.amount} ${price.currency}`);
                    console.log(`      ${price.deliverySpeedDescription}`);
                });
            });
        }
    }
    catch (error) {
        console.error('❌ Error during fees calculation:', error.message);
    }
}
async function main() {
    console.log('🚀 Quickshipper API Test\n');
    console.log('='.repeat(60));
    console.log('');
    const token = await testQuickshipperAuth();
    if (token) {
        await testDeliveryFees(token);
    }
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Test completed!\n');
}
main();
//# sourceMappingURL=test-quickshipper.js.map